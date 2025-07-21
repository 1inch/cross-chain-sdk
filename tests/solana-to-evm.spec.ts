/* eslint-disable max-lines-per-function */
/* eslint-disable no-console */
import {id, Interface, parseUnits} from 'ethers'
import {Clock} from 'litesvm'
import {add0x} from '@1inch/byte-utils'
import assert from 'assert'
import {ReadyEvmFork, setupEvm} from './utils/setup-evm'
import {getSecret} from './utils/secret'
import {ReadySolanaNode, setupSolana} from './utils/setup-solana'
import {USDC_EVM} from './utils/addresses'
import {newSolanaTx} from './utils/tx'
import Resolver from '../dist/contracts/Resolver.sol/Resolver.json'
import {NetworkEnum} from '../src/chains'

import {SvmCrossChainOrder} from '../src/cross-chain-order/svm/svm-cross-chain-order'
import {AuctionDetails} from '../src/domains/auction-details'
import {HashLock} from '../src/domains/hash-lock'
import {TimeLocks} from '../src/domains/time-locks'
import {EvmAddress, SolanaAddress} from '../src/domains/addresses'
import {SvmSrcEscrowFactory} from '../src/contracts/svm/svm-src-escrow-factory'
import {DstImmutablesComplement} from '../src/domains/immutables'
import {EscrowFactoryFacade} from '../src/contracts/evm/escrow-factory-facade'
import {now} from '../src/utils'

jest.setTimeout(1000 * 10 * 60)
jest.useFakeTimers({
    advanceTimers: true
})

