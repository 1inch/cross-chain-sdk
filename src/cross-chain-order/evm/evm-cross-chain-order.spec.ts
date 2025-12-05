import {
    Extension,
    Address as FusionAddress,
    CHAIN_TO_WRAPPER
} from '@1inch/fusion-sdk'
import {ProxyFactory} from '@1inch/limit-order-sdk'
import {UINT_256_MAX} from '@1inch/byte-utils'
import {EvmCrossChainOrder} from './evm-cross-chain-order.js'
import {EvmCrossChainOrderInfo, EvmEscrowParams} from './types.js'
import {AuctionDetails} from '../../domains/auction-details/index.js'
import {now} from '../../utils/index.js'
import {
    createAddress,
    EvmAddress as Address,
    EvmAddress,
    SolanaAddress
} from '../../domains/addresses/index.js'
import {HashLock} from '../../domains/hash-lock/index.js'
import {TimeLocks} from '../../domains/time-locks/index.js'
import {getRandomBytes32} from '../../test-utils/get-random-bytes-32.js'
import {NetworkEnum, EvmChain, SupportedChain} from '../../chains.js'

describe('EvmCrossChainOrder', () => {
    it('Should encode/decode raw order', () => {
        const factoryAddress = Address.fromBigInt(1n)
        const orderData: EvmCrossChainOrderInfo = {
            maker: Address.fromBigInt(2n),
            makerAsset: EvmAddress.fromString(
                '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
            ),
            takerAsset: EvmAddress.fromString(
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ),
            makingAmount: 41420000000000000n,
            takingAmount: 261067595245294398218n
        }

        const escrowParams: EvmEscrowParams = {
            hashLock: HashLock.forSingleFill(getRandomBytes32()),
            srcChainId: NetworkEnum.ETHEREUM,
            dstChainId: NetworkEnum.ARBITRUM,
            srcSafetyDeposit: 1000n,
            dstSafetyDeposit: 1000n,
            timeLocks: TimeLocks.new({
                srcWithdrawal: 100n,
                srcPublicWithdrawal: 200n,
                srcCancellation: 300n,
                srcPublicCancellation: 400n,
                dstWithdrawal: 100n,
                dstPublicWithdrawal: 200n,
                dstCancellation: 300n
            })
        }

        const order = EvmCrossChainOrder.new(
            factoryAddress,
            orderData,
            escrowParams,
            {
                auction: new AuctionDetails({
                    startTime: 1717155959n,
                    duration: 180n,
                    points: [],
                    initialRateBump: 50000
                }),
                whitelist: [{address: Address.fromBigInt(100n), allowFrom: 0n}]
            }
        )

        const rawOrder = order.build()
        const extension = order.extension.encode()

        const decoded = EvmCrossChainOrder.fromDataAndExtension(
            rawOrder,
            Extension.decode(extension)
        )

        expect(decoded.build()).toStrictEqual(rawOrder)
    })

    it('Should getMultipleFillIdx', () => {
        const factoryAddress = Address.fromBigInt(1n)
        const orderData: EvmCrossChainOrderInfo = {
            maker: Address.fromBigInt(2n),
            makerAsset: EvmAddress.fromString(
                '0xaf88d065e77c8cc2239327c5edb3a432268e5831'
            ),
            takerAsset: EvmAddress.fromString(
                '0xddafbb505ad214d7b80b1f830fccc89b60fb7a83'
            ),
            makingAmount: 80000000n,
            takingAmount: 79314404n
        }

        const secrets = Array.from({length: 82}, () => getRandomBytes32())
        const leaves = HashLock.getMerkleLeaves(secrets)

        const escrowParams: EvmEscrowParams = {
            hashLock: HashLock.forMultipleFills(leaves),
            srcChainId: NetworkEnum.ARBITRUM,
            dstChainId: NetworkEnum.POLYGON,
            srcSafetyDeposit: 1000n,
            dstSafetyDeposit: 1000n,
            timeLocks: TimeLocks.new({
                srcWithdrawal: 60n,
                srcPublicWithdrawal: 120n,
                srcCancellation: 180n,
                srcPublicCancellation: 240n,
                dstWithdrawal: 60n,
                dstPublicWithdrawal: 120n,
                dstCancellation: 180n
            })
        }

        const order = EvmCrossChainOrder.new(
            factoryAddress,
            orderData,
            escrowParams,
            {
                auction: new AuctionDetails({
                    startTime: 1726611567n,
                    duration: 180n,
                    points: [{coefficient: 20000, delay: 12}],
                    initialRateBump: 50000
                }),
                whitelist: [{address: Address.fromBigInt(100n), allowFrom: 0n}]
            },
            {allowMultipleFills: true}
        )

        const fillAmount = order.makingAmount / BigInt(secrets.length)

        expect(order.getMultipleFillIdx(fillAmount)).toStrictEqual(0)
        expect(
            order.getMultipleFillIdx(
                fillAmount,
                order.makingAmount - fillAmount
            )
        ).toStrictEqual(1)
        expect(order.getMultipleFillIdx(fillAmount, fillAmount)).toStrictEqual(
            81
        )
        expect(order.getMultipleFillIdx(order.makingAmount)).toStrictEqual(81)
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
        const takerAsset = EvmAddress.fromString(
            '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'
        )

        const orderInfo = {
            takerAsset,
            makingAmount: 100n,
            takingAmount: 142n,
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
        const takerAsset = EvmAddress.fromString(
            '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'
        )

        const orderInfo = {
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
            srcChainId: NetworkEnum.ETHEREUM as EvmChain,
            dstChainId: NetworkEnum.POLYGON as EvmChain,
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

        const order = EvmCrossChainOrder.fromNative(
            chainId,
            ethOrderFactory,
            escrowFactory,
            orderInfo,
            details,
            escrowParams
        )

        expect(order.makerAsset.toString()).toBe(
            CHAIN_TO_WRAPPER[chainId].toString()
        )
        expect(order.takerAsset.toString()).toBe(takerAsset.toString())
        expect(order.makingAmount).toBe(1000000000000000000n)
        expect(order.takingAmount).toBe(1420000000n)

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
            '0xa7bcb4eac8964306f9e3764f67db6a7af6ddf99a'
        )
        const maker = EvmAddress.fromString(
            '0x00000000219ab540356cbb839cbe05303d7705fa'
        )
        const takerAsset = EvmAddress.fromString(
            '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'
        )
        const makerAsset = EvmAddress.fromString(
            '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'
        )

        const orderInfo = {
            takerAsset,
            makingAmount: 1000000000000000000n,
            takingAmount: 1420000000n,
            maker,
            makerAsset
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
            srcChainId: NetworkEnum.ETHEREUM as EvmChain,
            dstChainId: NetworkEnum.POLYGON as EvmChain,
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

    it('should create native order for EVM to Solana (ETH to SOL)', () => {
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
            '0x0000000000000000000000000000000000000000'
        )

        const orderInfo = {
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
            hashLock: HashLock.forSingleFill(getRandomBytes32()),
            srcChainId: NetworkEnum.ETHEREUM as EvmChain,
            dstChainId: NetworkEnum.SOLANA as SupportedChain,
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

        expect(order.makerAsset.toString()).toBe(
            CHAIN_TO_WRAPPER[chainId].toString()
        )
        expect(order.receiver).toStrictEqual(
            createAddress<NetworkEnum.SOLANA>(
                maker.toString(),
                NetworkEnum.SOLANA,
                order.escrowExtension.dstAddressFirstPart
            )
        )
        expect(order.dstChainId).toBe(NetworkEnum.SOLANA)
    })
})
