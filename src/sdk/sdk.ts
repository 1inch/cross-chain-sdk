import {Address, encodeCancelOrder, MakerTraits} from '@1inch/fusion-sdk'
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
    QuoterCustomPresetRequest,
    ActiveOrdersRequest,
    ActiveOrdersRequestParams,
    ActiveOrdersResponse,
    OrdersByMakerParams,
    OrdersByMakerRequest,
    OrdersByMakerResponse,
    OrderStatusRequest,
    OrderStatusResponse,
    ReadyToAcceptSecretFills
} from '../api'
import {CrossChainOrder} from '../cross-chain-order'
import {SupportedChain} from '../chains'

export class SDK {
    public readonly api: FusionApi

    constructor(private readonly config: CrossChainSDKConfigParams) {
        this.api = new FusionApi({
            url: config.url,
            httpProvider: config.httpProvider,
            authKey: config.authKey
        })
    }

    async getActiveOrders(
        params: ActiveOrdersRequestParams = {}
    ): Promise<ActiveOrdersResponse> {
        const request = new ActiveOrdersRequest(params)

        return this.api.getActiveOrders(request)
    }

    async getOrderStatus(orderHash: string): Promise<OrderStatusResponse> {
        const request = new OrderStatusRequest({orderHash})

        return this.api.getOrderStatus(request)
    }

    async getOrdersByMaker(
        params: OrdersByMakerParams
    ): Promise<OrdersByMakerResponse> {
        const request = new OrdersByMakerRequest(params)

        return this.api.getOrdersByMaker(request)
    }

    async getReadyToAcceptSecretFills(
        orderHash: string
    ): Promise<ReadyToAcceptSecretFills> {
        return this.api.getReadyToAcceptSecretFills(orderHash)
    }

    async submitSecret(orderHash: string, secret: string): Promise<void> {
        return this.api.submitSecret(orderHash, secret)
    }

    async getQuote(params: QuoteParams): Promise<Quote> {
        const request = new QuoterRequest({
            srcChain: params.srcChainId,
            dstChain: params.dstChainId,
            srcTokenAddress: params.srcTokenAddress,
            dstTokenAddress: params.dstTokenAddress,
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
            srcChain: params.srcChainId,
            dstChain: params.dstChainId,
            srcTokenAddress: params.srcTokenAddress,
            dstTokenAddress: params.dstTokenAddress,
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
            hashLock: params.hashLock,
            receiver: params.receiver
                ? new Address(params.receiver)
                : undefined,
            preset: params.preset,
            nonce: params.nonce,
            takingFeeReceiver: params.fee?.takingFeeReceiver,
            allowPartialFills: params.allowPartialFills,
            allowMultipleFills: params.allowMultipleFills,
            permit: params.permit,
            isPermit2: params.isPermit2
        })

        const hash = order.getOrderHash(params.srcChainId)

        return {order, hash, quoteId: quote.quoteId}
    }

    public async submitOrder(
        srcChainId: SupportedChain,
        order: CrossChainOrder,
        quoteId: string,
        merkleLeaves?: string[],
        secretHashes?: string[]
    ): Promise<OrderInfo> {
        if (!this.config.blockchainProvider) {
            throw new Error('blockchainProvider has not set to config')
        }

        if (order.multipleFillsAllowed) {
            const secretCount =
                order.escrowExtension.hashLockInfo.getPartsCount() + 1n

            if (!merkleLeaves || !secretHashes) {
                throw new Error(
                    'with multiple fills you need to provide merkleLeaves and secretHashes'
                )
            }

            if (merkleLeaves.length !== secretHashes.length) {
                throw new Error(
                    'merkleLeaves and secretHashes length should be equal'
                )
            }

            if (merkleLeaves.length !== Number(secretCount)) {
                throw new Error(
                    'merkleLeaves and secretHashes length should be equal to number of secrets'
                )
            }
        } else if (merkleLeaves?.length || secretHashes?.length) {
            throw new Error(
                'with disabled partial fills you do not need to provide merkleLeaves and secretHashes'
            )
        }

        const orderStruct = order.build()

        const signature = await this.config.blockchainProvider.signTypedData(
            orderStruct.maker,
            order.getTypedData(srcChainId)
        )

        const relayerRequest = new RelayerRequest({
            srcChainId,
            order: orderStruct,
            signature,
            quoteId,
            extension: order.extension.encode(),
            merkleLeaves,
            secretHashes
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

    private async getQuoteResult(
        params: Omit<OrderParams, 'hashLock'>
    ): Promise<Quote> {
        const quoterRequest = new QuoterRequest({
            srcChain: params.srcChainId,
            dstChain: params.dstChainId,
            srcTokenAddress: params.srcTokenAddress,
            dstTokenAddress: params.dstTokenAddress,
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
