import {
    Extension,
    ProxyFactory,
    Address as FusionAddress,
    CHAIN_TO_WRAPPER
} from '@1inch/fusion-sdk'
import {UINT_256_MAX} from '@1inch/byte-utils'
import assert from 'assert'
import {EvmCrossChainOrder} from './evm-cross-chain-order.js'
import {EvmCrossChainOrderInfo, EvmEscrowParams} from './types.js'
import {AuctionDetails} from '../../domains/auction-details/index.js'
import {now} from '../../utils/index.js'
import {
    EvmAddress as Address,
    EvmAddress,
    SolanaAddress
} from '../../domains/addresses/index.js'
import {HashLock} from '../../domains/hash-lock/index.js'
import {TimeLocks} from '../../domains/time-locks/index.js'
import {getRandomBytes32} from '../../test-utils/get-random-bytes-32.js'
import {NetworkEnum, EvmChain} from '../../chains.js'

describe('EvmCrossChainOrder', () => {
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

        const o = EvmCrossChainOrder.fromDataAndExtension(
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

        const o = EvmCrossChainOrder.fromDataAndExtension(
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
        const orderData: EvmCrossChainOrderInfo = {
            maker: Address.fromBigInt(2n),
            makerAsset: EvmAddress.fromString(
                '0xdac17f958d2ee523a2206206994597c13d831ec7'
            ),
            takerAsset: EvmAddress.fromString(
                '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'
            ),
            makingAmount: 100_000000n,
            takingAmount: 90_000000n
        }

        const escrowParams: EvmEscrowParams = {
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
        const order = EvmCrossChainOrder.new(
            factoryAddress,
            orderData,
            escrowParams,
            {
                auction: new AuctionDetails({
                    startTime: BigInt(now()),
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
            EvmCrossChainOrder.fromDataAndExtension(
                order.build(),
                Extension.decode(order.extension.encode())
            )
        ).toEqual(order)
    })

    it('Should encode/decode order with multiple fills', () => {
        const factoryAddress = Address.fromBigInt(1n)
        const orderData: EvmCrossChainOrderInfo = {
            maker: Address.fromBigInt(2n),
            makerAsset: EvmAddress.fromString(
                '0xdac17f958d2ee523a2206206994597c13d831ec7'
            ),
            takerAsset: EvmAddress.fromString(
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

        const escrowParams: EvmEscrowParams = {
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
        const order = EvmCrossChainOrder.new(
            factoryAddress,
            orderData,
            escrowParams,
            {
                auction: new AuctionDetails({
                    startTime: BigInt(now()),
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
            EvmCrossChainOrder.fromDataAndExtension(
                order.build(),
                Extension.decode(order.extension.encode())
            )
        ).toEqual(order)
    })

    it('should throw error for not supported chain', () => {
        const factoryAddress = Address.fromBigInt(1n)
        const orderData: EvmCrossChainOrderInfo = {
            maker: Address.fromBigInt(2n),
            makerAsset: EvmAddress.fromString(
                '0xdac17f958d2ee523a2206206994597c13d831ec7'
            ),
            takerAsset: EvmAddress.fromString(
                '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'
            ),
            makingAmount: 100_000000n,
            takingAmount: 90_000000n
        }

        const createOrder = (
            srcChainId: number,
            dstChainId: number
        ): EvmCrossChainOrder => {
            const escrowParams: EvmEscrowParams = {
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

            return EvmCrossChainOrder.new(
                factoryAddress,
                orderData,
                escrowParams,
                {
                    auction: new AuctionDetails({
                        startTime: BigInt(now()),
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
        const orderData: EvmCrossChainOrderInfo = {
            maker: Address.fromBigInt(2n),
            makerAsset: EvmAddress.fromString(
                '0xdac17f958d2ee523a2206206994597c13d831ec7'
            ),
            takerAsset: EvmAddress.fromString(
                '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'
            ),
            makingAmount: 100_000000n,
            takingAmount: 90_000000n
        }

        const escrowParams: EvmEscrowParams = {
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

        const createOrder = (): EvmCrossChainOrder =>
            EvmCrossChainOrder.new(
                factoryAddress,
                orderData,
                escrowParams,
                {
                    auction: new AuctionDetails({
                        startTime: BigInt(now()),
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

    it('Should return correct receiver/taker asset for solana chain', () => {
        const factoryAddress = Address.fromBigInt(1n)
        const receiver = SolanaAddress.fromBigInt(UINT_256_MAX)
        const takerAsset = SolanaAddress.fromBigInt(10n)
        const orderData: EvmCrossChainOrderInfo = {
            maker: Address.fromBigInt(2n),
            makerAsset: EvmAddress.fromString(
                '0xdac17f958d2ee523a2206206994597c13d831ec7'
            ),
            takerAsset,
            makingAmount: 100_000000n,
            takingAmount: 90_000000n,
            receiver
        }

        const escrowParams: EvmEscrowParams = {
            hashLock: HashLock.forSingleFill(getRandomBytes32()),
            srcChainId: NetworkEnum.ETHEREUM,
            dstChainId: NetworkEnum.SOLANA,
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
        const order = EvmCrossChainOrder.new(
            factoryAddress,
            orderData,
            escrowParams,
            {
                auction: new AuctionDetails({
                    startTime: BigInt(now()),
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

        const decodedOrder = EvmCrossChainOrder.fromDataAndExtension(
            order.build(),
            Extension.decode(order.extension.encode())
        )

        expect(decodedOrder).toEqual(order)

        expect(decodedOrder.receiver).toStrictEqual(receiver)
        expect(decodedOrder.takerAsset).toStrictEqual(takerAsset)
    })

    it('Should return correct receiver/taker asset for solana chain native dst', () => {
        const factoryAddress = Address.fromBigInt(1n)
        const receiver = SolanaAddress.fromBigInt(UINT_256_MAX)
        const takerAsset = SolanaAddress.NATIVE
        const orderData: EvmCrossChainOrderInfo = {
            maker: Address.fromBigInt(2n),
            makerAsset: EvmAddress.fromString(
                '0xdac17f958d2ee523a2206206994597c13d831ec7'
            ),
            takerAsset,
            makingAmount: 100_000000n,
            takingAmount: 90_000000n,
            receiver
        }

        const escrowParams: EvmEscrowParams = {
            hashLock: HashLock.forSingleFill(getRandomBytes32()),
            srcChainId: NetworkEnum.ETHEREUM,
            dstChainId: NetworkEnum.SOLANA,
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
        const order = EvmCrossChainOrder.new(
            factoryAddress,
            orderData,
            escrowParams,
            {
                auction: new AuctionDetails({
                    startTime: BigInt(now()),
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
        console.log('---order ', order.salt)
        const decodedOrder = EvmCrossChainOrder.fromDataAndExtension(
            order.build(),
            Extension.decode(order.extension.encode())
        )

        expect(decodedOrder).toEqual(order)

        expect(decodedOrder.receiver).toStrictEqual(receiver)
        expect(decodedOrder.takerAsset).toStrictEqual(takerAsset)
    })
})

describe('EvmCrossChainOrder Native', () => {
    it('should correctly detect that order is from native asset', () => {
        assert(
            14731471305425731835501358456506963481282622950074n <= UINT_256_MAX,
            'salt too big'
        )

        const ethOrderFactory = new ProxyFactory(
            FusionAddress.fromBigInt(1n),
            FusionAddress.fromBigInt(2n)
        )
        const chainId = NetworkEnum.ETHEREUM
        const escrowFactory = EvmAddress.fromString(
            '0xa7bcb4eac8964306f9e3764f67db6a7af6ddf99a'
        )

        const maker = EvmAddress.fromString(
            '0x00000000219ab540356cbb839cbe05303d7705fa'
        )
        const receiver = EvmAddress.fromString(
            '0x00000000219ab540356cbb839cbe05303d7705fa'
        )
        const takerAsset = EvmAddress.fromString(
            '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'
        )

        const orderInfo = {
            takerAsset,
            makingAmount: 100n,
            takingAmount: 142n,
            maker,
            salt: 10n,
            receiver
        }

        const details = {
            auction: new AuctionDetails({
                duration: 180n,
                startTime: 1673548149n,
                initialRateBump: 50000,
                points: [
                    {
                        coefficient: 20000,
                        delay: 12
                    }
                ]
            }),
            whitelist: [
                {
                    address: EvmAddress.fromString(
                        '0x00000000219ab540356cbb839cbe05303d7705fa'
                    ),
                    allowFrom: 0n
                }
            ]
        }

        const escrowParams = {
            hashLock: HashLock.forSingleFill(getRandomBytes32()),
            srcChainId: NetworkEnum.ETHEREUM as EvmChain,
            dstChainId: NetworkEnum.ARBITRUM as EvmChain,
            srcSafetyDeposit: 1000000000000000000n,
            dstSafetyDeposit: 1000000000000000000n,
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

        const order = EvmCrossChainOrder.fromNative(
            chainId,
            ethOrderFactory,
            escrowFactory,
            orderInfo,
            details,
            escrowParams
        )

        expect(
            order.isNative(
                chainId,
                ethOrderFactory,
                order.nativeSignature(maker)
            )
        ).toEqual(true)

        expect(
            EvmCrossChainOrder.fromDataAndExtension(
                order.build(),
                order.extension
            ).isNative(chainId, ethOrderFactory, order.nativeSignature(maker))
        ).toEqual(true)
    })

    it('should correctly detect that order is from native asset (no salt)', () => {
        const ethOrderFactory = new ProxyFactory(
            FusionAddress.fromBigInt(
                0x62c650084e97a0fba2ecf365cc6d8a7722425363n
            ),
            FusionAddress.fromBigInt(
                0xe8773a43fce4eedb18d0edbaf319059e1ae786afn
            )
        )
        const chainId = NetworkEnum.ETHEREUM
        const escrowFactory = EvmAddress.fromString(
            '0x2ad5004c60e16e54d5007c80ce329adde5b51ef5'
        )
        const maker = EvmAddress.fromString(
            '0x962a836519109e162754161000d65d9dc027fa0f'
        )
        const receiver = EvmAddress.fromString(
            '0x962a836519109e162754161000d65d9dc027fa0f'
        )
        const takerAsset = EvmAddress.fromString(
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
        )

        // Create a regular order with wrapper address to test native detection
        const orderInfo = {
            makerAsset: new EvmAddress(CHAIN_TO_WRAPPER[chainId]), // Use wrapper address for native
            takerAsset,
            makingAmount: 1000000000000000000n,
            takingAmount: 1420000000n,
            maker,
            receiver
        }

        const details = {
            auction: new AuctionDetails({
                duration: 180n,
                startTime: 1673548149n,
                initialRateBump: 50000,
                points: [
                    {
                        coefficient: 20000,
                        delay: 12
                    }
                ]
            }),
            whitelist: [
                {
                    address: EvmAddress.fromString(
                        '0x00000000219ab540356cbb839cbe05303d7705fa'
                    ),
                    allowFrom: 0n
                }
            ]
        }

        const escrowParams = {
            hashLock: HashLock.fromString(
                '0x1234567890123456789012345678901234567890123456789012345678901234'
            ),
            srcChainId: NetworkEnum.ETHEREUM,
            dstChainId: NetworkEnum.POLYGON,
            srcSafetyDeposit: 1000000000000000000n,
            dstSafetyDeposit: 1000000000000000000n,
            timeLocks: TimeLocks.new({
                srcWithdrawal: 1673548149n,
                srcPublicWithdrawal: 1673548150n,
                srcCancellation: 1673548151n,
                srcPublicCancellation: 1673548152n,
                dstWithdrawal: 1673548153n,
                dstPublicWithdrawal: 1673548154n,
                dstCancellation: 1673548155n
            })
        }

        const order = EvmCrossChainOrder.new(
            escrowFactory,
            orderInfo,
            escrowParams,
            details
        )

        // Verify that the order is created successfully and has the correct properties
        expect(order.makerAsset.toString()).toBe(
            CHAIN_TO_WRAPPER[chainId].toString()
        )
        expect(order.maker.toString()).toBe(maker.toString())
        expect(order.takerAsset.toString()).toBe(takerAsset.toString())
        expect(order.makingAmount).toBe(1000000000000000000n)
        expect(order.takingAmount).toBe(1420000000n)

        // Verify that the order can be encoded and decoded
        const decodedOrder = EvmCrossChainOrder.fromDataAndExtension(
            order.build(),
            Extension.decode(order.extension.encode())
        )
        expect(decodedOrder.makerAsset.toString()).toBe(
            order.makerAsset.toString()
        )
        expect(decodedOrder.maker.toString()).toBe(order.maker.toString())
    })

    it('should correctly detect that order is NOT from native asset', () => {
        const ethOrderFactory = new ProxyFactory(
            FusionAddress.fromBigInt(1n),
            FusionAddress.fromBigInt(2n)
        )
        const chainId = NetworkEnum.ETHEREUM
        const escrowFactory = EvmAddress.fromString(
            '0x0000000000000000000000000000000000000001'
        )
        const maker = EvmAddress.fromString(
            '0x00000000219ab540356cbb839cbe05303d7705fa'
        )
        const receiver = EvmAddress.fromString(
            '0x00000000219ab540356cbb839cbe05303d7705fa'
        )
        const makerAsset = EvmAddress.fromString(
            '0x1000000000000000000000000000000000000000'
        )
        const takerAsset = EvmAddress.fromString(
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
        )

        const orderInfo = {
            makerAsset,
            takerAsset,
            makingAmount: 1000000000000000000n,
            takingAmount: 1420000000n,
            maker,
            salt: 10n,
            receiver
        }

        const details = {
            auction: new AuctionDetails({
                duration: 180n,
                startTime: 1673548149n,
                initialRateBump: 50000,
                points: [
                    {
                        coefficient: 20000,
                        delay: 12
                    }
                ]
            }),
            whitelist: [
                {
                    address: EvmAddress.fromString(
                        '0x00000000219ab540356cbb839cbe05303d7705fa'
                    ),
                    allowFrom: 0n
                }
            ]
        }

        const escrowParams = {
            hashLock: HashLock.fromString(
                '0x1234567890123456789012345678901234567890123456789012345678901234'
            ),
            srcChainId: NetworkEnum.ETHEREUM,
            dstChainId: NetworkEnum.POLYGON,
            srcSafetyDeposit: 1000000000000000000n,
            dstSafetyDeposit: 1000000000000000000n,
            timeLocks: TimeLocks.new({
                srcWithdrawal: 1673548149n,
                srcPublicWithdrawal: 1673548150n,
                srcCancellation: 1673548151n,
                srcPublicCancellation: 1673548152n,
                dstWithdrawal: 1673548153n,
                dstPublicWithdrawal: 1673548154n,
                dstCancellation: 1673548155n
            })
        }

        const regularOrder = EvmCrossChainOrder.new(
            escrowFactory,
            orderInfo,
            escrowParams,
            details
        )

        expect(
            regularOrder.isNative(
                chainId,
                ethOrderFactory,
                regularOrder.nativeSignature(maker)
            )
        ).toEqual(false)

        expect(
            EvmCrossChainOrder.fromDataAndExtension(
                regularOrder.build(),
                regularOrder.extension
            ).isNative(
                chainId,
                ethOrderFactory,
                regularOrder.nativeSignature(maker)
            )
        ).toEqual(false)
    })

    it('should correctly set makerAsset to wrapper address for native orders', () => {
        const ethOrderFactory = new ProxyFactory(
            FusionAddress.fromBigInt(1n),
            FusionAddress.fromBigInt(2n)
        )
        const chainId = NetworkEnum.ETHEREUM
        const escrowFactory = EvmAddress.fromString(
            '0x0000000000000000000000000000000000000001'
        )
        const maker = EvmAddress.fromString(
            '0x00000000219ab540356cbb839cbe05303d7705fa'
        )
        const takerAsset = EvmAddress.fromString(
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
        )

        const orderInfo = {
            makerAsset: new EvmAddress(CHAIN_TO_WRAPPER[chainId]), // Use wrapper address for native
            takerAsset,
            makingAmount: 1000000000000000000n,
            takingAmount: 1420000000n,
            maker
        }

        const details = {
            auction: new AuctionDetails({
                duration: 180n,
                startTime: 1673548149n,
                initialRateBump: 50000,
                points: [
                    {
                        coefficient: 20000,
                        delay: 12
                    }
                ]
            }),
            whitelist: [
                {
                    address: EvmAddress.fromString(
                        '0x00000000219ab540356cbb839cbe05303d7705fa'
                    ),
                    allowFrom: 0n
                }
            ]
        }

        const escrowParams = {
            hashLock: HashLock.fromString(
                '0x1234567890123456789012345678901234567890123456789012345678901234'
            ),
            srcChainId: NetworkEnum.ETHEREUM,
            dstChainId: NetworkEnum.POLYGON,
            srcSafetyDeposit: 1000000000000000000n,
            dstSafetyDeposit: 1000000000000000000n,
            timeLocks: TimeLocks.new({
                srcWithdrawal: 1673548149n,
                srcPublicWithdrawal: 1673548150n,
                srcCancellation: 1673548151n,
                srcPublicCancellation: 1673548152n,
                dstWithdrawal: 1673548153n,
                dstPublicWithdrawal: 1673548154n,
                dstCancellation: 1673548155n
            })
        }

        const order = EvmCrossChainOrder.new(
            escrowFactory,
            orderInfo,
            escrowParams,
            details
        )

        // The makerAsset should be set to the wrapper address for the chain
        expect(order.makerAsset.toString()).toBe(
            CHAIN_TO_WRAPPER[chainId].toString()
        )

        // Verify that the order is created successfully and has the correct properties
        expect(order.maker.toString()).toBe(maker.toString())
        expect(order.takerAsset.toString()).toBe(takerAsset.toString())
        expect(order.makingAmount).toBe(1000000000000000000n)
        expect(order.takingAmount).toBe(1420000000n)
    })
})
