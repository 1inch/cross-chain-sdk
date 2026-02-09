import {instance, mock} from 'ts-mockito'
import {
    HttpProviderConnector,
    Web3Like,
    Web3ProviderConnector
} from '@1inch/fusion-sdk'
import {SDK} from './sdk.js'
import {
    ChainType,
    HashLock,
    SolanaAddress,
    EvmAddress
} from '../domains/index.js'
import {EvmChain, NetworkEnum} from '../chains.js'
import {
    Quote,
    PresetEnum,
    QuoterResponse,
    QuoterRequest
} from '../api/quoter/index.js'
import {ApiVersion} from '../api/orders/index.js'
import {ResolverCancellationConfig} from '../cross-chain-order/index.js'
import {EvmCrossChainOrder} from '../cross-chain-order/evm/index.js'
import {AuctionDetails} from '../domains/auction-details/index.js'
import {TimeLocks} from '../domains/time-locks/index.js'
import {getRandomBytes32} from '../test-utils/get-random-bytes-32.js'
import {now} from '../utils/index.js'

function createHttpProviderFake<T>(mock: T): HttpProviderConnector {
    return {
        get: jest.fn().mockImplementationOnce(() => {
            return Promise.resolve(mock)
        }),
        post: jest.fn().mockImplementation(() => {
            return Promise.resolve(null)
        })
    }
}

const url = 'https://test.com'

