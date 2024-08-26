import {
    Event,
    GetAllowMethodsRpcEvent,
    LimitOrderV4Struct,
    OrderFilledEvent,
    OrderFilledPartiallyEvent,
    OrderInvalidEvent,
    PingRpcEvent
} from '@1inch/fusion-sdk'
import {Jsonify} from 'type-fest'
import {PaginationOutput} from '../api/types'
import {ActiveOrder, OrderType, PublicSecret} from '../api/orders'
import {Immutables} from '../immutables'
import {SupportedChain} from '../chains'

export type OrderEventType =
    | OrderCreatedEvent
    | OrderInvalidEvent
    | OrderBalanceChangeEvent
    | OrderAllowanceChangeEvent
    | OrderFilledEvent
    | OrderFilledPartiallyEvent
    | OrderCancelledEvent
    | OrderSecretSharedEvent

export enum EventType {
    OrderCreated = 'order_created',
    OrderInvalid = 'order_invalid',
    OrderBalanceChange = 'order_balance_change',
    OrderAllowanceChange = 'order_allowance_change',
    OrderFilled = 'order_filled',
    OrderFilledPartially = 'order_filled_partially',
    OrderCancelled = 'order_cancelled',
    OrderSecretShared = 'secret_shared'
}

export type OrderCreatedEvent = Event<
    EventType.OrderCreated,
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

export type OrderBalanceChangeEvent = Event<
    EventType.OrderBalanceChange,
    {
        orderHash: string
        remainingMakerAmount: string
        balance: string
    }
>

export type OrderAllowanceChangeEvent = Event<
    EventType.OrderAllowanceChange,
    {
        orderHash: string
        remainingMakerAmount: string
        allowance: string
    }
>

export type OrderCancelledEvent = Event<
    EventType.OrderCancelled,
    {
        orderHash: string
        remainingMakerAmount: string
    }
>

export type OrderSecretSharedEvent = Event<
    EventType.OrderSecretShared,
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

export type OnOrderSecretSharedCb = (data: OrderSecretSharedEvent) => any

export type OnGetSecretsCb = (data: GetSecretsRpcEvent['result']) => any

export type OnOrderNotEnoughBalanceCb = (data: OrderBalanceChangeEvent) => any

export type OnOrderNotEnoughAllowanceCb = (
    data: OrderAllowanceChangeEvent
) => any

export type RpcEventType =
    | PingRpcEvent
    | GetAllowMethodsRpcEvent
    | GetActiveOrdersRpcEvent
    | GetSecretsRpcEvent

export enum RpcMethod {
    GetAllowedMethods = 'getAllowedMethods',
    Ping = 'ping',
    GetActiveOrders = 'getActiveOrders',
    GetSecrets = 'getSecrets'
}

export type RpcEvent<T extends RpcMethod, K> = {
    method: T
    result: K
}

export type GetActiveOrdersRpcEvent = RpcEvent<
    RpcMethod.GetActiveOrders,
    PaginationOutput<ActiveOrder>
>

export type SerializableTo<To> =
    | {
          toJSON(): Jsonify<To>
      }
    | {[key in keyof To]: SerializableTo<To[key]>}

export type ResolverDataOutput = {
    orderType: OrderType
    secrets: PublicSecret[]
    merkleLeaves: string[]
    secretHashes: string[]
}

export type GetSecretsRpcEvent = RpcEvent<
    RpcMethod.GetSecrets,
    SerializableTo<ResolverDataOutput> | {error: string}
>

export enum WebSocketEvent {
    Close = 'close',
    Error = 'error',
    Message = 'message',
    Open = 'open'
}
