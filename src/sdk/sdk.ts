import {
    Address,
    encodeCancelOrder,
    MakerTraits,
    NetworkEnum
} from '@1inch/fusion-sdk'
import {
    OrderInfo,
    OrderParams,
    PreparedOrder,
    QuoteParams,
    QuoteCustomPresetParams,
    CrossChainSDKConfigParams
} from './types'
import {
    FusionApi,
    Quote,
    QuoterRequest,
    RelayerRequest,
    QuoterCustomPresetRequest
} from '../api'
import {
    ActiveOrdersRequest,
    ActiveOrdersRequestParams,
    ActiveOrdersResponse,
    OrdersByMakerParams,
    OrdersByMakerRequest,
    OrdersByMakerResponse,
    OrderStatusRequest,
    OrderStatusResponse
} from '../api/orders'
import {CrossChainOrder} from '../cross-chain-order'

export class FusionSDK {
    public readonly api: FusionApi

    constructor(private readonly config: CrossChainSDKConfigParams) {
        this.api = new FusionApi({
            url: config.url,
            httpProvider: config.httpProvider,
            authKey: config.authKey
        })
    }

    async getActiveOrders({
        page,
        limit
    }: ActiveOrdersRequestParams = {}): Promise<ActiveOrdersResponse> {
        const request = new ActiveOrdersRequest({page, limit})

        return this.api.getActiveOrders(request)
    }

    async getOrderStatus(orderHash: string): Promise<OrderStatusResponse> {
        const request = new OrderStatusRequest({orderHash})

        return this.api.getOrderStatus(request)
    }

    async getOrdersByMaker({
        limit,
        page,
        address
    }: OrdersByMakerParams): Promise<OrdersByMakerResponse> {
        const request = new OrdersByMakerRequest({limit, page, address})

        return this.api.getOrdersByMaker(request)
    }

    async getQuote(params: QuoteParams): Promise<Quote> {
        const request = new QuoterRequest({
            fromTokenAddress: params.fromTokenAddress,
            toTokenAddress: params.toTokenAddress,
            amount: params.amount,
            walletAddress:
                params.walletAddress || Address.ZERO_ADDRESS.toString(),
            permit: params.permit,
            enableEstimate: !!params.enableEstimate,
            fee: params?.takingFeeBps,
            source: params.source,
            isPermit2: params.isPermit2
        })

        return this.api.getQuote(request)
    }

    async getQuoteWithCustomPreset(
        params: QuoteParams,
        body: QuoteCustomPresetParams
    ): Promise<Quote> {
        const paramsRequest = new QuoterRequest({
            fromTokenAddress: params.fromTokenAddress,
            toTokenAddress: params.toTokenAddress,
            amount: params.amount,
            walletAddress:
                params.walletAddress || Address.ZERO_ADDRESS.toString(),
            permit: params.permit,
            enableEstimate: !!params.enableEstimate,
            fee: params?.takingFeeBps,
            source: params.source,
            isPermit2: params.isPermit2
        })

        const bodyRequest = new QuoterCustomPresetRequest({
            customPreset: body.customPreset
        })

        return this.api.getQuoteWithCustomPreset(paramsRequest, bodyRequest)
    }

    async createOrder(params: OrderParams): Promise<PreparedOrder> {
        const quote = await this.getQuoteResult(params)

        if (!quote.quoteId) {
            throw new Error('quoter has not returned quoteId')
        }

        const order = quote.createOrder({
            receiver: params.receiver
                ? new Address(params.receiver)
                : undefined,
            preset: params.preset,
            nonce: params.nonce,
            takingFeeReceiver: params.fee?.takingFeeReceiver,
            allowPartialFills: params.allowPartialFills,
            allowMultipleFills: params.allowMultipleFills,
            srcChainId: params.srcChainId,
            dstChainId: params.dstChainId
        })

        const hash = order.getOrderHash(params.srcChainId)

        return {order, hash, quoteId: quote.quoteId}
    }

    public async submitOrder(
        srcChainId: NetworkEnum,
        order: CrossChainOrder,
        quoteId: string
    ): Promise<OrderInfo> {
        if (!this.config.blockchainProvider) {
            throw new Error('blockchainProvider has not set to config')
        }

        const orderStruct = order.build()

        const signature = await this.config.blockchainProvider.signTypedData(
            orderStruct.maker,
            order.getTypedData(srcChainId)
        )

        const relayerRequest = new RelayerRequest({
            order: orderStruct,
            signature,
            quoteId,
            extension: order.extension.encode()
        })

        await this.api.submitOrder(relayerRequest)

        return {
            order: orderStruct,
            signature,
            quoteId,
            orderHash: order.getOrderHash(srcChainId),
            extension: relayerRequest.extension
        }
    }

    async placeOrder(params: OrderParams): Promise<OrderInfo> {
        const {order, quoteId} = await this.createOrder(params)

        return this.submitOrder(params.srcChainId, order, quoteId)
    }

    async buildCancelOrderCallData(orderHash: string): Promise<string> {
        const getOrderRequest = new OrderStatusRequest({orderHash})
        const orderData = await this.api.getOrderStatus(getOrderRequest)

        if (!orderData) {
            throw new Error(
                `Can not get order with the specified orderHash ${orderHash}`
            )
        }

        const {order} = orderData

        return encodeCancelOrder(
            orderHash,
            new MakerTraits(BigInt(order.makerTraits))
        )
    }

    private async getQuoteResult(params: OrderParams): Promise<Quote> {
        const quoterRequest = new QuoterRequest({
            fromTokenAddress: params.fromTokenAddress,
            toTokenAddress: params.toTokenAddress,
            amount: params.amount,
            walletAddress: params.walletAddress,
            permit: params.permit,
            enableEstimate: true,
            fee: params.fee?.takingFeeBps,
            source: params.source,
            isPermit2: params.isPermit2
        })

        if (!params.customPreset) {
            return this.api.getQuote(quoterRequest)
        }

        const quoterWithCustomPresetBodyRequest = new QuoterCustomPresetRequest(
            {
                customPreset: params.customPreset
            }
        )

        return this.api.getQuoteWithCustomPreset(
            quoterRequest,
            quoterWithCustomPresetBodyRequest
        )
    }
}
