/* eslint-disable max-lines-per-function */
/* eslint-disable no-console */
import {Interface, parseUnits, parseEther, id} from 'ethers'
import {Clock} from 'litesvm'
import {UINT_40_MAX} from '@1inch/byte-utils'
import {add0x, randBigInt} from '@1inch/fusion-sdk'
import assert from 'assert'
import {ReadyEvmFork, setupEvm} from './utils/setup-evm.js'
import {getSecret} from './utils/secret.js'
import {ReadySolanaNode, setupSolana} from './utils/setup-solana.js'
import {WETH_EVM} from './utils/addresses.js'
import {getEvmFillData, newSolanaTx} from './utils/tx.js'
import Resolver from '../dist/contracts/Resolver.sol/Resolver.json'
import {NetworkEnum} from '../src/chains.js'

import {EvmCrossChainOrder} from '../src/cross-chain-order/index.js'
import {AuctionDetails} from '../src/domains/auction-details/index.js'
import {HashLock} from '../src/domains/hash-lock/index.js'
import {TimeLocks} from '../src/domains/time-locks/index.js'
import {EvmAddress, SolanaAddress} from '../src/domains/addresses/index.js'
import {SvmDstEscrowFactory} from '../src/contracts/index.js'
import {DstImmutablesComplement} from '../src/domains/index.js'
import {EscrowFactory} from '../src/contracts/evm/escrow-factory.js'
import {bufferFromHex} from '../src/utils/bytes.js'
import {now} from '../src/utils/index.js'

jest.setTimeout(1000 * 10 * 60)
jest.useFakeTimers({
    advanceTimers: true
})

