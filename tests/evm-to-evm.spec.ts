import {parseEther, parseUnits, Interface, id} from 'ethers'
import {randBigInt} from '@1inch/fusion-sdk'
import {add0x, UINT_40_MAX} from '@1inch/byte-utils'
import assert from 'assert'
import {USDC_EVM, WETH_EVM} from './utils/addresses.js'
import {ReadyEvmFork, setupEvm} from './utils/setup-evm.js'
import {getSecret} from './utils/secret.js'
import {getEvmFillData} from './utils/tx.js'
import Resolver from '../dist/contracts/Resolver.sol/Resolver.json'
import {NetworkEnum} from '../src/chains.js'
import {EvmCrossChainOrder} from '../src/cross-chain-order/evm/index.js'
import {EvmAddress} from '../src/domains/addresses/index.js'
import {TimeLocks} from '../src/domains/time-locks/index.js'
import {AuctionDetails} from '../src/domains/auction-details/index.js'
import {HashLock} from '../src/domains/hash-lock/index.js'
import {EscrowFactory} from '../src/contracts/evm/escrow-factory.js'
import {DstImmutablesComplement} from '../src/domains/immutables/index.js'

jest.setTimeout(1000 * 10 * 60)

describe('EVM to EVM', () => {
    let srcChain: ReadyEvmFork
    let dstChain: ReadyEvmFork
    let maker: EvmAddress
    let resolver: EvmAddress
    const resolverContract = new Interface(Resolver.abi)

    async function advanceNodeTime(duration = 10): Promise<void> {
        const [srcBlock, dstBlock] = await Promise.all([
            srcChain.provider.getBlock('latest', false),
            dstChain.provider.getBlock('latest', false)
        ])

        await Promise.all([
            srcChain.provider.send('evm_setNextBlockTimestamp', [
                srcBlock!.timestamp + duration
            ]),
            dstChain.provider.send('evm_setNextBlockTimestamp', [
                dstBlock!.timestamp + duration
            ])
        ])
    }

    beforeAll(async () => {
        srcChain = await setupEvm({chainId: NetworkEnum.ETHEREUM})
        dstChain = await setupEvm({chainId: NetworkEnum.BINANCE})

        maker = EvmAddress.fromString(await srcChain.maker.getAddress())
        resolver = EvmAddress.fromString(srcChain.addresses.resolver)
    })

    afterAll(async () => {
        srcChain.provider.destroy()
        dstChain.provider.destroy()
        await srcChain.localNode.stop()
        await dstChain.localNode.stop()
    })

    it('should perform cross chain swap with single fill', async () => {
        const secret = getSecret()

        const order = EvmCrossChainOrder.new(
            EvmAddress.fromString(srcChain.addresses.escrowFactory),
            {
                maker,
                makerAsset: EvmAddress.fromString(WETH_EVM),
                takerAsset: EvmAddress.fromString(USDC_EVM),
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
                whitelist: [{address: resolver, allowFrom: 0n}],
                auction: AuctionDetails.noAuction(),
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
            resolver,
            order.makingAmount
        )

        const calldata = getEvmFillData(
            resolverContract,
            order,
            signature,
            srcImmutables,
            srcChain
        )

        const srcEscrowTx = await srcChain.taker.send({
            to: resolver.toString(),
            data: calldata,
            value: order.srcSafetyDeposit
        })

        srcImmutables = srcImmutables.withDeployedAt(srcEscrowTx.blockTimestamp)

        const srcImplAddress = await srcChain.provider.call({
            to: srcChain.addresses.escrowFactory,
            data: id('ESCROW_SRC_IMPLEMENTATION()').slice(0, 10)
        })

        const srcEscrowAddress = new EscrowFactory(
            EvmAddress.fromString(srcChain.addresses.escrowFactory)
        ).getSrcEscrowAddress(
            srcImmutables,
            EvmAddress.fromString(add0x(srcImplAddress.slice(-40)))
        )

        // wait for src finalization
        await advanceNodeTime(20)

        const takerAsset = order.takerAsset
        assert(takerAsset instanceof EvmAddress)

        let dstImmutables = srcImmutables.withComplement(
            DstImmutablesComplement.new({
                amount: order.takingAmount,
                safetyDeposit: order.dstSafetyDeposit,
                maker: resolver,
                taker: srcImmutables.taker,
                token: takerAsset,
                chainId: BigInt(dstChain.chainId)
            })
        )

        const dstEscrowTx = await dstChain.taker.send({
            to: resolver.toString(),
            data: resolverContract.encodeFunctionData('deployDst', [
                dstImmutables.build(),
                order.timeLocks.toSrcTimeLocks(srcEscrowTx.blockTimestamp)
                    .privateCancellation
            ]),
            value: order.dstSafetyDeposit
        })

        dstImmutables = dstImmutables.withDeployedAt(dstEscrowTx.blockTimestamp)

        const dstImplAddress = await dstChain.provider.call({
            to: dstChain.addresses.escrowFactory,
            data: id('ESCROW_DST_IMPLEMENTATION()').slice(0, 10)
        })

        const dstEscrowAddress = new EscrowFactory(
            EvmAddress.fromString(dstChain.addresses.escrowFactory)
        ).getSrcEscrowAddress(
            dstImmutables,
            EvmAddress.fromString(add0x(dstImplAddress.slice(-40)))
        )

        // wait for dst finalization
        await advanceNodeTime(20)

        // user makes validation and shares secret

        const srcWithdraw = await srcChain.taker.send({
            to: resolver.toString(),
            data: resolverContract.encodeFunctionData('withdraw', [
                srcEscrowAddress.toString(),
                secret,
                srcImmutables.build()
            ])
        })

        const dstWithdraw = await dstChain.taker.send({
            to: resolver.toString(),
            data: resolverContract.encodeFunctionData('withdraw', [
                dstEscrowAddress.toString(),
                secret,
                dstImmutables.build()
            ])
        })

        expect(srcWithdraw).toBeDefined()
        expect(dstWithdraw).toBeDefined()
    })
})
