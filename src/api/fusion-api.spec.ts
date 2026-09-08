import {Mock} from 'vitest'
import {HttpProviderConnector} from '@1inch/fusion-sdk'
import {FusionApi} from './fusion-api.js'
import {QuoterRequest} from './quoter/quoter.request.js'
import {QuoterCustomPresetRequest} from './quoter/quoter-custom-preset.request.js'
import {PresetEnum, QuoterResponse} from './quoter/types.js'
import {
    ActiveOrdersRequest,
    OrderStatusRequest,
    OrdersByMakerRequest
} from './orders/orders.request.js'
import {PaginationRequest} from './pagination.js'
import {RelayerRequestEvm} from './relayer/relayer.request.js'
import {ChainType} from '../domains/index.js'
import {NetworkEnum} from '../chains.js'

function quoteResponse(): QuoterResponse {
    return {
        quoteId: 'qid',
        srcTokenAmount: '1',
        dstTokenAmount: '2',
        autoK: 1,
        presets: {
            fast: {
                auctionDuration: 180,
                startAuctionIn: 1,
                initialRateBump: 1,
                auctionStartAmount: '3',
                startAmount: '2',
                auctionEndAmount: '1',
                exclusiveResolver: null,
                costInDstToken: '0',
                points: [],
                allowPartialFills: false,
                allowMultipleFills: false,
                gasCost: {gasBumpEstimate: 0, gasPriceEstimate: '0'},
                secretsCount: 1
            },
            medium: {
                auctionDuration: 180,
                startAuctionIn: 1,
                initialRateBump: 1,
                auctionStartAmount: '3',
                startAmount: '2',
                auctionEndAmount: '1',
                exclusiveResolver: null,
                costInDstToken: '0',
                points: [],
                allowPartialFills: false,
                allowMultipleFills: false,
                gasCost: {gasBumpEstimate: 0, gasPriceEstimate: '0'},
                secretsCount: 1
            },
            slow: {
                auctionDuration: 180,
                startAuctionIn: 1,
                initialRateBump: 1,
                auctionStartAmount: '3',
                startAmount: '2',
                auctionEndAmount: '1',
                exclusiveResolver: null,
                costInDstToken: '0',
                points: [],
                allowPartialFills: false,
                allowMultipleFills: false,
                gasCost: {gasBumpEstimate: 0, gasPriceEstimate: '0'},
                secretsCount: 1
            }
        },
        timeLocks: {
            srcWithdrawal: 1,
            srcPublicWithdrawal: 2,
            srcCancellation: 3,
            srcPublicCancellation: 4,
            dstWithdrawal: 1,
            dstPublicWithdrawal: 2,
            dstCancellation: 3
        },
        srcEscrowFactory: '0x0000000000000000000000000000000000000001',
        dstEscrowFactory: '0x0000000000000000000000000000000000000002',
        srcSafetyDeposit: '1',
        dstSafetyDeposit: '1',
        whitelist: ['0x7246999fd1bab15b4ac7d1a23c3abeed63c51b86'],
        recommendedPreset: PresetEnum.fast,
        prices: {usd: {srcToken: '1', dstToken: '1'}},
        volume: {usd: {srcToken: '1', dstToken: '1'}}
    }
}

describe('FusionApi', () => {
    let http: HttpProviderConnector
    let api: FusionApi

    beforeEach(() => {
        http = {
            get: vi.fn().mockResolvedValue(quoteResponse()),
            post: vi.fn().mockResolvedValue(undefined)
        }
        api = new FusionApi({
            url: 'https://test.com',
            httpProvider: http
        })
    })

    it('getQuote and getQuoteWithCustomPreset go to the quoter', async () => {
        const params = QuoterRequest.forEVM({
            srcChain: NetworkEnum.ETHEREUM,
            dstChain: NetworkEnum.POLYGON,
            srcTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            dstTokenAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
            amount: '100000000000000000',
            walletAddress: '0x00000000219ab540356cbb839cbe05303d7705fa'
        })

        const quote = await api.getQuote(params)
        expect(quote.quoteId).toBe('qid')
        expect(http.get).toHaveBeenCalled()

        const body = QuoterCustomPresetRequest.new({
            customPreset: {
                auctionDuration: 180,
                auctionStartAmount: '100000',
                auctionEndAmount: '50000'
            }
        })
        http.post = vi.fn().mockResolvedValue(quoteResponse())
        const custom = await api.getQuoteWithCustomPreset(params, body)
        expect(custom.quoteId).toBe('qid')
    })

    it('order read methods delegate to the orders API', async () => {
        http.get = vi.fn().mockResolvedValue({items: [], meta: {}})

        await api.getActiveOrders(new ActiveOrdersRequest())
        await api.getOrderStatus(new OrderStatusRequest({orderHash: '0x1'}))
        await api.getOrdersByMaker(
            new OrdersByMakerRequest({
                address: '0x00000000219ab540356cbb839cbe05303d7705fa'
            })
        )
        await api.getReadyToAcceptSecretFills('0xabc')
        await api.getReadyToExecutePublicActions()
        await api.getPublishedSecrets('0xabc')
        await api.getCancellableOrders(
            ChainType.EVM,
            new PaginationRequest(1, 10)
        )

        expect((http.get as Mock).mock.calls.length).toBeGreaterThanOrEqual(7)
    })

    it('submit methods delegate to the relayer API', async () => {
        await api.submitOrder(
            new RelayerRequestEvm({
                srcChainId: NetworkEnum.ETHEREUM,
                order: {
                    salt: '1',
                    maker: '0x00000000219ab540356cbb839cbe05303d7705fa',
                    receiver: '0x0000000000000000000000000000000000000000',
                    makerAsset: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                    takerAsset: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
                    makingAmount: '1',
                    takingAmount: '1',
                    makerTraits: '0'
                },
                signature: '0xsig',
                quoteId: 'qid',
                extension: '0x',
                secretHashes: undefined
            })
        )
        await api.submitOrderBatch([])
        await api.submitSecret('0xhash', '0xsecret')

        expect((http.post as Mock).mock.calls.length).toBe(3)
    })
})
