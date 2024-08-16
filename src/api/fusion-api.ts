import {AxiosProviderConnector} from '@1inch/fusion-sdk'
import {FusionApiConfig} from './types'
import {
    QuoterApi,
    QuoterRequest,
    QuoterCustomPresetRequest,
    Quote
} from './quoter'
import {RelayerApi, RelayerRequest} from './relayer'
import {
    ActiveOrdersRequest,
    ActiveOrdersResponse,
    OrdersApi,
    OrdersByMakerRequest,
    OrderStatusRequest,
    OrderStatusResponse,
    OrdersByMakerResponse
} from './orders'

export class FusionApi {
    private readonly quoterApi: QuoterApi

    private readonly relayerApi: RelayerApi

    private readonly ordersApi: OrdersApi

    constructor(config: FusionApiConfig) {
        const httpProvider =
            config.httpProvider || new AxiosProviderConnector(config.authKey)
        this.quoterApi = new QuoterApi(
            {
                url: `${config.url}/quoter`,
                authKey: config.authKey
            },
            httpProvider
        )

        this.relayerApi = new RelayerApi(
            {
                url: `${config.url}/relayer`,
                authKey: config.authKey
            },
            httpProvider
        )

        this.ordersApi = new OrdersApi(
            {
                url: `${config.url}/orders`,
                authKey: config.authKey
            },
            httpProvider
        )
    }

    getQuote(params: QuoterRequest): Promise<Quote> {
        return this.quoterApi.getQuote(params)
    }

    getQuoteWithCustomPreset(
        params: QuoterRequest,
        body: QuoterCustomPresetRequest
    ): Promise<Quote> {
        return this.quoterApi.getQuoteWithCustomPreset(params, body)
    }

    getActiveOrders(
        params: ActiveOrdersRequest = new ActiveOrdersRequest()
    ): Promise<ActiveOrdersResponse> {
        return this.ordersApi.getActiveOrders(params)
    }

    getOrderStatus(params: OrderStatusRequest): Promise<OrderStatusResponse> {
        return this.ordersApi.getOrderStatus(params)
    }

    getOrdersByMaker(
        params: OrdersByMakerRequest
    ): Promise<OrdersByMakerResponse> {
        return this.ordersApi.getOrdersByMaker(params)
    }

    submitOrder(params: RelayerRequest): Promise<void> {
        return this.relayerApi.submit(params)
    }

    submitOrderBatch(params: RelayerRequest[]): Promise<void> {
        return this.relayerApi.submitBatch(params)
    }
}