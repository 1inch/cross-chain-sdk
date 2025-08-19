import {EventType, OrderEventType} from './types.js'

export const orderEvents: OrderEventType['event'][] = [
    EventType.OrderCreated,
    EventType.OrderInvalid,
    EventType.OrderBalanceChange,
    EventType.OrderAllowanceChange,
    EventType.OrderFilled,
    EventType.OrderFilledPartially,
    EventType.OrderCancelled,
    EventType.OrderSecretShared
]
