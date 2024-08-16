import {isHexString} from '@1inch/byte-utils'
import {isValidAddress} from '@1inch/fusion-sdk'
import {
    ActiveOrdersRequestParams,
    OrdersByMakerParams,
    OrderStatusParams
} from './types'
import {PaginationParams, PaginationRequest} from '../pagination'

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

    constructor(params: OrdersByMakerParams) {
        this.address = params.address
        this.pagination = new PaginationRequest(params.page, params.limit)

        if (!isValidAddress(this.address)) {
            throw Error(`${this.address} is invalid address`)
        }
    }

    buildQueryParams(): PaginationParams {
        return {
            limit: this.pagination.limit,
            page: this.pagination.page
        }
    }
}
