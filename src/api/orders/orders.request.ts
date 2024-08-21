import {isHexString} from '@1inch/byte-utils'
import {isValidAddress} from '@1inch/fusion-sdk'
import {
    ActiveOrdersRequestParams,
    OrdersByMakerParams,
    OrderStatusParams
} from './types'
import {PaginationRequest} from '../pagination'
import {SupportedChain} from '../../chains'

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

        if (this.orderHash.length !== 66) {
            throw Error(`orderHash length should be equals 66`)
        }

        if (!isHexString(this.orderHash)) {
            throw Error(`orderHash have to be hex`)
        }
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

        if (!isValidAddress(this.address)) {
            throw Error(`${this.address} is invalid address`)
        }

        if (this.srcToken && !isValidAddress(this.srcToken)) {
            throw Error(`${this.srcToken} is invalid address`)
        }

        if (this.dstToken && !isValidAddress(this.dstToken)) {
            throw Error(`${this.dstToken} is invalid address`)
        }

        if (this.withToken && !isValidAddress(this.withToken)) {
            throw Error(`${this.withToken} is invalid address`)
        }
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