describe(__filename, () => {
    let web3Provider: Web3Like
    let web3ProviderConnector: Web3ProviderConnector

    beforeEach(() => {
        web3Provider = mock<Web3Like>()
        web3ProviderConnector = new Web3ProviderConnector(
            instance(web3Provider)
        )
    })

    it('returns encoded call data to cancel order', async () => {
        const expected = {
            order: {
                salt: '45144194282371711345892930501725766861375817078109214409479816083205610767025',
                maker: '0x6f250c769001617aff9bdf4b9fd878062e94af83',
                receiver: '0x0000000000000000000000000000000000000000',
                makerAsset: '0x6eb15148d0ea88433dd8088a3acc515d27e36c1b',
                takerAsset: '0xdac17f958d2ee523a2206206994597c13d831ec7',
                makingAmount: '2246481050155000',
                takingAmount: '349837736598',
                makerTraits: '0'
            },
            cancelTx: null,
            points: null,
            auctionStartDate: 1674491231,
            auctionDuration: 180,
            initialRateBump: 50484,
            srcChainId: NetworkEnum.ETHEREUM,
            status: 'filled',
            extension: '0x',
            createdAt: '2023-01-23T16:26:38.803Z',
            fromTokenToUsdPrice: '0.01546652159249409068',
            toTokenToUsdPrice: '1.00135361305236370022',
            fills: [
                {
                    txHash: '0xcdd81e6860fc038d4fe8549efdf18488154667a2088d471cdaa7d492f24178a1',
                    filledMakerAmount: '2246481050155001',
                    filledAuctionTakerAmount: '351593117428'
                }
            ],
            isNativeCurrency: false
        }

        const httpProvider = createHttpProviderFake(expected)
        const sdk = new SDK({
            url,
            httpProvider,
            blockchainProvider: web3ProviderConnector
        })

        const orderHash = `0x1beee023ab933cf5446c298eadadb61c05705f2156ef5b2db36c160b36f31ce4`
        const callData = await sdk.buildCancelOrderCallData(orderHash)
        expect(callData).toBe(
            '0xb68fb02000000000000000000000000000000000000000000000000000000000000000001beee023ab933cf5446c298eadadb61c05705f2156ef5b2db36c160b36f31ce4'
        )
    })

    it('throws an exception if order is not get from api', async () => {
        const url = 'https://test.com'

        const expected = undefined
        const httpProvider = createHttpProviderFake(expected)
        const sdk = new SDK({
            url,
            httpProvider,
            blockchainProvider: web3ProviderConnector
        })

        const orderHash = `0x1beee023ab933cf5446c298eadadb61c05705f2156ef5b2db36c160b36f31ce4`
        const promise = sdk.buildCancelOrderCallData(orderHash)
        await expect(promise).rejects.toThrow(
            'Can not get order with the specified orderHash 0x1beee023ab933cf5446c298eadadb61c05705f2156ef5b2db36c160b36f31ce4'
        )
    })

    it('creates evm->evm order', () => {
        const params = QuoterRequest.forEVM({
            srcChain: NetworkEnum.ETHEREUM,
            dstChain: NetworkEnum.POLYGON,
            srcTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            dstTokenAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
            amount: '100000000000000000',
            walletAddress: '0x00000000219ab540356cbb839cbe05303d7705fa'
        })

        const ResponseMock: QuoterResponse = {
            quoteId: '27d54fa5-9e57-47dc-af27-8ed150a7ca75',
            srcTokenAmount: '100000000000000000',
            dstTokenAmount: '256915982',
            autoK: 1,
            presets: {
                fast: {
                    auctionDuration: 180,
                    startAuctionIn: 24,
                    initialRateBump: 84909,
                    auctionStartAmount: '257797497',
                    startAmount: '256915967',
                    auctionEndAmount: '255626994',
                    exclusiveResolver: null,
                    costInDstToken: '881530',
                    points: [
                        {
                            delay: 120,
                            coefficient: 63932
                        },
                        {
                            delay: 60,
                            coefficient: 34485
                        }
                    ],
                    allowPartialFills: false,
                    allowMultipleFills: false,
                    gasCost: {
                        gasBumpEstimate: 34485,
                        gasPriceEstimate: '1171'
                    },
                    secretsCount: 1
                },
                medium: {
                    auctionDuration: 360,
                    startAuctionIn: 24,
                    initialRateBump: 84909,
                    auctionStartAmount: '257797497',
                    startAmount: '256915967',
                    auctionEndAmount: '255626994',
                    exclusiveResolver: null,
                    costInDstToken: '881530',
                    points: [
                        {
                            delay: 360,
                            coefficient: 34485
                        }
                    ],
                    allowPartialFills: false,
                    allowMultipleFills: false,
                    gasCost: {
                        gasBumpEstimate: 34485,
                        gasPriceEstimate: '1171'
                    },
                    secretsCount: 1
                },
                slow: {
                    auctionDuration: 600,
                    startAuctionIn: 24,
                    initialRateBump: 84909,
                    auctionStartAmount: '257797497',
                    startAmount: '256915967',
                    auctionEndAmount: '255626994',
                    exclusiveResolver: null,
                    costInDstToken: '881530',
                    points: [
                        {
                            delay: 600,
                            coefficient: 34485
                        }
                    ],
                    allowPartialFills: false,
                    allowMultipleFills: false,
                    gasCost: {
                        gasBumpEstimate: 34485,
                        gasPriceEstimate: '1171'
                    },
                    secretsCount: 1
                }
            },
            timeLocks: {
                srcWithdrawal: 36,
                srcPublicWithdrawal: 336,
                srcCancellation: 492,
                srcPublicCancellation: 612,
                dstWithdrawal: 180,
                dstPublicWithdrawal: 300,
                dstCancellation: 420
            },
            srcEscrowFactory: '0x0000000000000000000000000000000000000000',
            dstEscrowFactory: '0x0000000000000000000000000000000000000000',
            srcSafetyDeposit: '141752059440000',
            dstSafetyDeposit: '20474999822640000',
            whitelist: ['0x7246999fd1bab15b4ac7d1a23c3abeed63c51b86'],
            recommendedPreset: PresetEnum.fast,
            prices: {
                usd: {
                    srcToken: '2577.6314',
                    dstToken: '0.9996849753143391'
                }
            },
            volume: {
                usd: {
                    srcToken: '257.76',
                    dstToken: '257.72'
                }
            }
        }

        const httpProvider = createHttpProviderFake(undefined)
        const sdk = new SDK({
            url,
            httpProvider,
            blockchainProvider: web3ProviderConnector
        })
        const quote = Quote.fromEVMQuote(params, ResponseMock)

        const order = sdk.createOrder(quote, {
            hashLock: HashLock.fromString(
                '0xa1195b3d7dcc5e0d82df9e8a61c034d51920b7d5947b4af2330eb43342521f2b'
            ),
            secretHashes: [],
            walletAddress: '0x0000000000000000000000000000000000000000'
        })

        expect(order).toBeDefined()
    })

    describe('getCancellableOrders', () => {
        it('should get cancellable orders with default SVM chain type', async () => {
            const mockApiResponse = {
                items: [
                    {
                        orderHash:
                            'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
                        txSignature: 'txSig123',
                        maker: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
                        order: {
                            orderInfo: {
                                srcToken:
                                    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                                dstToken:
                                    'So11111111111111111111111111111111111111112',
                                maker: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
                                srcAmount: '1000000',
                                minDstAmount: '500000',
                                receiver:
                                    '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
                            },
                            extra: {
                                resolverCancellationConfig: {
                                    maxCancellationPremium: '1000000',
                                    cancellationAuctionDuration: 3600
                                },
                                srcAssetIsNative: false
                            }
                        }
                    }
                ],
                meta: {
                    totalItems: 1,
                    currentPage: 1,
                    totalPages: 1,
                    itemsPerPage: 100
                }
            }

            const httpProvider = createHttpProviderFake(undefined)
            const sdk = new SDK({
                url,
                httpProvider,
                blockchainProvider: web3ProviderConnector
            })

            jest.spyOn(sdk.api, 'getCancellableOrders').mockResolvedValue(
                mockApiResponse
            )

            const result = await sdk.getCancellableOrders()

            expect(result.items.length).toBe(1)
            expect(result.items[0]).toMatchObject({
                maker: expect.any(SolanaAddress),
                token: expect.any(SolanaAddress),
                orderHash: expect.any(Uint8Array),
                cancellationConfig: expect.any(ResolverCancellationConfig),
                isAssetNative: false
            })
            expect(result.meta.totalItems).toBe(1)

            expect(sdk.api.getCancellableOrders).toHaveBeenCalledWith(
                ChainType.SVM,
                expect.objectContaining({
                    page: 1,
                    limit: 100
                }),
                undefined
            )
        })

        it('should get cancellable orders for EVM chain type', async () => {
            const mockApiResponse = {
                items: [
                    {
                        orderHash:
                            '0x077662b5ae8bb705353ad71e9a3bd55f24bb67b276ae70d7a4fcae05c5818781',
                        maker: '0xe91d153e0b41518a2ce8dd3d7944fa863463a970',
                        srcChainId: 1,
                        dstChainId: 137,
                        order: {
                            makerAsset:
                                '0xe91d153e0b41518a2ce8dd3d7944fa863463a971',
                            takerAsset:
                                '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d',
                            makingAmount: '11',
                            takingAmount: '10',
                            maker: '0xe91d153e0b41518a2ce8dd3d7944fa863463a970',
                            receiver:
                                '0xe91d153e0b41518a2ce8dd3d7944fa863463a971',
                            salt: '0x1',
                            makerTraits: '0'
                        },
                        extension: 'ExtensionEncodedData',
                        remainingMakerAmount: '5',
                        version: ApiVersion.V1_2
                    }
                ],
                meta: {
                    totalItems: 1,
                    currentPage: 1,
                    totalPages: 1,
                    itemsPerPage: 10
                }
            }

            const httpProvider = createHttpProviderFake(undefined)
            const sdk = new SDK({
                url,
                httpProvider,
                blockchainProvider: web3ProviderConnector
            })

            jest.spyOn(sdk.api, 'getCancellableOrders').mockResolvedValue(
                mockApiResponse
            )

            const result = await sdk.getCancellableOrders(ChainType.EVM, 1, 10)

            expect(result.items.length).toBe(1)
            expect(result.items[0]).toMatchObject({
                maker: expect.any(Object), // EvmAddress
                orderHash:
                    '0x077662b5ae8bb705353ad71e9a3bd55f24bb67b276ae70d7a4fcae05c5818781',
                srcChainId: 1,
                dstChainId: 137,
                order: expect.any(Object),
                extension: 'ExtensionEncodedData'
            })
            expect(result.meta.totalItems).toBe(1)

            expect(sdk.api.getCancellableOrders).toHaveBeenCalledWith(
                ChainType.EVM,
                expect.objectContaining({
                    page: 1,
                    limit: 10
                }),
                undefined
            )
        })

        it('should handle pagination parameters correctly', async () => {
            const mockResponse = {
                items: [],
                meta: {
                    totalItems: 0,
                    currentPage: 2,
                    totalPages: 1,
                    itemsPerPage: 50
                }
            }

            const httpProvider = createHttpProviderFake(undefined)
            const sdk = new SDK({
                url,
                httpProvider,
                blockchainProvider: web3ProviderConnector
            })

            jest.spyOn(sdk.api, 'getCancellableOrders').mockResolvedValue(
                mockResponse
            )

            await sdk.getCancellableOrders(ChainType.SVM, 2, 50, [
                ApiVersion.V1_1,
                ApiVersion.V1_2
            ])

            expect(sdk.api.getCancellableOrders).toHaveBeenCalledWith(
                ChainType.SVM,
                expect.objectContaining({
                    page: 2,
                    limit: 50
                }),
                [ApiVersion.V1_1, ApiVersion.V1_2]
            )
        })
    })

    describe('submitOrder', () => {
        it('should submit order successfully', async () => {
            const httpProvider = createHttpProviderFake(undefined)
            const sdk = new SDK({
                url,
                httpProvider,
                blockchainProvider: web3ProviderConnector
            })

            jest.spyOn(sdk.api, 'submitOrder').mockResolvedValue(undefined)
            jest.spyOn(
                web3ProviderConnector,
                'signTypedData'
            ).mockResolvedValue('0xsignature')

            const factoryAddress = EvmAddress.fromBigInt(1n)
            const orderData = {
                maker: EvmAddress.fromBigInt(2n),
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
            const escrowParams = {
                hashLock: HashLock.forMultipleFills(leaves),
                srcChainId: NetworkEnum.ETHEREUM as EvmChain,
                dstChainId: NetworkEnum.ARBITRUM as EvmChain,
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
                    whitelist: [
                        {address: EvmAddress.fromBigInt(100n), allowFrom: 0n}
                    ]
                },
                {
                    nonce: 1n,
                    allowMultipleFills: true
                }
            )

            const result = await sdk.submitOrder(
                NetworkEnum.ETHEREUM,
                order,
                'quote-id-123',
                secrets
            )

            expect(result.quoteId).toBe('quote-id-123')
            expect(result.signature).toBe('0xsignature')
            expect(result.order).toBeDefined()
            expect(result.orderHash).toBeDefined()
        })
    })

    describe('submitNativeOrder', () => {
        it('should submit native order successfully', async () => {
            const httpProvider = createHttpProviderFake(undefined)
            const sdk = new SDK({
                url,
                httpProvider,
                blockchainProvider: web3ProviderConnector
            })

            jest.spyOn(sdk.api, 'submitOrder').mockResolvedValue(undefined)

            const factoryAddress = EvmAddress.fromBigInt(1n)
            const maker = EvmAddress.fromString(
                '0x00000000219ab540356cbb839cbe05303d7705fa'
            )

            const orderData = {
                maker,
                takerAsset: EvmAddress.fromString(
                    '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'
                ),
                makingAmount: 1000000000000000000n,
                takingAmount: 1420000000n
            }

            const nativeSecrets = [
                getRandomBytes32(),
                getRandomBytes32(),
                getRandomBytes32()
            ]
            const nativeLeaves = HashLock.getMerkleLeaves(nativeSecrets)
            const escrowParams = {
                hashLock: HashLock.forMultipleFills(nativeLeaves),
                srcChainId: NetworkEnum.ETHEREUM as EvmChain,
                dstChainId: NetworkEnum.ARBITRUM as EvmChain,
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
                {
                    ...orderData,
                    makerAsset: EvmAddress.fromString(
                        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
                    ) // WETH
                },
                escrowParams,
                {
                    auction: new AuctionDetails({
                        startTime: BigInt(now()),
                        duration: 180n,
                        points: [],
                        initialRateBump: 100_000
                    }),
                    whitelist: [
                        {address: EvmAddress.fromBigInt(100n), allowFrom: 0n}
                    ]
                },
                {
                    allowMultipleFills: true
                }
            )

            const result = await sdk.submitNativeOrder(
                NetworkEnum.ETHEREUM,
                order,
                maker,
                'quote-id-123',
                nativeSecrets
            )

            expect(result.quoteId).toBe('quote-id-123')
            expect(result.signature).toBeDefined()
            expect(result.order).toBeDefined()
            expect(result.orderHash).toBeDefined()
        })
    })
})
