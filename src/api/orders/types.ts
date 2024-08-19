import {LimitOrderV4Struct} from '@1inch/fusion-sdk'
import {PaginationOutput} from '../types'
import {AuctionPoint} from '../quoter'
import {PaginationParams} from '../pagination'
import {SupportedChain} from '../../chains'

export type OrdersApiConfig = {
    url: string
    authKey?: string
}

export type ActiveOrdersRequestParams = PaginationParams & {
    srcChainId?: SupportedChain
    dstChainId?: SupportedChain
}

export type ActiveOrder = {
    quoteId: string
    orderHash: string
    signature: string
    deadline: string
    auctionStartDate: string
    auctionEndDate: string
    remainingMakerAmount: string
    order: LimitOrderV4Struct
    extension: string
    srcChainId: SupportedChain
    dstChainId: SupportedChain
    isMakerContract: boolean
}

export type ActiveOrdersResponse = PaginationOutput<ActiveOrder>

export type OrderStatusParams = {
    orderHash: string
}

export enum OrderStatus {
    Pending = 'pending',
    Filled = 'filled'
    //todo: add all statuses
}

export type Fill = {
    txHash: string
    filledMakerAmount: string
    filledAuctionTakerAmount: string
}

export type OrderStatusResponse = {
    status: OrderStatus
    order: LimitOrderV4Struct
    extension: string
    points: AuctionPoint[] | null
    cancelTx: string | null
    fills: Fill[]
    createdAt: string
    auctionStartDate: number
    auctionDuration: number
    initialRateBump: number
    isNativeCurrency: boolean
    fromTokenToUsdPrice: string
    toTokenToUsdPrice: string
}

export type OrdersByMakerParams = {
    address: string
} & PaginationParams

export type OrderFillsByMakerOutput = {
    orderHash: string
    status: OrderStatus
    makerAsset: string
    makerAmount: string
    minTakerAmount: string
    takerAsset: string
    cancelTx: string | null
    fills: Fill[]
    points: AuctionPoint[] | null
    auctionStartDate: number
    auctionDuration: number
    initialRateBump: number
    isNativeCurrency: boolean
    createdAt: string
}

export type OrdersByMakerResponse = PaginationOutput<OrderFillsByMakerOutput>
