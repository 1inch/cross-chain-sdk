import {LimitOrderV4Struct, NetworkEnum} from '@1inch/fusion-sdk'
import {Jsonify} from 'type-fest'
import {WsApiConfig} from '../connector/ws'
import {PaginationOutput} from '../api/types'
import {ActiveOrder} from '../api/orders'
import {Immutables} from '../immutables'
import {SupportedChain} from '../chains'

export type Event<K extends string, T> = {
    type: K
    data: T
    availableEvents: readonly string[]
}

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

export type OrderBalanceOrAllowanceChangeEvent = Event<
    'order_balance_or_allowance_change',
    {
        orderHash: string
        remainingMakerAmount: string
        balance: string
        allowance: string
    }
>

export type OrderInvalidEvent = Event<
    'order_invalid',
    {
        orderHash: string
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

export type OrderFilledEvent = Event<'order_filled', {orderHash: string}>

export type OrderFilledPartiallyEvent = Event<
    'order_filled_partially',
    {orderHash: string; remainingMakerAmount: string}
>

export type OnOrderCb = (data: OrderEventType) => any

export type OnOrderCreatedCb = (data: OrderCreatedEvent) => any

export type OnOrderInvalidCb = (data: OrderInvalidEvent) => any

export type OnOrderCancelledCb = (data: OrderCancelledEvent) => any

export type OnOrderNotEnoughBalanceOrAllowanceCb = (
    data: OrderBalanceOrAllowanceChangeEvent
) => any

export type OnOrderFilledCb = (data: OrderFilledEvent) => any

export type OnOrderFilledPartiallyCb = (data: OrderFilledPartiallyEvent) => any

export type WsApiConfigWithNetwork = WsApiConfig & {
    network: NetworkEnum
}

export type RpcEvent<T extends RpcMethod, K> = {method: T; data: K}

export type GetAllowMethodsRpcEvent = RpcEvent<'getAllowedMethods', RpcMethod[]>

export type RpcMethod = 'getAllowedMethods' | 'ping' | 'getActiveOrders'

export type RpcEventType =
    | PingRpcEvent
    | GetAllowMethodsRpcEvent
    | GetActiveOrdersRpcEvent

export type Ping = {
    timestampUtcMs: number
}
export type PingRpcEvent = RpcEvent<'ping', Ping>

export type GetActiveOrdersRpcEvent = RpcEvent<
    'getActiveOrders',
    PaginationOutput<ActiveOrder>
>

export type OnPongCb = (data: PingRpcEvent['data']) => any

export type OnGetAllowedMethodsCb = (
    data: GetAllowMethodsRpcEvent['data']
) => any

export type OnGetActiveOrdersCb = (data: GetActiveOrdersRpcEvent['data']) => any

export type WebSocketEvent = 'close' | 'error' | 'message' | 'open'
