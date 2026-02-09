import {encodeCancelOrder, MakerTraits} from '@1inch/fusion-sdk'
import {utils} from '@coral-xyz/anchor'
import assert from 'assert'
import {
    CrossChainSDKConfigParams,
    EvmOrderCancellationData,
    OrderInfo,
    OrderParams,
    PreparedOrder,
    QuoteCustomPresetParams,
    QuoteParams,
    SvmOrderCancellationData
} from './types.js'
import {
    ResolverCancellationConfig,
    SvmCrossChainOrder
} from '../cross-chain-order/index.js'
import {bufferToHex} from '../utils/index.js'
import {EvmAddress, SolanaAddress} from '../domains/addresses/index.js'
import {
    ActiveOrdersRequest,
    ActiveOrdersRequestParams,
    ActiveOrdersResponse,
    ApiVersion,
    EvmCancellableOrderData,
    FusionApi,
    OrdersByMakerParams,
    OrdersByMakerRequest,
    OrdersByMakerResponse,
    OrderStatusRequest,
    OrderStatusResponse,
    OrderVersionFilter,
    PaginationOutput,
    PaginationRequest,
    PublishedSecretsResponse,
    Quote,
    QuoterCustomPresetRequest,
    QuoterRequest,
    QuoterRequestParams,
    ReadyToAcceptSecretFills,
    ReadyToExecutePublicActions,
    RelayerRequestEvm,
    RelayerRequestSvm,
    SvmCancellableOrderData
} from '../api/index.js'
import {EvmCrossChainOrder} from '../cross-chain-order/evm/index.js'
import {isEvm, NetworkEnum, SupportedChain} from '../chains.js'
import {ChainType} from '../domains/index.js'

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

    async getReadyToExecutePublicActions(
        filter?: OrderVersionFilter
    ): Promise<ReadyToExecutePublicActions> {
        return this.api.getReadyToExecutePublicActions(filter)
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
            integratorFee: params.integratorFee,
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
            integratorFee: params.integratorFee,
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

    /**
     * Submit order to relayer
     *
     * Note, that orders from native assets must be submitted with `submitNativeOrder`
     *
     * @see FusionSDK.submitNativeOrder
     */
    public async submitOrder(
        srcChainId: SupportedChain,
        order: EvmCrossChainOrder,
        quoteId: string,
        secretHashes: string[]
    ): Promise<OrderInfo> {
        const signature = await this.signOrder(order, srcChainId)

        return this._submitOrder(
            srcChainId,
            order,
            quoteId,
            signature,
            secretHashes
        )
    }

    /**
     * Submit order to relayer
     *
     * Note, that orders from native assets must be submitted on-chain as well
     * @see NativeOrdersFactory.create
     */
    public async submitNativeOrder(
        srcChainId: SupportedChain,
        order: EvmCrossChainOrder,
        maker: EvmAddress,
        quoteId: string,
        secretHashes: string[]
    ): Promise<OrderInfo> {
        const signature = this.signNativeOrder(order, maker)

        return this._submitOrder(
            srcChainId,
            order,
            quoteId,
            signature,
            secretHashes
        )
    }

    /**
     * Sign order using `blockchainProvider` from config
     *
     * Use CrossChainSDK.signNativeOrder for signing orders from native asset
     *
     * @see CrossChainSDK.signNativeOrder
     */
    async signOrder(
        order: EvmCrossChainOrder,
        srcChainId: SupportedChain
    ): Promise<string> {
        if (!this.config.blockchainProvider) {
            throw new Error('blockchainProvider has not set to config')
        }

        const orderStruct = order.build()
        const data = order.getTypedData(srcChainId)

        return this.config.blockchainProvider.signTypedData(
            orderStruct.maker,
            data
        )
    }

    public signNativeOrder(
        order: EvmCrossChainOrder,
        maker: EvmAddress
    ): string {
        return order.nativeSignature(maker)
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

    /**
     * Returns on chain created orders which can be cancelled by resolver for premium
     */
    public async getCancellableOrders(
        chainType: ChainType = ChainType.SVM,
        page = 1,
        limit = 100,
        orderVersion?: ApiVersion[]
    ): Promise<
        | PaginationOutput<EvmOrderCancellationData>
        | PaginationOutput<SvmOrderCancellationData>
    > {
        const orders = await this.api.getCancellableOrders(
            chainType,
            new PaginationRequest(page, limit),
            orderVersion
        )

        if (chainType === ChainType.EVM) {
            return this._transformEvmCancellableOrders(orders)
        }

        return this._transformSvmCancellableOrders(orders)
    }

    private async _submitOrder(
        srcChainId: SupportedChain,
        order: EvmCrossChainOrder,
        quoteId: string,
        signature: string,
        secretHashes: string[]
    ): Promise<OrderInfo> {
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

    private _transformEvmCancellableOrders(
        orders: PaginationOutput<
            EvmCancellableOrderData | SvmCancellableOrderData
        >
    ): PaginationOutput<EvmOrderCancellationData> {
        return {
            ...orders,
            items: orders.items.map((o) => {
                assert(this.isEvmOrder(o), 'expected evm order')

                return {
                    maker: EvmAddress.fromString(o.maker),
                    orderHash: o.orderHash,
                    srcChainId: o.srcChainId,
                    dstChainId: o.dstChainId,
                    order: o.order,
                    extension: o.extension,
                    remainingMakerAmount: BigInt(o.remainingMakerAmount),
                    version: o.version
                }
            })
        }
    }

    private _transformSvmCancellableOrders(
        orders: PaginationOutput<
            EvmCancellableOrderData | SvmCancellableOrderData
        >
    ): PaginationOutput<SvmOrderCancellationData> {
        return {
            ...orders,
            items: orders.items.map((o) => {
                assert(this.isSvmOrder(o), 'expected svm order')

                return {
                    maker: SolanaAddress.fromString(o.maker),
                    token: SolanaAddress.fromString(o.order.orderInfo.srcToken),
                    orderHash: utils.bytes.bs58.decode(o.orderHash),
                    cancellationConfig: new ResolverCancellationConfig(
                        BigInt(
                            o.order.extra.resolverCancellationConfig
                                .maxCancellationPremium
                        ),
                        o.order.extra.resolverCancellationConfig
                            .cancellationAuctionDuration
                    ),
                    isAssetNative: o.order.extra.srcAssetIsNative
                }
            })
        }
    }

    private isEvmOrder(
        order: EvmCancellableOrderData | SvmCancellableOrderData
    ): order is EvmCancellableOrderData {
        return 'extension' in order && 'srcChainId' in order
    }

    private isSvmOrder(
        order: EvmCancellableOrderData | SvmCancellableOrderData
    ): order is SvmCancellableOrderData {
        return 'txSignature' in order || !('extension' in order)
    }

    private quoteToOrder(
        quote: Quote,
        params: OrderParams
    ): SvmCrossChainOrder | EvmCrossChainOrder {
        if (quote.isEvmQuote()) {
            return quote.createEvmOrder({
                hashLock: params.hashLock,
                receiver: params.receiver
                    ? EvmAddress.fromString(params.receiver)
                    : undefined,
                preset: params.preset,
                nonce: params.nonce,
                permit: params.permit,
                isPermit2: params.isPermit2
            })
        }

        assert(params.receiver, 'receiver is required for solana order')

        return quote.createSolanaOrder({
            hashLock: params.hashLock,
            receiver: EvmAddress.fromString(params.receiver),
            preset: params.preset
        })
    }
}
