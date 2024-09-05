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
    OrderStatusResponse,
    PublishedSecretsResponse,
    ReadyToAcceptSecretFills,
    ReadyToExecutePublicActions
} from './types'
import {concatQueryParams} from '../params'

export class OrdersApi {
    private static Version = 'v1.0'

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

    async getReadyToAcceptSecretFills(
        orderHash: string
    ): Promise<ReadyToAcceptSecretFills> {
        const url = `${this.config.url}/${OrdersApi.Version}/order/ready-to-accept-secret-fills/${orderHash}`

        return this.httpClient.get(url)
    }

    async getReadyToExecutePublicActions(): Promise<ReadyToExecutePublicActions> {
        const url = `${this.config.url}/${OrdersApi.Version}/order/ready-to-execute-public-actions`

        return this.httpClient.get(url)
    }

    async getPublishedSecrets(
        orderHash: string
    ): Promise<PublishedSecretsResponse> {
        const url = `${this.config.url}/${OrdersApi.Version}/order/secrets/${orderHash}`

        return this.httpClient.get(url)
    }
}
