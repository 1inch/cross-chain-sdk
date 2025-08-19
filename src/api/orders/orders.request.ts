import {
    ActiveOrdersRequestParams,
    OrdersByMakerParams,
    OrderStatusParams
} from './types.js'
import {PaginationRequest} from '../pagination.js'
import {SupportedChain} from '../../chains.js'

export class ActiveOrdersRequest {
    public readonly pagination: PaginationRequest

    constructor(params: ActiveOrdersRequestParams = {}) {
        this.pagination = new PaginationRequest(params.page, params.limit)
    }

    build(): ActiveOrdersRequestParams {
        return {
            page: this.pagination.page,
            limit: this.pagination.limit
        }
    }
}

export class OrderStatusRequest {
    public readonly orderHash: string

    constructor(params: OrderStatusParams) {
        this.orderHash = params.orderHash
    }

    build(): OrderStatusParams {
        return {
            orderHash: this.orderHash
        }
    }
}

export class OrdersByMakerRequest {
    public readonly address: string

    public readonly pagination: PaginationRequest

    public readonly srcChain?: SupportedChain

    public readonly dstChain?: SupportedChain

    public readonly srcToken?: string

    public readonly dstToken?: string

    public readonly withToken?: string

    public readonly timestampFrom?: number

    public readonly timestampTo?: number

    constructor(params: OrdersByMakerParams) {
        this.address = params.address
        this.pagination = new PaginationRequest(params.page, params.limit)
        this.srcChain = params.srcChain
        this.dstChain = params.dstChain
        this.srcToken = params.srcToken
        this.dstToken = params.dstToken
        this.withToken = params.withToken
        this.timestampFrom = params.timestampFrom
        this.timestampTo = params.timestampTo
    }

    buildQueryParams(): Omit<OrdersByMakerParams, 'address'> {
        return {
            limit: this.pagination.limit,
            page: this.pagination.page,
            srcChain: this.srcChain,
            dstChain: this.dstChain,
            srcToken: this.srcToken,
            dstToken: this.dstToken,
            withToken: this.withToken,
            timestampFrom: this.timestampFrom,
            timestampTo: this.timestampTo
        }
    }
}
