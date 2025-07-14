import {parseEther, parseUnits} from 'ethers'
import {LimitOrderContract, TakerTraits} from '@1inch/limit-order-sdk'
import {ReadyEvmFork, setupEvm} from '../utils/setup-evm'
import {NetworkEnum} from '../../src/chains'
import {EvmCrossChainOrder} from '../../src/cross-chain-order/evm'
import {EvmAddress} from '../../src/domains/addresses'
import {ONE_INCH_LIMIT_ORDER_V4, USDC, WETH} from '../utils/addresses'
import {TimeLocks} from '../../src/domains/time-locks'
import {AuctionDetails} from '../../src/domains/auction-details'
import {getSecret} from '../utils/secret'
import {HashLock} from '../../src/domains/hash-lock'

jest.setTimeout(1000 * 10 * 60)

describe('EVM to EVM', () => {
    let srcChain: ReadyEvmFork
    let dstChain: ReadyEvmFork
    let maker: EvmAddress
    let taker: EvmAddress

    beforeAll(async () => {
        srcChain = await setupEvm({chainId: NetworkEnum.ETHEREUM})
        dstChain = await setupEvm({chainId: NetworkEnum.BINANCE})

        maker = EvmAddress.fromString(await srcChain.maker.getAddress())
        taker = EvmAddress.fromString(await srcChain.taker.getAddress())
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
            EvmAddress.fromString(srcChain.escrowFactoryAddress),
            // 1 WETH -> 1000 USDC
            {
                maker,
                makerAsset: EvmAddress.fromString(WETH),
                takerAsset: EvmAddress.fromString(USDC), // address on dst chain
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
                    srcPrivateWithdrawal: 100n,
                    srcPublicWithdrawal: 100n,
                    srcPrivateCancellation: 100n,
                    dstFinalityLock: 10n,
                    dstPrivateWithdrawal: 100n,
                    dstPublicWithdrawal: 100n
                }),
                hashLock: HashLock.forSingleFill(secret)
            },
            {
                whitelist: [{address: taker, allowFrom: 0n}],
                auction: AuctionDetails.noAuction()
            }
        )

        const signature = await srcChain.maker.signTypedData(
            order.getTypedData(srcChain.chainId)
        )

        const createSrcEscrow = {
            to: ONE_INCH_LIMIT_ORDER_V4,
            data: LimitOrderContract.getFillOrderArgsCalldata(
                order.build(),
                signature,
                TakerTraits.default().setExtension(order.extension),
                order.makingAmount
            )
        }

        const srcEscrow = await srcChain.taker.send(createSrcEscrow)

        console.log(srcEscrow)
    })
})
