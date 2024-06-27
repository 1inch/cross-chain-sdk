import {
    Address,
    NetworkEnum,
    AuctionDetails,
    now,
    Extension
} from '@1inch/fusion-sdk'
import {CrossChainOrder} from './cross-chain-order'
import {CrossChainOrderInfo, EscrowParams} from './types'
import {HashLock} from './hash-lock'
import {TimeLocks} from './time-locks/time-locks'

describe('CrossChainOrder', () => {
    it('Should encode/decode order', () => {
        const factoryAddress = Address.fromBigInt(1n)
        const orderData: CrossChainOrderInfo = {
            maker: Address.fromBigInt(2n),
            makerAsset: new Address(
                '0xdac17f958d2ee523a2206206994597c13d831ec7'
            ),
            takerAsset: new Address(
                '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'
            ),
            makingAmount: 100_000000n,
            takingAmount: 90_000000n
        }

        const escrowParams: EscrowParams = {
            hashLock: HashLock.fromSecret('123'),
            srcChainId: NetworkEnum.ETHEREUM,
            dstChainId: NetworkEnum.ARBITRUM,
            srcSafetyDeposit: 1000n,
            dstSafetyDeposit: 1000n,
            timeLocks: TimeLocks.new({
                srcWithdrawal: 1n,
                srcPublicWithdrawal: 2n,
                srcCancellation: 3n,
                srcPublicCancellation: 4n,
                dstWithdrawal: 1n,
                dstPublicWithdrawal: 2n,
                dstCancellation: 3n
            })
        }
        const order = CrossChainOrder.new(
            factoryAddress,
            orderData,
            escrowParams,
            {
                auction: new AuctionDetails({
                    startTime: now(),
                    duration: 180n,
                    points: [],
                    initialRateBump: 100_000
                }),
                whitelist: [{address: Address.fromBigInt(100n), allowFrom: 0n}]
            },
            {
                nonce: 1n
            }
        )

        expect(
            CrossChainOrder.fromDataAndExtension(
                order.build(),
                Extension.decode(order.extension.encode())
            )
        ).toEqual(order)
    })
})
