import {HttpProviderConnector} from '@1inch/fusion-sdk'
import {
    ActiveOrdersRequest,
    OrdersByMakerRequest,
    OrderStatusRequest
} from './orders.request'
import {
    ActiveOrdersResponse,
    OrdersApiConfig,
    OrdersByMakerResponse,
    OrderStatusResponse
} from './types'
import {concatQueryParams} from '../params'

export class OrdersApi {
    private static Version = 'v2.0'

    constructor(
        private readonly config: OrdersApiConfig,
        private readonly httpClient: HttpProviderConnector
    ) {}

    async getActiveOrders(
        params: ActiveOrdersRequest = new ActiveOrdersRequest()
    ): Promise<ActiveOrdersResponse> {
        const queryParams = concatQueryParams(params.build())
        const url = `${this.config.url}/${OrdersApi.Version}/order/active/${queryParams}`

        return this.httpClient.get<ActiveOrdersResponse>(url)
    }

    async getOrderStatus(
        params: OrderStatusRequest
    ): Promise<OrderStatusResponse> {
        const url = `${this.config.url}/${OrdersApi.Version}/order/status/${params.orderHash}`

        return this.httpClient.get<OrderStatusResponse>(url)
    }

    async getOrdersByMaker(
        params: OrdersByMakerRequest
    ): Promise<OrdersByMakerResponse> {
        const qp = concatQueryParams(params.buildQueryParams())
        const url = `${this.config.url}/${OrdersApi.Version}/order/maker/${params.address}/${qp}`

        return this.httpClient.get(url)
    }
}