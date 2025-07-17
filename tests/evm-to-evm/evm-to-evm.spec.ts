import {parseEther, parseUnits, Interface, Signature, id} from 'ethers'
import {AmountMode, randBigInt, TakerTraits} from '@1inch/fusion-sdk'
import {add0x, UINT_40_MAX} from '@1inch/byte-utils'
import assert from 'assert'
import Resolver from '../../dist/contracts/Resolver.sol/Resolver.json'
import {ReadyEvmFork, setupEvm} from '../utils/setup-evm'
import {NetworkEnum} from '../../src/chains'
import {EvmCrossChainOrder} from '../../src/cross-chain-order/evm'
import {EvmAddress} from '../../src/domains/addresses'
import {USDC_EVM, WETH_EVM} from '../utils/addresses'
import {TimeLocks} from '../../src/domains/time-locks'
import {AuctionDetails} from '../../src/domains/auction-details'
import {getSecret} from '../utils/secret'
import {HashLock} from '../../src/domains/hash-lock'
import {EscrowFactoryFacade} from '../../src/contracts/evm/escrow-factory/evm/escrow-factory-facade'
import {DstImmutablesComplement, Immutables} from '../../src/domains/immutables'

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

    function getFillData(
        order: EvmCrossChainOrder,
        signature: string,
        immutables: Immutables,
        chainConfig: ReadyEvmFork,
        leaves = [],
        secretHashes = [],
        fillAmount = order.makingAmount,
        remainingAmount = fillAmount
    ): string {
        const takerTraits = TakerTraits.default()
            .setAmountMode(AmountMode.maker)
            .setExtension(order.extension)

        if (order.multipleFillsAllowed) {
            assert(
                leaves.length && secretHashes.length,
                'no leaves or secret hashes provided'
            )
            const idx = order.getMultipleFillIdx(fillAmount, remainingAmount)

            takerTraits.setInteraction(
                new EscrowFactoryFacade(
                    chainConfig.chainId,
                    EvmAddress.fromString(chainConfig.addresses.escrowFactory)
                ).getMultipleFillInteraction(
                    HashLock.getProof(leaves!, idx),
                    idx,
                    secretHashes![idx]
                )
            )
        }

        const {r, yParityAndS: vs} = Signature.from(signature)

        const {args, trait} = takerTraits.encode()

        return resolverContract.encodeFunctionData('deploySrc', [
            immutables.build(),
            order.build(),
            r,
            vs,
            fillAmount,
            trait,
            args
        ])
    }

    it('should perform cross chain swap with single fill', async () => {
        const secret = getSecret()

        const order = EvmCrossChainOrder.new(
            EvmAddress.fromString(srcChain.addresses.escrowFactory),
            // 1 WETH -> 1000 USDC
            {
                maker,
                makerAsset: EvmAddress.fromString(WETH_EVM),
                takerAsset: EvmAddress.fromString(USDC_EVM), // address on dst chain
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
                whitelist: [
                    {
                        address: resolver,
                        allowFrom: 0n
                    }
                ],
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
        const srcEscrow = await srcChain.taker.send({
            to: resolver.toString(),
            data: getFillData(order, signature, srcImmutables, srcChain),
            value: order.srcSafetyDeposit
        })

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

        let dstImmutables = srcImmutables.withComplement(
            // actually should be parsed from event in src escrow tx
            DstImmutablesComplement.new({
                amount: order.takingAmount,
                safetyDeposit: order.dstSafetyDeposit,
                maker: resolver,
                token: order.takerAsset
            })
        )
        const dstEscrow = await dstChain.taker.send({
            to: resolver.toString(),
            data: resolverContract.encodeFunctionData('deployDst', [
                dstImmutables.build(),
                order.timeLocks.toSrcTimeLocks(srcEscrow.blockTimestamp)
                    .privateCancellation
            ]),
            value: order.dstSafetyDeposit
        })

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

        const srcWithdraw = await srcChain.taker.send({
            to: resolver.toString(),
            data: resolverContract.encodeFunctionData('withdraw', [
                srcEscrowAddress.toString(),
                secret, // user shared secret at this point
                srcImmutables.build()
            ])
        })

        const dstWithdraw = await dstChain.taker.send({
            to: resolver.toString(),
            data: resolverContract.encodeFunctionData('withdraw', [
                dstEscrowAddress.toString(),
                secret, // user shared secret at this point
                dstImmutables.build()
            ])
        })

        // eslint-disable-next-line no-console
        console.log({srcWithdraw, dstWithdraw})
    })
})