describe('EVM to Solana', () => {
    let srcChain: ReadyEvmFork
    let dstChain: ReadySolanaNode
    const resolverContractEvm = new Interface(Resolver.abi)

    async function advanceNodeTime(duration = 10): Promise<void> {
        const [clock, dstBlock] = await Promise.all([
            dstChain.svm.getClock(),
            srcChain.provider.getBlock('latest', false)
        ])

        const newClock = new Clock(
            clock.slot,
            clock.epochStartTimestamp,
            clock.epoch,
            clock.leaderScheduleEpoch,
            clock.unixTimestamp + BigInt(duration)
        )

        await Promise.all([
            srcChain.provider.send('evm_setNextBlockTimestamp', [
                dstBlock!.timestamp + duration
            ]),
            dstChain.svm.setClock(newClock)
        ])
        jest.advanceTimersByTime(duration * 1000)
    }

    beforeAll(async () => {
        srcChain = await setupEvm({chainId: NetworkEnum.ETHEREUM})
        dstChain = await setupSolana()
    })

    afterAll(async () => {
        // solana node is in memory, so no cleanup required
        srcChain.provider.destroy()
        await srcChain.localNode.stop()
    })

    it('should perform cross chain swap with single fill. Private withdraw', async () => {
        const secret = getSecret()
        const maker = EvmAddress.fromString(await srcChain.maker.getAddress())
        const resolverSvm = SolanaAddress.fromBuffer(
            dstChain.accounts.resolver.publicKey.toBuffer()
        )
        const resolverEvm = EvmAddress.fromString(srcChain.addresses.resolver)

        // address on dst chain
        const takerAsset = SolanaAddress.fromPublicKey(
            dstChain.accounts.dstToken.publicKey
        )
        const receiver = SolanaAddress.fromPublicKey(
            dstChain.accounts.maker.publicKey
        )
        const makerBalanceDstBefore = dstChain.connection.getTokenBalance(
            receiver,
            takerAsset
        )

        const order = EvmCrossChainOrder.new(
            EvmAddress.fromString(srcChain.addresses.escrowFactory),
            {
                maker,
                receiver,
                makerAsset: EvmAddress.fromString(WETH_EVM),
                takerAsset,
                makingAmount: parseEther('1'),
                takingAmount: parseUnits('1000', 6)
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
                auction: AuctionDetails.noAuction(),
                whitelist: [
                    {
                        address: resolverEvm,
                        allowFrom: 0n
                    }
                ],
                resolvingStartTime: 0n
            },
            {
                allowMultipleFills: false,
                nonce: randBigInt(UINT_40_MAX)
            }
        )

        const signature = await srcChain.maker.signTypedData(
            order.getTypedData(srcChain.chainId)
        )

        let srcImmutables = order.toSrcImmutables(
            srcChain.chainId,
            resolverEvm,
            order.makingAmount
        )
        const srcEscrow = await srcChain.taker.send({
            to: resolverEvm.toString(),
            data: getEvmFillData(
                resolverContractEvm,
                order,
                signature,
                srcImmutables,
                srcChain
            ),
            value: order.srcSafetyDeposit
        })
        srcImmutables = srcImmutables.withDeployedAt(srcEscrow.blockTimestamp)

        // wait for finality
        await advanceNodeTime(20)

        assert(order.takerAsset instanceof SolanaAddress)
        assert(order.receiver instanceof SolanaAddress)

        let dstImmutables = srcImmutables.withComplement(
            // actually should be parsed from event in src escrow tx
            DstImmutablesComplement.new({
                amount: order.takingAmount,
                safetyDeposit: order.dstSafetyDeposit,
                maker: order.receiver,
                taker: resolverSvm,
                token: order.takerAsset,
                chainId: BigInt(NetworkEnum.SOLANA)
            })
        )

        const dstEscrowIx = SvmDstEscrowFactory.DEFAULT.createEscrow(
            dstImmutables,
            {
                tokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID,
                srcCancellationTimestamp:
                    srcImmutables.timeLocks.toSrcTimeLocks().publicCancellation
            }
        )

        dstChain.connection.sendTransaction(newSolanaTx(dstEscrowIx), [
            dstChain.accounts.resolver
        ])
        dstImmutables = dstImmutables.withDeployedAt(
            dstChain.svm.getClock().unixTimestamp
        )

        // wait for finality
        await advanceNodeTime(20)

        // user makes validation and shares secret

        const srcImplAddress = await srcChain.provider.call({
            to: srcChain.addresses.escrowFactory,
            data: id('ESCROW_SRC_IMPLEMENTATION()').slice(0, 10)
        })

        const srcEscrowAddress = new EscrowFactory(
            EvmAddress.fromString(srcChain.addresses.escrowFactory)
        ).getSrcEscrowAddress(
            srcImmutables,
            EvmAddress.fromString(add0x(srcImplAddress.slice(-40))) // decode from bytes32
        )

        await srcChain.taker.send({
            to: resolverEvm.toString(),
            data: resolverContractEvm.encodeFunctionData('withdraw', [
                srcEscrowAddress.toString(),
                secret, // user shared secret at this point
                srcImmutables.build()
            ])
        })
        console.log('src escrow withdrawn')

        await dstChain.connection.sendTransaction(
            newSolanaTx(
                SvmDstEscrowFactory.DEFAULT.withdrawPrivate(
                    dstImmutables,
                    bufferFromHex(secret),
                    {
                        tokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID
                    }
                )
            ),
            [dstChain.accounts.resolver]
        )

        console.log('dst escrow withdrawn')

        const makerBalanceDstAfter = dstChain.connection.getTokenBalance(
            receiver,
            takerAsset
        )

        expect(makerBalanceDstAfter - makerBalanceDstBefore).toEqual(
            order.takingAmount
        )
    })

    it('should perform cross chain swap with single fill. Public withdraw', async () => {
        const secret = getSecret()
        const maker = EvmAddress.fromString(await srcChain.maker.getAddress())
        const resolverSvm = SolanaAddress.fromBuffer(
            dstChain.accounts.resolver.publicKey.toBuffer()
        )
        const resolverEvm = EvmAddress.fromString(srcChain.addresses.resolver)

        // address on dst chain
        const takerAsset = SolanaAddress.fromPublicKey(
            dstChain.accounts.dstToken.publicKey
        )
        const receiver = SolanaAddress.fromPublicKey(
            dstChain.accounts.maker.publicKey
        )
        const makerBalanceDstBefore = dstChain.connection.getTokenBalance(
            receiver,
            takerAsset
        )

        const order = EvmCrossChainOrder.new(
            EvmAddress.fromString(srcChain.addresses.escrowFactory),
            {
                maker,
                receiver,
                makerAsset: EvmAddress.fromString(WETH_EVM),
                takerAsset,
                makingAmount: parseEther('1'),
                takingAmount: parseUnits('1000', 6)
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
                    startTime: BigInt(now()),
                    duration: 120n,
                    initialRateBump: 10_000,
                    points: [
                        {
                            coefficient: 10_000,
                            delay: 120
                        }
                    ]
                }),
                whitelist: [
                    {
                        address: resolverEvm,
                        allowFrom: 0n
                    }
                ],
                resolvingStartTime: 0n
            },
            {
                allowMultipleFills: false,
                nonce: randBigInt(UINT_40_MAX)
            }
        )

        const signature = await srcChain.maker.signTypedData(
            order.getTypedData(srcChain.chainId)
        )

        let srcImmutables = order.toSrcImmutables(
            srcChain.chainId,
            resolverEvm,
            order.makingAmount
        )
        const srcEscrow = await srcChain.taker.send({
            to: resolverEvm.toString(),
            data: getEvmFillData(
                resolverContractEvm,
                order,
                signature,
                srcImmutables,
                srcChain
            ),
            value: order.srcSafetyDeposit
        })
        srcImmutables = srcImmutables.withDeployedAt(srcEscrow.blockTimestamp)

        // wait for finality
        await advanceNodeTime(20)

        assert(order.takerAsset instanceof SolanaAddress)
        assert(order.receiver instanceof SolanaAddress)

        let dstImmutables = srcImmutables.withComplement(
            // actually should be parsed from event in src escrow tx
            DstImmutablesComplement.new({
                amount: order.takingAmount,
                safetyDeposit: order.dstSafetyDeposit,
                maker: order.receiver,
                taker: resolverSvm,
                token: order.takerAsset,
                chainId: BigInt(NetworkEnum.SOLANA)
            })
        )

        const dstEscrowIx = SvmDstEscrowFactory.DEFAULT.createEscrow(
            dstImmutables,
            {
                tokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID,
                srcCancellationTimestamp:
                    srcImmutables.timeLocks.toSrcTimeLocks().publicCancellation
            }
        )

        dstChain.connection.sendTransaction(newSolanaTx(dstEscrowIx), [
            dstChain.accounts.resolver
        ])
        dstImmutables = dstImmutables.withDeployedAt(
            dstChain.svm.getClock().unixTimestamp
        )

        // wait for finality
        await advanceNodeTime(20)

        // user makes validation and shares secret

        const srcImplAddress = await srcChain.provider.call({
            to: srcChain.addresses.escrowFactory,
            data: id('ESCROW_SRC_IMPLEMENTATION()').slice(0, 10)
        })

        const srcEscrowAddress = new EscrowFactory(
            EvmAddress.fromString(srcChain.addresses.escrowFactory)
        ).getSrcEscrowAddress(
            srcImmutables,
            EvmAddress.fromString(add0x(srcImplAddress.slice(-40))) // decode from bytes32
        )

        await srcChain.taker.send({
            to: resolverEvm.toString(),
            data: resolverContractEvm.encodeFunctionData('withdraw', [
                srcEscrowAddress.toString(),
                secret, // user shared secret at this point
                srcImmutables.build()
            ])
        })
        console.log('src escrow withdrawn')

        await advanceNodeTime(100) // wait for public withdrawal
        await dstChain.connection.sendTransaction(
            newSolanaTx(
                SvmDstEscrowFactory.DEFAULT.withdrawPublic(
                    dstImmutables,
                    bufferFromHex(secret),
                    SolanaAddress.fromPublicKey(
                        dstChain.accounts.fallbackResolver.publicKey
                    ),
                    {
                        tokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID
                    }
                )
            ),
            [dstChain.accounts.fallbackResolver]
        )

        console.log('dst escrow withdrawn')

        const makerBalanceDstAfter = dstChain.connection.getTokenBalance(
            receiver,
            takerAsset
        )

        expect(makerBalanceDstAfter - makerBalanceDstBefore).toEqual(
            order.takingAmount
        )
    })

    it('should perform cross chain swap and cancel privately on destination', async () => {
        const secret = getSecret()
        const maker = EvmAddress.fromString(await srcChain.maker.getAddress())
        const resolverSvm = SolanaAddress.fromBuffer(
            dstChain.accounts.resolver.publicKey.toBuffer()
        )
        const resolverEvm = EvmAddress.fromString(srcChain.addresses.resolver)

        // address on dst chain
        const takerAsset = SolanaAddress.fromPublicKey(
            dstChain.accounts.dstToken.publicKey
        )
        const receiver = SolanaAddress.fromPublicKey(
            dstChain.accounts.maker.publicKey
        )
        const resolverBalanceDstBefore = dstChain.connection.getTokenBalance(
            resolverSvm,
            takerAsset
        )

        const order = EvmCrossChainOrder.new(
            EvmAddress.fromString(srcChain.addresses.escrowFactory),
            {
                maker,
                receiver,
                makerAsset: EvmAddress.fromString(WETH_EVM),
                takerAsset,
                makingAmount: parseEther('1'),
                takingAmount: parseUnits('1000', 6)
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
                    srcPrivateCancellation: 50n,
                    dstFinalityLock: 10n,
                    dstPrivateWithdrawal: 100n,
                    dstPublicWithdrawal: 100n
                }),
                hashLock: HashLock.forSingleFill(secret)
            },
            {
                auction: AuctionDetails.noAuction(),
                whitelist: [
                    {
                        address: resolverEvm,
                        allowFrom: 0n
                    }
                ],
                resolvingStartTime: 0n
            },
            {
                allowMultipleFills: false,
                nonce: randBigInt(UINT_40_MAX)
            }
        )

        const signature = await srcChain.maker.signTypedData(
            order.getTypedData(srcChain.chainId)
        )

        let srcImmutables = order.toSrcImmutables(
            srcChain.chainId,
            resolverEvm,
            order.makingAmount
        )
        const srcEscrow = await srcChain.taker.send({
            to: resolverEvm.toString(),
            data: getEvmFillData(
                resolverContractEvm,
                order,
                signature,
                srcImmutables,
                srcChain
            ),
            value: order.srcSafetyDeposit
        })
        srcImmutables = srcImmutables.withDeployedAt(srcEscrow.blockTimestamp)

        // wait for finality
        await advanceNodeTime(20)

        assert(order.takerAsset instanceof SolanaAddress)
        assert(order.receiver instanceof SolanaAddress)

        let dstImmutables = srcImmutables.withComplement(
            // actually should be parsed from event in src escrow tx
            DstImmutablesComplement.new({
                amount: order.takingAmount,
                safetyDeposit: order.dstSafetyDeposit,
                maker: order.receiver,
                taker: resolverSvm,
                token: order.takerAsset,
                chainId: BigInt(NetworkEnum.SOLANA)
            })
        )

        const dstEscrowIx = SvmDstEscrowFactory.DEFAULT.createEscrow(
            dstImmutables,
            {
                tokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID,
                srcCancellationTimestamp:
                    srcImmutables.timeLocks.toSrcTimeLocks().publicCancellation
            }
        )

        dstChain.connection.sendTransaction(newSolanaTx(dstEscrowIx), [
            dstChain.accounts.resolver
        ])
        dstImmutables = dstImmutables.withDeployedAt(
            dstChain.svm.getClock().unixTimestamp
        )

        // wait for finality and private cancellation window to open
        await advanceNodeTime(210)

        // Cancel the escrow privately on destination chain only
        await dstChain.connection.sendTransaction(
            newSolanaTx(
                SvmDstEscrowFactory.DEFAULT.cancelPrivate(dstImmutables, {
                    tokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID
                })
            ),
            [dstChain.accounts.resolver]
        )

        console.log('dst escrow cancelled privately')

        const resolverBalanceDstAfter = dstChain.connection.getTokenBalance(
            resolverSvm,
            takerAsset
        )

        // The resolver (taker) should get their tokens back after cancellation
        expect(resolverBalanceDstAfter - resolverBalanceDstBefore).toEqual(0n)
    })
})
