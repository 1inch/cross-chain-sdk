import {HttpProviderConnector, NetworkEnum} from '@1inch/fusion-sdk'
import {RelayerApi} from './relayer.api.js'
import {RelayerRequestEvm, RelayerRequestSvm} from './relayer.request.js'
import {getRandomBytes32} from '../../test-utils/get-random-bytes-32.js'

describe('Relayer API', () => {
    const httpProvider: HttpProviderConnector = {
        get: jest.fn().mockImplementationOnce(() => {
            return Promise.resolve()
        }),
        post: jest.fn().mockImplementation(() => {
            return Promise.resolve()
        })
    }

    it('should submit one order', async () => {
        const relayer = new RelayerApi(
            {
                url: 'https://test.com/relayer'
            },
            httpProvider
        )

        const orderData = {
            order: {
                maker: '0x00000000219ab540356cbb839cbe05303d7705fa',
                makerAsset: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                makingAmount: '1000000000000000000',
                receiver: '0x0000000000000000000000000000000000000000',
                salt: '45118768841948961586167738353692277076075522015101619148498725069326976558864',
                takerAsset: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                takingAmount: '1420000000',
                makerTraits: '0'
            },
            srcChainId: NetworkEnum.ETHEREUM,
            signature: '0x123signature-here789',
            quoteId: '9a43c86d-f3d7-45b9-8cb6-803d2bdfa08b',
            extension: '0x',
            secretHashes: undefined
        } as const

        const params = new RelayerRequestEvm(orderData)

        await relayer.submit(params)

        expect(httpProvider.post).toHaveBeenCalledWith(
            'https://test.com/relayer/v1.2/submit',
            orderData
        )
    })

    it('should announce solana one order', async () => {
        const relayer = new RelayerApi(
            {
                url: 'https://test.com/relayer'
            },
            httpProvider
        )

        const orderData = {
            order: {
                details: {
                    auction: {
                        duration: '120',
                        initialRateBump: 0,
                        points: [],
                        startTime: '1752739636'
                    }
                },
                escrowParams: {
                    dstChainId: 1,
                    dstSafetyDeposit: '1000',
                    hashLock:
                        '0x11f8dd293e31c96da8ed3c186011fd0eb9036cce32f2e08c1c5fd5001b737907',
                    srcChainId: 501,
                    srcSafetyDeposit: '1000',
                    timeLocks:
                        '1318191364591968140515317923577708210251486390651022433320970'
                },
                extra: {
                    allowMultipleFills: false,
                    orderExpirationDelay: '12',
                    resolverCancellationConfig: {
                        cancellationAuctionDuration: 1,
                        maxCancellationPremium: '1'
                    },
                    salt: '1661142325',
                    source: 'sdk',
                    srcAssetIsNative: false
                },
                orderInfo: {
                    dstToken: '0x0000000000000000000000000000000000000004',
                    maker: '11111111111111111111111111111112',
                    minDstAmount: '1000000000',
                    receiver: '0x0000000000000000000000000000000000000002',
                    srcAmount: '1000000000000000000',
                    srcToken: '11111111111111111111111111111114'
                }
            },
            quoteId: '9a43c86d-f3d7-45b9-8cb6-803d2bdfa08b',
            auctionOrderHash: 'her',
            secretHashes: undefined
        }

        const params = new RelayerRequestSvm(orderData)

        await relayer.submit(params)

        expect(httpProvider.post).toHaveBeenCalledWith(
            'https://test.com/relayer/v1.2/submit',
            params.build()
        )
    })

    it('should announce solana 2 orders', async () => {
        const relayer = new RelayerApi(
            {
                url: 'https://test.com/relayer'
            },
            httpProvider
        )

        const orderData = {
            order: {
                details: {
                    auction: {
                        duration: '120',
                        initialRateBump: 0,
                        points: [],
                        startTime: '1752739636'
                    }
                },
                escrowParams: {
                    dstChainId: 1,
                    dstSafetyDeposit: '1000',
                    hashLock:
                        '0x11f8dd293e31c96da8ed3c186011fd0eb9036cce32f2e08c1c5fd5001b737907',
                    srcChainId: 501,
                    srcSafetyDeposit: '1000',
                    timeLocks:
                        '1318191364591968140515317923577708210251486390651022433320970'
                },
                extra: {
                    allowMultipleFills: false,
                    orderExpirationDelay: '12',
                    resolverCancellationConfig: {
                        cancellationAuctionDuration: 1,
                        maxCancellationPremium: '1'
                    },
                    salt: '1661142325',
                    source: 'sdk',
                    srcAssetIsNative: false
                },
                orderInfo: {
                    dstToken: '0x0000000000000000000000000000000000000004',
                    maker: '11111111111111111111111111111112',
                    minDstAmount: '1000000000',
                    receiver: '0x0000000000000000000000000000000000000002',
                    srcAmount: '1000000000000000000',
                    srcToken: '11111111111111111111111111111114'
                }
            },
            quoteId: '9a43c86d-f3d7-45b9-8cb6-803d2bdfa08b',
            auctionOrderHash: 'her',
            secretHashes: undefined
        }

        const params = new RelayerRequestSvm(orderData)

        const batch = [
            params,
            new RelayerRequestSvm({
                ...orderData,
                quoteId: 'other',
                auctionOrderHash: 'her'
            })
        ]

        await relayer.submitBatch(batch)

        expect(httpProvider.post).toHaveBeenCalledWith(
            'https://test.com/relayer/v1.2/submit/many',
            batch.map((b) => b.build())
        )
    })

    it('should submit two orders', async () => {
        const relayer = new RelayerApi(
            {
                url: 'https://test.com/relayer'
            },
            httpProvider
        )

        const orderData1 = {
            order: {
                maker: '0x00000000219ab540356cbb839cbe05303d7705fa',
                makerAsset: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                makingAmount: '1000000000000000000',
                receiver: '0x0000000000000000000000000000000000000000',
                salt: '45118768841948961586167738353692277076075522015101619148498725069326976558864',
                takerAsset: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                takingAmount: '1420000000',
                makerTraits: '0'
            },
            srcChainId: NetworkEnum.ETHEREUM as const,
            signature: '0x123signature-here789',
            quoteId: '9a43c86d-f3d7-45b9-8cb6-803d2bdfa08b',
            extension: '0x',
            secretHashes: [
                getRandomBytes32(),
                getRandomBytes32(),
                getRandomBytes32()
            ]
        }

        const orderData2 = {
            order: {
                maker: '0x12345678219ab540356cbb839cbe05303d771111',
                makerAsset: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                makingAmount: '1000000000000000000',
                receiver: '0x0000000000000000000000000000000000000000',
                salt: '45118768841948961586167738353692277076075522015101619148498725069326976558864',
                takerAsset: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                takingAmount: '1420000000',
                makerTraits: '0'
            },
            srcChainId: NetworkEnum.ETHEREUM,
            signature: '0x123signature-2-here789',
            quoteId: '1a36c861-ffd7-45b9-1cb6-403d3bdfa084',
            extension: '0x',
            secretHashes: undefined
        } as const

        const params = [
            new RelayerRequestEvm(orderData1),
            new RelayerRequestEvm(orderData2)
        ]

        await relayer.submitBatch(params)

        expect(httpProvider.post).toHaveBeenCalledWith(
            'https://test.com/relayer/v1.2/submit/many',
            params
        )
    })

    it('should submit secret', async () => {
        const relayer = new RelayerApi(
            {
                url: 'https://test.com/relayer'
            },
            httpProvider
        )

        const orderHash = '0xorder_hash'
        const secret = '0xsecret'

        await relayer.submitSecret(orderHash, secret)

        expect(httpProvider.post).toHaveBeenCalledWith(
            'https://test.com/relayer/v1.2/submit/secret',
            {
                orderHash,
                secret
            }
        )
    })
})
