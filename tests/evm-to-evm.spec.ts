import {parseEther, parseUnits, Interface, id} from 'ethers'
import {randBigInt, Fees, IntegratorFee, ResolverFee} from '@1inch/fusion-sdk'
import {Bps, Address} from '@1inch/limit-order-sdk'
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
import {FeeParameters} from '../src/domains/fee-parameters/index.js'

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

        await Promise.all([
            srcChain.provider.send('evm_mine', []),
            dstChain.provider.send('evm_mine', [])
        ])
    }

    async function performSwap(params: {
        feeParameters: FeeParameters
        fees?: Fees
    }): Promise<{srcWithdraw: unknown; dstWithdraw: unknown}> {
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
                resolvingStartTime: 0n,
                fees: params.fees
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

        const srcEscrow = await srcChain.taker.send(
            {
                to: resolver.toString(),
                data: getEvmFillData(
                    resolverContract,
                    order,
                    signature,
                    srcImmutables,
                    srcChain
                ),
                value: order.srcSafetyDeposit
            },
            'srcEscrow',
            srcChain.localNode
        )

        srcImmutables = srcImmutables.withDeployedAt(srcEscrow.blockTimestamp)

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
                chainId: BigInt(dstChain.chainId),
                feeParameters: params.feeParameters
            })
        )

        const dstEscrow = await dstChain.taker.send(
            {
                to: resolver.toString(),
                data: resolverContract.encodeFunctionData('deployDst', [
                    dstImmutables.build(),
                    order.timeLocks.toSrcTimeLocks(srcEscrow.blockTimestamp)
                        .privateCancellation
                ]),
                value: order.dstSafetyDeposit
            },
            'dstEscrow',
            dstChain.localNode
        )

        dstImmutables = dstImmutables.withDeployedAt(dstEscrow.blockTimestamp)

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

        await advanceNodeTime(20)

        const srcWithdraw = await srcChain.taker.send(
            {
                to: resolver.toString(),
                data: resolverContract.encodeFunctionData('withdraw', [
                    srcEscrowAddress.toString(),
                    secret,
                    srcImmutables.build()
                ])
            },
            'srcWithdraw',
            srcChain.localNode
        )

        const dstWithdraw = await dstChain.taker.send(
            {
                to: resolver.toString(),
                data: resolverContract.encodeFunctionData('withdraw', [
                    dstEscrowAddress.toString(),
                    secret,
                    dstImmutables.build()
                ])
            },
            'dstWithdraw',
            dstChain.localNode
        )

        return {srcWithdraw, dstWithdraw}
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

    it('should swap without fees', async () => {
        const result = await performSwap({
            feeParameters: FeeParameters.EMPTY
        })

        expect(result.srcWithdraw).toBeDefined()
        expect(result.dstWithdraw).toBeDefined()
    })

    it('should swap with zero fees', async () => {
        const zeroFees = new FeeParameters(
            0n,
            0n,
            '0x0000000000000000000000000000000000000000',
            '0x0000000000000000000000000000000000000000'
        )

        const result = await performSwap({
            feeParameters: zeroFees
        })

        expect(result.srcWithdraw).toBeDefined()
        expect(result.dstWithdraw).toBeDefined()
    })

    it('should swap with fees', async () => {
        const protocolFeeRecipient =
            '0x1111111111111111111111111111111111111111'
        const integratorFeeRecipient =
            '0x2222222222222222222222222222222222222222'

        const fees = new Fees(
            new ResolverFee(
                new Address(protocolFeeRecipient),
                new Bps(100n),
                Bps.fromPercent(10)
            ),
            new IntegratorFee(
                new Address(integratorFeeRecipient),
                new Address(protocolFeeRecipient),
                new Bps(50n),
                Bps.fromPercent(20)
            )
        )

        const takingAmount = parseUnits('1000', 6)
        const protocolFeeAmount = (takingAmount * 100n) / 10000n
        const integratorFeeAmount = (takingAmount * 50n) / 10000n

        const feeParameters = new FeeParameters(
            protocolFeeAmount,
            integratorFeeAmount,
            protocolFeeRecipient,
            integratorFeeRecipient
        )

        const result = await performSwap({
            feeParameters,
            fees
        })

        expect(result.srcWithdraw).toBeDefined()
        expect(result.dstWithdraw).toBeDefined()
    })
})
