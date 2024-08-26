import {
    OnOrderFilledCb,
    OnOrderFilledPartiallyCb,
    OnOrderInvalidCb,
    WsProviderConnector
} from '@1inch/fusion-sdk'
import {orderEvents} from './constants'
import {
    EventType,
    OnOrderCancelledCb,
    OnOrderCb,
    OnOrderCreatedCb,
    OnOrderNotEnoughAllowanceCb,
    OnOrderNotEnoughBalanceCb,
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

    onOrderBalanceChange(cb: OnOrderNotEnoughBalanceCb): void {
        this.provider.onMessage((data: OrderEventType) => {
            if (data.event === EventType.OrderBalanceChange) {
                cb(data)
            }
        })
    }

    onOrderAllowanceChange(cb: OnOrderNotEnoughAllowanceCb): void {
        this.provider.onMessage((data: OrderEventType) => {
            if (data.event === EventType.OrderAllowanceChange) {
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
