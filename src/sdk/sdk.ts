import {encodeCancelOrder, MakerTraits} from '@1inch/fusion-sdk'
import assert from 'assert'
import {SvmCrossChainOrder} from 'cross-chain-order'
import {
    OrderInfo,
    OrderParams,
    PreparedOrder,
    QuoteParams,
    QuoteCustomPresetParams,
    CrossChainSDKConfigParams
} from './types'
import {bufferToHex} from '../utils'
import {EvmAddress} from '../domains/addresses'
import {
    FusionApi,
    Quote,
    QuoterRequest,
    RelayerRequestEvm,
    QuoterCustomPresetRequest,
    ActiveOrdersRequest,
    ActiveOrdersRequestParams,
    ActiveOrdersResponse,
    OrdersByMakerParams,
    OrdersByMakerRequest,
    OrdersByMakerResponse,
    OrderStatusRequest,
    OrderStatusResponse,
    ReadyToAcceptSecretFills,
    PublishedSecretsResponse,
    ReadyToExecutePublicActions,
    QuoterRequestParams,
    RelayerRequestSvm
} from '../api'
import {EvmCrossChainOrder} from '../cross-chain-order/evm'
import {isEvm, NetworkEnum, SupportedChain} from '../chains'

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

    async getReadyToExecutePublicActions(): Promise<ReadyToExecutePublicActions> {
        return this.api.getReadyToExecutePublicActions()
    }

    async getPublishedSecrets(
        orderHash: string
    ): Promise<PublishedSecretsResponse> {
        return this.api.getPublishedSecrets(orderHash)
    }

    async submitSecret(orderHash: string, secret: string): Promise<void> {
        return this.api.submitSecret(orderHash, secret)
    }

    async getQuote(params: QuoteParams): Promise<Quote> {
        const quoteParams: QuoterRequestParams = {
            srcChain: params.srcChainId,
            dstChain: params.dstChainId,
            srcTokenAddress: params.srcTokenAddress,
            dstTokenAddress: params.dstTokenAddress,
            amount: params.amount,
            walletAddress: params.walletAddress || EvmAddress.ZERO.toString(),
            permit: params.permit,
            enableEstimate: !!params.enableEstimate,
            fee: params?.takingFeeBps,
            source: params.source,
            isPermit2: params.isPermit2
        }

        if (QuoterRequest.isEvmRequest(quoteParams)) {
            const req = QuoterRequest.forEVM(quoteParams)

            return this.api.getQuote(req)
        }

        if (QuoterRequest.isSolanaRequest(quoteParams)) {
            const req = QuoterRequest.forSolana(quoteParams)

            return this.api.getQuote(req)
        }

        throw new Error('unknown request src chain')
    }

    async getQuoteWithCustomPreset(
        params: QuoteParams,
        body: QuoteCustomPresetParams
    ): Promise<Quote> {
        const quoteParams: QuoterRequestParams = {
            srcChain: params.srcChainId,
            dstChain: params.dstChainId,
            srcTokenAddress: params.srcTokenAddress,
            dstTokenAddress: params.dstTokenAddress,
            amount: params.amount,
            walletAddress: params.walletAddress,
            permit: params.permit,
            enableEstimate: !!params.enableEstimate,
            fee: params?.takingFeeBps,
            source: params.source,
            isPermit2: params.isPermit2
        }

        const bodyRequest = new QuoterCustomPresetRequest({
            customPreset: body.customPreset
        })

        if (QuoterRequest.isEvmRequest(quoteParams)) {
            const req = QuoterRequest.forEVM(quoteParams)

            return this.api.getQuoteWithCustomPreset(req, bodyRequest)
        }

        if (QuoterRequest.isSolanaRequest(quoteParams)) {
            const req = QuoterRequest.forSolana(quoteParams)

            return this.api.getQuoteWithCustomPreset(req, bodyRequest)
        }

        throw new Error('unknown request src chain')
    }

    createOrder(quote: Quote, params: OrderParams): PreparedOrder {
        if (!quote.quoteId) {
            throw new Error('request quote with enableEstimate=true')
        }

        const order = this.quoteToOrder(quote, params)
        const hash = order.getOrderHash(quote.srcChainId)

        return {order, hash, quoteId: quote.quoteId}
    }

    public async submitOrder(
        srcChainId: SupportedChain,
        order: EvmCrossChainOrder,
        quoteId: string,
        secretHashes: string[]
    ): Promise<OrderInfo> {
        if (!this.config.blockchainProvider) {
            throw new Error('blockchainProvider has not set to config')
        }

        if (!order.multipleFillsAllowed && secretHashes.length > 1) {
            throw new Error(
                'with disabled multiple fills you provided secretHashes > 1'
            )
        } else if (order.multipleFillsAllowed && secretHashes) {
            const secretCount =
                order.escrowExtension.hashLockInfo.getPartsCount() + 1n

            if (secretHashes.length !== Number(secretCount)) {
                throw new Error(
                    'secretHashes length should be equal to number of secrets'
                )
            }
        }

        const orderStruct = order.build()

        const signature = await this.config.blockchainProvider.signTypedData(
            orderStruct.maker,
            order.getTypedData(srcChainId)
        )

        const relayerRequest = new RelayerRequestEvm({
            srcChainId,
            order: orderStruct,
            signature,
            quoteId,
            extension: order.extension.encode(),
            secretHashes: secretHashes.length === 1 ? undefined : secretHashes
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

    /**
     * Announce solana order to relayer before on chain creation,
     * It's required because on chain data does not contains auction details
     *
     * @param order
     * @param quoteId
     * @param secretHashes
     *
     * @returns orderHash
     */
    public async announceOrder(
        order: SvmCrossChainOrder,
        quoteId: string,
        secretHashes: string[]
    ): Promise<string> {
        if (!order.multipleFillsAllowed && secretHashes.length > 1) {
            throw new Error(
                'with disabled multiple fills you provided secretHashes > 1'
            )
        } else if (order.multipleFillsAllowed && secretHashes) {
            const secretCount = order.hashLock.getPartsCount() + 1n

            if (secretHashes.length !== Number(secretCount)) {
                throw new Error(
                    'secretHashes length should be equal to number of secrets'
                )
            }
        }

        const relayerRequest = new RelayerRequestSvm({
            order: order.toJSON(),
            auctionOrderHash: bufferToHex(order.auction.hashForSolana()),
            quoteId,
            secretHashes: secretHashes.length === 1 ? undefined : secretHashes
        })

        await this.api.submitOrder(relayerRequest)

        return order.getOrderHash(NetworkEnum.SOLANA)
    }

    async placeOrder(quote: Quote, params: OrderParams): Promise<OrderInfo> {
        const {order, quoteId} = this.createOrder(quote, params)

        assert(
            order instanceof EvmCrossChainOrder,
            'solana order must be announced with announceOrder and placed onchain'
        )

        return this.submitOrder(
            quote.srcChainId,
            order,
            quoteId,
            params.secretHashes
        )
    }

    /**
     * Only for orders with src chain in EVM
     *
     * @throws Error for non EVM srcChain
     */
    async buildCancelOrderCallData(orderHash: string): Promise<string> {
        const getOrderRequest = new OrderStatusRequest({orderHash})
        const orderData = await this.api.getOrderStatus(getOrderRequest)

        if (!orderData) {
            throw new Error(
                `Can not get order with the specified orderHash ${orderHash}`
            )
        }

        assert(
            isEvm(orderData.srcChainId) && 'extension' in orderData, // extension check needed for TS
            'expected evm src chain'
        )

        return encodeCancelOrder(
            orderHash,
            new MakerTraits(BigInt(orderData.order.makerTraits))
        )
    }

    private quoteToOrder(
        quote: Quote,
        params: OrderParams
    ): SvmCrossChainOrder | EvmCrossChainOrder {
        if (quote.isEvmQuote()) {
            quote.createEvmOrder({
                hashLock: params.hashLock,
                receiver: params.receiver
                    ? EvmAddress.fromString(params.receiver)
                    : undefined,
                preset: params.preset,
                nonce: params.nonce,
                takingFeeReceiver: params.fee?.takingFeeReceiver,
                permit: params.permit,
                isPermit2: params.isPermit2
            })
        }

        assert(params.receiver, 'receiver is required for solana order')

        return quote.createSolanaOrder({
            hashLock: params.hashLock,
            receiver: EvmAddress.fromString(params.receiver),
            preset: params.preset,
            takingFeeReceiver: params.fee?.takingFeeReceiver
        })
    }
}
