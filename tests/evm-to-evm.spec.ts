import {parseEther, parseUnits, Interface, id} from 'ethers'
import {randBigInt, Fees, IntegratorFee, ResolverFee} from '@1inch/fusion-sdk'
import {Bps, Address} from '@1inch/limit-order-sdk'
import {add0x, UINT_40_MAX} from '@1inch/byte-utils'
import assert from 'assert'
import {USDC_EVM, WETH_EVM} from './utils/addresses.js'
import {ReadyEvmFork, setupEvm} from './utils/setup-evm.js'
import {EvmTestWallet} from './utils/evm-wallet.js'
import {getSecret} from './utils/secret.js'
import {getEvmFillData} from './utils/tx.js'
import Resolver from '../dist/contracts/Resolver.sol/Resolver.json'
import {NetworkEnum} from '../src/chains.js'
import {EvmCrossChainOrder} from '../src/cross-chain-order/evm/index.js'
import {EvmAddress} from '../src/domains/addresses/index.js'
import {TimeLocks} from '../src/domains/time-locks/index.js'
import {AuctionDetails} from '../src/domains/auction-details/index.js'
import {HashLock} from '../src/domains/hash-lock/index.js'
import {EscrowFactoryFacade} from '../src/contracts/evm/escrow-factory-facade.js'
import {DstImmutablesComplement} from '../src/domains/immutables/index.js'
import {ImmutablesFees} from '../src/domains/immutables-fees/index.js'

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

    async function performSwap(params?: {
        fees?: Fees
        feeParameters?: ImmutablesFees
    }): Promise<{order: EvmCrossChainOrder}> {
        const secret = getSecret()

        const order = EvmCrossChainOrder.new(
            EvmAddress.fromString(srcChain.addresses.escrowFactory),
            // 1 WETH -> 1000 USDC
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
                fees: params?.fees
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

        const srcEscrowAddress = EscrowFactoryFacade.getFactory(
            srcChain.chainId,
            EvmAddress.fromString(srcChain.addresses.escrowFactory)
        ).getSrcEscrowAddress(
            srcImmutables,
            EvmAddress.fromString(add0x(srcImplAddress.slice(-40))) // decode from bytes32
        )

        // wait for src finalization
        await advanceNodeTime(20)

        const takerAsset = order.takerAsset
        assert(takerAsset instanceof EvmAddress)

        let dstImmutables = srcImmutables.withComplement(
            // actually should be parsed from event in src escrow tx
            DstImmutablesComplement.new({
                amount: order.takingAmount,
                safetyDeposit: order.dstSafetyDeposit,
                maker: resolver,
                taker: srcImmutables.taker,
                token: takerAsset,
                chainId: BigInt(dstChain.chainId),
                fees: params?.feeParameters
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

        const dstEscrowAddress = EscrowFactoryFacade.getFactory(
            dstChain.chainId,
            EvmAddress.fromString(dstChain.addresses.escrowFactory)
        ).getSrcEscrowAddress(
            dstImmutables,
            EvmAddress.fromString(add0x(dstImplAddress.slice(-40))) // decode from bytes32
        )

        // wait for dst finalization
        await advanceNodeTime(20)

        // user makes validation and shares secret
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
                    secret, // user shared secret at this point
                    dstImmutables.build()
                ])
            },
            'dstWithdraw',
            dstChain.localNode
        )

        return {order}
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
        const {order} = await performSwap()
        expect(order).toBeDefined()
    })

    it('should swap with zero fees', async () => {
        const zeroFees = ImmutablesFees.ZERO

        const {order} = await performSwap({feeParameters: zeroFees})
        expect(order).toBeDefined()
    })

    it('should swap with fees', async () => {
        const protocolAddress = EvmAddress.fromString(
            '0x1111111111111111111111111111111111111111'
        )
        const integratorAddress = EvmAddress.fromString(
            '0x2222222222222222222222222222222222222222'
        )

        const srcResolver = await EvmTestWallet.fromAddress(
            resolver.toString(),
            srcChain.provider
        )
        const dstResolver = await EvmTestWallet.fromAddress(
            resolver.toString(),
            dstChain.provider
        )
        const protocol = await EvmTestWallet.fromAddress(
            protocolAddress.toString(),
            dstChain.provider
        )
        const integrator = await EvmTestWallet.fromAddress(
            integratorAddress.toString(),
            dstChain.provider
        )

        const resolverFeeBps = 100n // 1%
        const integratorFeeBps = 50n // 0.5%

        const fees = new Fees(
            new ResolverFee(
                new Address(protocolAddress.toString()),
                new Bps(resolverFeeBps),
                Bps.fromPercent(10)
            ),
            new IntegratorFee(
                new Address(integratorAddress.toString()),
                new Address(protocolAddress.toString()),
                new Bps(integratorFeeBps),
                Bps.fromPercent(20)
            )
        )

        const takingAmount = parseUnits('1000', 6)
        const resolverFeeAmount = (takingAmount * resolverFeeBps) / 10000n
        const integratorFeeAmount = (takingAmount * integratorFeeBps) / 10000n

        const feeParameters = new ImmutablesFees(
            resolverFeeAmount,
            integratorFeeAmount,
            protocolAddress,
            integratorAddress
        )

        const initBalances = {
            srcWeth: {
                maker: await srcChain.maker.tokenBalance(WETH_EVM),
                resolver: await srcResolver.tokenBalance(WETH_EVM)
            },
            dstUsdc: {
                maker: await dstChain.maker.tokenBalance(USDC_EVM),
                resolver: await dstResolver.tokenBalance(USDC_EVM),
                protocol: await protocol.tokenBalance(USDC_EVM),
                integrator: await integrator.tokenBalance(USDC_EVM)
            }
        }

        const {order} = await performSwap({fees, feeParameters})

        const finalBalances = {
            srcWeth: {
                maker: await srcChain.maker.tokenBalance(WETH_EVM),
                resolver: await srcResolver.tokenBalance(WETH_EVM)
            },
            dstUsdc: {
                maker: await dstChain.maker.tokenBalance(USDC_EVM),
                resolver: await dstResolver.tokenBalance(USDC_EVM),
                protocol: await protocol.tokenBalance(USDC_EVM),
                integrator: await integrator.tokenBalance(USDC_EVM)
            }
        }

        expect(initBalances.srcWeth.maker - finalBalances.srcWeth.maker).toBe(
            order.makingAmount
        )
        expect(
            finalBalances.srcWeth.resolver - initBalances.srcWeth.resolver
        ).toBe(order.makingAmount)

        // todo: fix remaining
    })
})
