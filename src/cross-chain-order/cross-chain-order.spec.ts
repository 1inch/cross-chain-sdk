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
import {TimeLocks} from './time-locks'
import {getRandomBytes32} from '../utils/get-random-bytes-32'

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
            hashLock: HashLock.forSingleFill(getRandomBytes32()),
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

    it('Should encode/decode order with multiple fills', () => {
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

        const secrets = [
            getRandomBytes32(),
            getRandomBytes32(),
            getRandomBytes32()
        ]
        const leaves = HashLock.getMerkleLeaves(secrets)

        const escrowParams: EscrowParams = {
            hashLock: HashLock.forMultipleFills(leaves),
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
                nonce: 1n,
                allowMultipleFills: true
            }
        )

        expect(
            CrossChainOrder.fromDataAndExtension(
                order.build(),
                Extension.decode(order.extension.encode())
            )
        ).toEqual(order)
    })

    it('should throw error for not supported chain', () => {
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

        const createOrder = (
            srcChainId: number,
            dstChainId: number
        ): CrossChainOrder => {
            const escrowParams: EscrowParams = {
                hashLock: HashLock.forSingleFill(getRandomBytes32()),
                srcChainId,
                dstChainId,
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

            return CrossChainOrder.new(
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
                    whitelist: [
                        {address: Address.fromBigInt(100n), allowFrom: 0n}
                    ]
                },
                {
                    nonce: 1n
                }
            )
        }

        expect(() => createOrder(NetworkEnum.ETHEREUM, 1337)).toThrow(
            'Not supported chain 1337'
        )
        expect(() => createOrder(1337, NetworkEnum.ETHEREUM)).toThrow(
            'Not supported chain 1337'
        )
    })

    it('should throw error for same chains', () => {
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
            hashLock: HashLock.forSingleFill(getRandomBytes32()),
            srcChainId: NetworkEnum.ETHEREUM,
            dstChainId: NetworkEnum.ETHEREUM,
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

        const createOrder = (): CrossChainOrder =>
            CrossChainOrder.new(
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
                    whitelist: [
                        {address: Address.fromBigInt(100n), allowFrom: 0n}
                    ]
                },
                {
                    nonce: 1n
                }
            )

        expect(createOrder).toThrow('Chains must be different')
    })
})
