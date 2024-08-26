import {
    OnOrderFilledCb,
    OnOrderFilledPartiallyCb,
    OnOrderInvalidCb,
    OnOrderNotEnoughBalanceOrAllowanceCb,
    WsProviderConnector
} from '@1inch/fusion-sdk'
import {orderEvents} from './constants'
import {
    EventType,
    OnOrderCancelledCb,
    OnOrderCb,
    OnOrderCreatedCb,
    OnOrderSecretSharedCb,
    OrderEventType
} from './types'

export class ActiveOrdersWebSocketApi {
    public readonly provider!: WsProviderConnector

    constructor(provider: WsProviderConnector) {
        this.provider = provider
    }

    onOrder(cb: OnOrderCb): void {
        this.provider.onMessage((data: OrderEventType) => {
            if (orderEvents.includes(data.event)) {
                cb(data)
            }
        })
    }

    onOrderCreated(cb: OnOrderCreatedCb): void {
        this.provider.onMessage((data: OrderEventType) => {
            if (data.event === EventType.OrderCreated) {
                cb(data)
            }
        })
    }

    onOrderInvalid(cb: OnOrderInvalidCb): void {
        this.provider.onMessage((data: OrderEventType) => {
            if (data.event === EventType.OrderInvalid) {
                cb(data)
            }
        })
    }

    onOrderBalanceOrAllowanceChange(
        cb: OnOrderNotEnoughBalanceOrAllowanceCb
    ): void {
        this.provider.onMessage((data: OrderEventType) => {
            if (data.event === EventType.OrderBalanceOrAllowanceChange) {
                cb(data)
            }
        })
    }

    onOrderFilled(cb: OnOrderFilledCb): void {
        this.provider.onMessage((data: OrderEventType) => {
            if (data.event === EventType.OrderFilled) {
                cb(data)
            }
        })
    }

    onOrderCancelled(cb: OnOrderCancelledCb): void {
        this.provider.onMessage((data: OrderEventType) => {
            if (data.event === EventType.OrderCancelled) {
                cb(data)
            }
        })
    }

    onOrderFilledPartially(cb: OnOrderFilledPartiallyCb): void {
        this.provider.onMessage((data: OrderEventType) => {
            if (data.event === EventType.OrderFilledPartially) {
                cb(data)
            }
        })
    }

    onOrderSecretShared(cb: OnOrderSecretSharedCb): void {
        this.provider.onMessage((data: OrderEventType) => {
            if (data.event === EventType.OrderSecretShared) {
                cb(data)
            }
        })
    }
}
