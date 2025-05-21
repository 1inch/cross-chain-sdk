import {HttpProviderConnector, NetworkEnum} from '@1inch/fusion-sdk'
import {QuoterApi} from './quoter.api'
import {QuoterRequest} from './quoter.request'
import {Quote} from './quote'
import {PresetEnum, QuoterResponse} from './types'
import {QuoterCustomPresetRequest} from './quoter-custom-preset.request'

describe('Quoter API', () => {
    let httpProvider: HttpProviderConnector

    beforeEach(() => {
        httpProvider = {
            get: jest.fn().mockImplementationOnce(() => {
                return Promise.resolve(ResponseMock)
            }),
            post: jest.fn().mockImplementation(() => {
                return Promise.resolve(ResponseMock)
            })
        }
    })

    const params = QuoterRequest.new({
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

    const QuoterResponseMock = new Quote(params, ResponseMock)

    it('should get quote with disabled estimate', async () => {
        const quoter = new QuoterApi(
            {
                url: 'https://test.com/quoter'
            },
            httpProvider
        )

        const res = await quoter.getQuote(params)

        expect(res).toStrictEqual(QuoterResponseMock)
        expect(httpProvider.get).toHaveBeenCalledWith(
            'https://test.com/quoter/v1.0/quote/receive/?srcChain=1&dstChain=137&srcTokenAddress=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2&dstTokenAddress=0x2791bca1f2de4661ed88a30c99a7a9449aa84174&amount=100000000000000000&walletAddress=0x00000000219ab540356cbb839cbe05303d7705fa&source=sdk'
        )
    })

    it('should not throw error with fee and source added', async () => {
        const quoter = new QuoterApi(
            {
                url: 'https://test.com/quoter'
            },
            httpProvider
        )

        const params = QuoterRequest.new({
            srcChain: NetworkEnum.ETHEREUM,
            dstChain: NetworkEnum.POLYGON,
            srcTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            dstTokenAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
            amount: '100000000000000000',
            walletAddress: '0x00000000219ab540356cbb839cbe05303d7705fa',
            fee: 1,
            source: '0x6b175474e89094c44da98b954eedeac495271d0f'
        })

        const QuoterResponseMock = new Quote(params, ResponseMock)
        const res = await quoter.getQuote(params)
        expect(res).toStrictEqual(QuoterResponseMock)
        expect(httpProvider.get).toHaveBeenCalledWith(
            'https://test.com/quoter/v1.0/quote/receive/?srcChain=1&dstChain=137&srcTokenAddress=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2&dstTokenAddress=0x2791bca1f2de4661ed88a30c99a7a9449aa84174&amount=100000000000000000&walletAddress=0x00000000219ab540356cbb839cbe05303d7705fa&fee=1&source=0x6b175474e89094c44da98b954eedeac495271d0f'
        )
    })

    it('getQuoteWithCustomPreset', async () => {
        const quoter = new QuoterApi(
            {
                url: 'https://test.com/quoter'
            },
            httpProvider
        )

        const params = QuoterRequest.new({
            srcChain: NetworkEnum.ETHEREUM,
            dstChain: NetworkEnum.POLYGON,
            srcTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            dstTokenAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
            amount: '100000000000000000',
            walletAddress: '0x00000000219ab540356cbb839cbe05303d7705fa',
            fee: 1,
            source: '0x6b175474e89094c44da98b954eedeac495271d0f'
        })

        const body = QuoterCustomPresetRequest.new({
            customPreset: {
                auctionDuration: 180,
                auctionStartAmount: '100000',
                auctionEndAmount: '50000',
                points: [
                    {toTokenAmount: '90000', delay: 20},
                    {toTokenAmount: '70000', delay: 40}
                ]
            }
        })

        const QuoterResponseMock = new Quote(params, ResponseMock)
        const res = await quoter.getQuoteWithCustomPreset(params, body)
        expect(res).toStrictEqual(QuoterResponseMock)
        expect(httpProvider.post).toHaveBeenCalledWith(
            'https://test.com/quoter/v1.0/quote/receive/?srcChain=1&dstChain=137&srcTokenAddress=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2&dstTokenAddress=0x2791bca1f2de4661ed88a30c99a7a9449aa84174&amount=100000000000000000&walletAddress=0x00000000219ab540356cbb839cbe05303d7705fa&fee=1&source=0x6b175474e89094c44da98b954eedeac495271d0f',
            body.build()
        )
    })
})
