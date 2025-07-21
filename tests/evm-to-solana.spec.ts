import {Interface, parseUnits, parseEther} from 'ethers'
import {Clock} from 'litesvm'
import {UINT_40_MAX} from '@1inch/byte-utils'
import {randBigInt} from '@1inch/fusion-sdk'
import assert from 'assert'
import {ReadyEvmFork, setupEvm} from './utils/setup-evm'
import {getSecret} from './utils/secret'
import {ReadySolanaNode, setupSolana} from './utils/setup-solana'
import {WETH_EVM} from './utils/addresses'
import {getEvmFillData, newSolanaTx} from './utils/tx'
import Resolver from '../dist/contracts/Resolver.sol/Resolver.json'
import {NetworkEnum} from '../src/chains'

import {EvmCrossChainOrder} from '../src/cross-chain-order'
import {AuctionDetails} from '../src/domains/auction-details'
import {HashLock} from '../src/domains/hash-lock'
import {TimeLocks} from '../src/domains/time-locks'
import {EvmAddress, SolanaAddress} from '../src/domains/addresses'
import {SvmDstEscrowFactory} from '../src/contracts'
import {DstImmutablesComplement} from '../src/domains'

jest.setTimeout(1000 * 10 * 60)

describe('EVM to EVM', () => {
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

    it('should perform cross chain swap with single fill', async () => {
        const secret = getSecret()
        const maker = EvmAddress.fromString(await srcChain.maker.getAddress())
        const resolverSvm = SolanaAddress.fromBuffer(
            dstChain.accounts.resolver.publicKey.toBuffer()
        )
        const resolverEvm = EvmAddress.fromString(srcChain.addresses.resolver)

        const order = EvmCrossChainOrder.new(
            EvmAddress.fromString(srcChain.addresses.escrowFactory),
            {
                maker,
                receiver: SolanaAddress.fromPublicKey(
                    dstChain.accounts.maker.publicKey
                ),
                makerAsset: EvmAddress.fromString(WETH_EVM),
                takerAsset: SolanaAddress.fromPublicKey(
                    dstChain.accounts.dstToken.publicKey
                ), // address on dst chain
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

        const dstImmutables = srcImmutables.withComplement(
            // actually should be parsed from event in src escrow tx
            DstImmutablesComplement.new({
                amount: order.takingAmount,
                safetyDeposit: order.dstSafetyDeposit,
                maker: order.receiver,
                taker: resolverSvm,
                token: order.takerAsset
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

        dstChain.svm.sendTransaction(newSolanaTx(dstEscrowIx))
    })
})

//const srcImplAddress = await srcChain.provider.call({
//     to: srcChain.addresses.escrowFactory,
//     data: id('ESCROW_SRC_IMPLEMENTATION()').slice(0, 10)
// })

// const srcEscrowAddress = EscrowFactoryFacade.getFactory(
//     srcChain.chainId,
//     EvmAddress.fromString(srcChain.addresses.escrowFactory)
// ).getSrcEscrowAddress(
//     srcImmutables,
//     EvmAddress.fromString(add0x(srcImplAddress.slice(-40))) // decode from bytes32
// )