describe('Solana to EVM', () => {
    let srcChain: ReadySolanaNode
    let dstChain: ReadyEvmFork
    const resolverContractEvm = new Interface(Resolver.abi)

    async function advanceNodeTime(duration = 10): Promise<void> {
        const [clock, dstBlock] = await Promise.all([
            srcChain.svm.getClock(),
            dstChain.provider.getBlock('latest', false)
        ])

        const newClock = new Clock(
            clock.slot,
            clock.epochStartTimestamp,
            clock.epoch,
            clock.leaderScheduleEpoch,
            clock.unixTimestamp + BigInt(duration)
        )

        await Promise.all([
            srcChain.svm.setClock(newClock),
            dstChain.provider.send('evm_setNextBlockTimestamp', [
                dstBlock!.timestamp + duration
            ])
        ])
        jest.advanceTimersByTime(duration * 1000)
    }

    beforeAll(async () => {
        srcChain = await setupSolana()
        dstChain = await setupEvm({chainId: NetworkEnum.ETHEREUM})
    })

    afterAll(async () => {
        // solana node is in memory, so no cleanup required
        dstChain.provider.destroy()
        await dstChain.localNode.stop()
    })

    it('should perform cross chain swap with single fill. Private withdraw', async () => {
        const secret = getSecret()

        const order = SvmCrossChainOrder.new(
            {
                maker: SolanaAddress.fromPublicKey(
                    srcChain.accounts.maker.publicKey
                ),
                receiver: EvmAddress.fromString(
                    await dstChain.maker.getAddress()
                ),
                srcToken: SolanaAddress.fromPublicKey(
                    srcChain.accounts.srcToken.publicKey
                ),
                dstToken: EvmAddress.fromString(USDC_EVM), // address on dst chain
                srcAmount: parseUnits('1', 9),
                minDstAmount: parseUnits('1000', 6)
            },
            {
                srcChainId: srcChain.chainId,
                dstChainId: dstChain.chainId,
                srcSafetyDeposit: 1000n,
                dstSafetyDeposit: 1000n,
                timeLocks: TimeLocks.fromDurations({
                    srcFinalityLock: 10n,
                    srcPrivateWithdrawal: 200n,
                    srcPublicWithdrawal: 100n,
                    srcPrivateCancellation: 100n,
                    dstFinalityLock: 10n,
                    dstPrivateWithdrawal: 100n,
                    dstPublicWithdrawal: 100n
                }),
                hashLock: HashLock.forSingleFill(secret)
            },
            {
                auction: new AuctionDetails({
                    duration: 120n,
                    startTime: BigInt(now()),
                    initialRateBump: 0,
                    points: [
                        {
                            coefficient: 0,
                            delay: 0
                        }
                    ]
                })
            },
            {
                allowMultipleFills: false
            }
        )

        const srcEscrowFactory = SvmSrcEscrowFactory.DEFAULT

        // user submits order creation onChain
        const createSrcIx = srcEscrowFactory.createOrder(order, {
            srcTokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID
        })

        await srcChain.connection.sendTransaction(newSolanaTx(createSrcIx), [
            srcChain.accounts.maker
        ])

        console.log('order created')

        const fillAmount = order.makingAmount
        const resolverSvm = SolanaAddress.fromBuffer(
            srcChain.accounts.resolver.publicKey.toBuffer()
        )
        const resolverEvm = EvmAddress.fromString(dstChain.addresses.resolver)

        let srcImmutables = order.toSrcImmutables(
            srcChain.chainId,
            resolverSvm,
            fillAmount
        )

        const createSrcEscrowIx = srcEscrowFactory.createEscrow(
            srcImmutables,
            order.auction,
            {
                tokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID
            }
        )

        await srcChain.connection.sendTransaction(
            newSolanaTx(createSrcEscrowIx),
            [srcChain.accounts.resolver]
        )
        console.log('src escrow created')

        const srcEscrowDeployedAt = srcChain.svm.getClock().unixTimestamp
        srcImmutables = srcImmutables.withDeployedAt(srcEscrowDeployedAt)

        // wait for finality
        await advanceNodeTime(20)

        assert(order.takerAsset instanceof EvmAddress)
        let dstImmutables = srcImmutables.withComplement(
            // actually should be parsed from src escrow tx
            DstImmutablesComplement.new({
                amount: order.takingAmount,
                safetyDeposit: order.dstSafetyDeposit,
                maker: order.receiver,
                token: order.takerAsset,
                taker: resolverEvm
            })
        )

        const dstEscrow = await dstChain.taker.send({
            to: resolverEvm.toString(),
            data: resolverContractEvm.encodeFunctionData('deployDst', [
                dstImmutables.build(),
                srcImmutables.timeLocks.toSrcTimeLocks().privateCancellation
            ]),
            value: order.dstSafetyDeposit
        })
        console.log('dst escrow created')
        dstImmutables = dstImmutables.withDeployedAt(dstEscrow.blockTimestamp)

        // user wait for finality, makes validation and shares secret
        await advanceNodeTime(20)

        const dstImplAddress = await dstChain.provider.call({
            to: dstChain.addresses.escrowFactory,
            data: id('ESCROW_DST_IMPLEMENTATION()').slice(0, 10)
        })

        const dstEscrowAddress = EscrowFactoryFacade.getFactory(
            dstChain.chainId,
            EvmAddress.fromString(dstChain.addresses.escrowFactory)
        ).getSrcEscrowAddress(
            dstImmutables,
            EvmAddress.fromString(add0x(dstImplAddress.slice(-40))) // decode from bytes32
        )

        const dstWithdraw = await dstChain.taker.send({
            to: resolverEvm.toString(),
            data: resolverContractEvm.encodeFunctionData('withdraw', [
                dstEscrowAddress.toString(),
                secret, // user shared secret at this point
                dstImmutables.build()
            ])
        })

        console.log('dst escrow withdrawn', dstWithdraw.txHash)

        const withdrawIx = srcEscrowFactory.withdrawPrivate(
            srcImmutables,
            Buffer.from(secret.slice(2), 'hex'),
            {
                tokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID
            }
        )

        await srcChain.connection.sendTransaction(newSolanaTx(withdrawIx), [
            srcChain.accounts.resolver
        ])
        console.log('src escrow withdrawn')
    })

    it('should perform cross chain swap with single fill. Public withdraw', async () => {
        const secret = getSecret()

        const order = SvmCrossChainOrder.new(
            {
                maker: SolanaAddress.fromPublicKey(
                    srcChain.accounts.maker.publicKey
                ),
                receiver: EvmAddress.fromString(
                    await dstChain.maker.getAddress()
                ),
                srcToken: SolanaAddress.fromPublicKey(
                    srcChain.accounts.srcToken.publicKey
                ),
                dstToken: EvmAddress.fromString(USDC_EVM), // address on dst chain
                srcAmount: parseUnits('1', 9),
                minDstAmount: parseUnits('1000', 6)
            },
            {
                srcChainId: srcChain.chainId,
                dstChainId: dstChain.chainId,
                srcSafetyDeposit: 1000n,
                dstSafetyDeposit: 1000n,
                timeLocks: TimeLocks.fromDurations({
                    srcFinalityLock: 10n,
                    srcPrivateWithdrawal: 200n,
                    srcPublicWithdrawal: 100n,
                    srcPrivateCancellation: 100n,
                    dstFinalityLock: 10n,
                    dstPrivateWithdrawal: 100n,
                    dstPublicWithdrawal: 100n
                }),
                hashLock: HashLock.forSingleFill(secret)
            },
            {
                auction: new AuctionDetails({
                    duration: 120n,
                    startTime: BigInt(now()),
                    initialRateBump: 0,
                    points: [
                        {
                            coefficient: 0,
                            delay: 0
                        }
                    ]
                })
            },
            {
                allowMultipleFills: false
            }
        )

        const srcEscrowFactory = SvmSrcEscrowFactory.DEFAULT

        // user submits order creation onChain
        const createSrcIx = srcEscrowFactory.createOrder(order, {
            srcTokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID
        })

        await srcChain.connection.sendTransaction(newSolanaTx(createSrcIx), [
            srcChain.accounts.maker
        ])

        console.log('order created')

        const fillAmount = order.makingAmount
        const resolverSvm = SolanaAddress.fromBuffer(
            srcChain.accounts.resolver.publicKey.toBuffer()
        )
        const resolverEvm = EvmAddress.fromString(dstChain.addresses.resolver)

        let srcImmutables = order.toSrcImmutables(
            srcChain.chainId,
            resolverSvm,
            fillAmount
        )

        const createSrcEscrowIx = srcEscrowFactory.createEscrow(
            srcImmutables,
            order.auction,
            {
                tokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID
            }
        )

        await srcChain.connection.sendTransaction(
            newSolanaTx(createSrcEscrowIx),
            [srcChain.accounts.resolver]
        )
        console.log('src escrow created')

        const srcEscrowDeployedAt = srcChain.svm.getClock().unixTimestamp
        srcImmutables = srcImmutables.withDeployedAt(srcEscrowDeployedAt)

        // wait for finality
        await advanceNodeTime(20)

        assert(order.takerAsset instanceof EvmAddress)
        let dstImmutables = srcImmutables.withComplement(
            // actually should be parsed from src escrow tx
            DstImmutablesComplement.new({
                amount: order.takingAmount,
                safetyDeposit: order.dstSafetyDeposit,
                maker: order.receiver,
                token: order.takerAsset,
                taker: resolverEvm
            })
        )

        const dstEscrow = await dstChain.taker.send({
            to: resolverEvm.toString(),
            data: resolverContractEvm.encodeFunctionData('deployDst', [
                dstImmutables.build(),
                srcImmutables.timeLocks.toSrcTimeLocks().privateCancellation
            ]),
            value: order.dstSafetyDeposit
        })
        console.log('dst escrow created')
        dstImmutables = dstImmutables.withDeployedAt(dstEscrow.blockTimestamp)

        // user wait for finality, makes validation and shares secret
        await advanceNodeTime(20)

        const dstImplAddress = await dstChain.provider.call({
            to: dstChain.addresses.escrowFactory,
            data: id('ESCROW_DST_IMPLEMENTATION()').slice(0, 10)
        })

        const dstEscrowAddress = EscrowFactoryFacade.getFactory(
            dstChain.chainId,
            EvmAddress.fromString(dstChain.addresses.escrowFactory)
        ).getSrcEscrowAddress(
            dstImmutables,
            EvmAddress.fromString(add0x(dstImplAddress.slice(-40))) // decode from bytes32
        )

        const dstWithdraw = await dstChain.taker.send({
            to: resolverEvm.toString(),
            data: resolverContractEvm.encodeFunctionData('withdraw', [
                dstEscrowAddress.toString(),
                secret, // user shared secret at this point
                dstImmutables.build()
            ])
        })

        console.log('dst escrow withdrawn', dstWithdraw.txHash)

        // wait for public withdraw
        await advanceNodeTime(200)

        const withdrawIx = srcEscrowFactory.withdrawPublic(
            srcImmutables,
            Buffer.from(secret.slice(2), 'hex'),
            SolanaAddress.fromPublicKey(
                srcChain.accounts.fallbackResolver.publicKey
            ),
            {
                tokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID
            }
        )

        await srcChain.connection.sendTransaction(newSolanaTx(withdrawIx), [
            srcChain.accounts.fallbackResolver
        ])
        console.log('src escrow withdrawn')
    })

    it('should cancel solana escrow using cancelPrivate', async () => {
        const secret = getSecret()

        const order = SvmCrossChainOrder.new(
            {
                maker: SolanaAddress.fromPublicKey(
                    srcChain.accounts.maker.publicKey
                ),
                receiver: EvmAddress.fromString(
                    await dstChain.maker.getAddress()
                ),
                srcToken: SolanaAddress.fromPublicKey(
                    srcChain.accounts.srcToken.publicKey
                ),
                dstToken: EvmAddress.fromString(USDC_EVM), // address on dst chain
                srcAmount: parseUnits('1', 9),
                minDstAmount: parseUnits('1000', 6)
            },
            {
                srcChainId: srcChain.chainId,
                dstChainId: dstChain.chainId,
                srcSafetyDeposit: 1000n,
                dstSafetyDeposit: 1000n,
                timeLocks: TimeLocks.fromDurations({
                    srcFinalityLock: 5n,
                    srcPrivateWithdrawal: 50n,
                    srcPublicWithdrawal: 30n,
                    srcPrivateCancellation: 20n,
                    dstFinalityLock: 5n,
                    dstPrivateWithdrawal: 50n,
                    dstPublicWithdrawal: 30n
                }),
                hashLock: HashLock.forSingleFill(secret)
            },
            {
                auction: new AuctionDetails({
                    duration: 120n,
                    startTime: BigInt(now()),
                    initialRateBump: 0,
                    points: [
                        {
                            coefficient: 0,
                            delay: 0
                        }
                    ]
                })
            },
            {
                allowMultipleFills: false
            }
        )

        const srcEscrowFactory = SvmSrcEscrowFactory.DEFAULT

        // user submits order creation onChain
        const createSrcIx = srcEscrowFactory.createOrder(order, {
            srcTokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID
        })

        await srcChain.connection.sendTransaction(newSolanaTx(createSrcIx), [
            srcChain.accounts.maker
        ])

        console.log('order created')

        const fillAmount = order.makingAmount
        const resolverSvm = SolanaAddress.fromBuffer(
            srcChain.accounts.resolver.publicKey.toBuffer()
        )

        const srcImmutables = order.toSrcImmutables(
            srcChain.chainId,
            resolverSvm,
            fillAmount
        )

        const createSrcEscrowIx = srcEscrowFactory.createEscrow(
            srcImmutables,
            order.auction,
            {
                tokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID
            }
        )

        await srcChain.connection.sendTransaction(
            newSolanaTx(createSrcEscrowIx),
            [srcChain.accounts.resolver]
        )
        console.log('src escrow created')

        // wait for cancellation to become available
        // finality + private withdrawal + public withdrawal
        await advanceNodeTime(90)

        const cancelIx = srcEscrowFactory.cancelPrivate(srcImmutables, {
            tokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID
        })

        await srcChain.connection.sendTransaction(newSolanaTx(cancelIx), [
            srcChain.accounts.resolver
        ])
        console.log('src escrow cancelled')
    })
})
