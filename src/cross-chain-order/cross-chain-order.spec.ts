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
import {getRandomBytes32} from '../test-utils/get-random-bytes-32'

describe('CrossChainOrder', () => {
    it('Should encode/decode raw order', () => {
        const rawOrder = {
            maker: '0x63dc317f3208b10c46f4ff97faa04dd632487408',
            makerAsset: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            takerAsset: '0x00000000000000000000000000000000000001f4',
            makerTraits:
                '62419173104490761595518734106350460423635492700242201632361211614299783430144',
            salt: '1410071294180528718533536018330595554196821979936720230760247937083',
            makingAmount: '41420000000000000',
            takingAmount: '261067595245294398218',
            receiver: '0x0000000000000000000000000000000000000000'
        }
        const extension =
            '0x000001230000005e0000005e0000005e0000005e0000002f000000000000000000000000000000000000000000000000000000000000000000000066bba8f70000b4030d520237b400780186da003c00000000000000000000000000000000000000000000000000000066bba8f70000b4030d520237b400780186da003c000000000000000000000000000000000000000066bba8ded1a23c3abeed63c51b860000081b4b4e1773c2ae1d1651115a2d6d443d8c55256808395a8a83e986a917f73f720000000000000000000000000000000000000000000000000000000000000089000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000090e4a41235800000000000000000004547258d4c86c000000000000001a40000012c000000b400000264000001ec0000015000000024'

        const o = CrossChainOrder.fromDataAndExtension(
            rawOrder,
            Extension.decode(extension)
        )

        expect(o.build()).toStrictEqual(rawOrder)
    })

    it('Should getMultipleFillIdx', () => {
        const rawOrder = {
            salt: '102412815605163333306499942368781310361338818117812724107394620400737590471129',
            maker: '0x6edc317f3208b10c46f4ff97faa04dd632487408',
            receiver: '0x0000000000000000000000000000000000000000',
            makerAsset: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
            takerAsset: '0xda0000d4000015a526378bb6fafc650cea5966f8',
            makerTraits:
                '33471150795161712739625987854073848363835857029316554794001693971572152336384',
            makingAmount: '80000000',
            takingAmount: '79314404'
        }
        const extension =
            '0x000001230000005e0000005e0000005e0000005e0000002f0000000000000000a7bcb4eac8964306f9e3764f67db6a7af6ddf99a000d3d0000000a66e4706f0000b400d19a00b1f30078000d3d003ca7bcb4eac8964306f9e3764f67db6a7af6ddf99a000d3d0000000a66e4706f0000b400d19a00b1f30078000d3d003ca7bcb4eac8964306f9e3764f67db6a7af6ddf99a66e4705e555d67e125f8769284ba00000800516df7f436cd4aa9c714cf8dafd978cba12632f5c696ca464804b2d7ea6ae00000000000000000000000000000000000000000000000000000000000000064000000000000000000000000ddafbb505ad214d7b80b1f830fccc89b60fb7a8300000000000000000000046398184200000000000000000000017f9c78c235900000000000000150000000d80000002400000228000001b0000001140000003c'

        const o = CrossChainOrder.fromDataAndExtension(
            rawOrder,
            Extension.decode(extension)
        )

        const idx = o.getMultipleFillIdx(20004415n)
        expect(idx).toStrictEqual(20)

        const idx2 = o.getMultipleFillIdx(20004415n, o.makingAmount - 20004415n)
        expect(idx2).toStrictEqual(40)

        const idx3 = o.getMultipleFillIdx(o.makingAmount)
        expect(idx3).toStrictEqual(81)
    })

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
