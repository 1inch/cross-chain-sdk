import {
    Event,
    GetAllowMethodsRpcEvent,
    LimitOrderV4Struct,
    OrderBalanceOrAllowanceChangeEvent,
    OrderFilledEvent,
    OrderFilledPartiallyEvent,
    OrderInvalidEvent,
    PingRpcEvent,
    RpcEvent
} from '@1inch/fusion-sdk'
import {Jsonify} from 'type-fest'
import {PaginationOutput} from '../api/types'
import {ActiveOrder} from '../api/orders'
import {Immutables} from '../immutables'
import {SupportedChain} from '../chains'

export type OrderEventType =
    | OrderCreatedEvent
    | OrderInvalidEvent
    | OrderBalanceOrAllowanceChangeEvent
    | OrderFilledEvent
    | OrderFilledPartiallyEvent
    | OrderCancelledEvent
    | OrderSecretSharedEvent

export type OrderCreatedEvent = Event<
    'order_created',
    {
        srcChainId: SupportedChain
        dstChainId: SupportedChain
        orderHash: string
        order: LimitOrderV4Struct
        extension: string
        signature: string
        isMakerContract: boolean
        quoteId: string
        merkleLeaves: string[]
        secretHashes: string[]
    }
>

export type OrderCancelledEvent = Event<
    'order_cancelled',
    {
        orderHash: string
        remainingMakerAmount: string
    }
>

export type OrderSecretSharedEvent = Event<
    'secret_shared',
    {
        idx: number
        secret: string
        srcImmutables: Jsonify<Immutables>
        dstImmutables: Jsonify<Immutables>
    }
>

export type OnOrderCb = (data: OrderEventType) => any

export type OnOrderCreatedCb = (data: OrderCreatedEvent) => any

export type OnOrderCancelledCb = (data: OrderCancelledEvent) => any

export type RpcEventType =
    | PingRpcEvent
    | GetAllowMethodsRpcEvent
    | GetActiveOrdersRpcEvent

export type GetActiveOrdersRpcEvent = RpcEvent<
    'getActiveOrders',
    PaginationOutput<ActiveOrder>
>

export type WebSocketEvent = 'close' | 'error' | 'message' | 'open'
