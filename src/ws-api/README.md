# Websocket Api

**Description:** provides high level functionality to working with fusion mode

## Real world example

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const wsSdk = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
    authKey: 'your-auth-key'
})

wsSdk.order.onOrder((data) => {
    console.log('received order event', data)
})
```

## Creation

**With constructor:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion/ws',
    authKey: 'your-auth-key'
})
```

**Custom provider:**

User can provide custom provider for websocket (be default we are using [ws library](https://www.npmjs.com/package/ws))

```typescript
import {WsProviderConnector, WebSocketApi} from '@1inch/cross-chain-sdk'

class MyFancyProvider implements WsProviderConnector {
    // ... user implementation
}

const url = 'wss://api.1inch.dev/fusion-plus/ws/v1.0'
const provider = new MyFancyProvider({url})

const wsSdk = new WebSocketApi(provider)
```

**With new static method:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = WebSocketApi.new({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})
```

**Lazy initialization:**

By default, when user creates an instance of WebSocketApi, it automatically opens websocket connection which might be a problem for some use cases

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
    network: NetworkEnum.ETHEREUM,
    lazyInit: true
})

ws.init()
```

## Methods

**Base methods**

### on

**Description**: You can subscribe to any event

**Arguments**:

-   [0] event: string
-   [1] cb: Function

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})

ws.on(WebSocketEvent.Error, console.error)

ws.on(WebSocketEvent.Open, function open() {
    ws.send('something')
})

ws.on(WebSocketEvent.Message, function message(data) {
    console.log('received: %s', data)
})
```

### off

**Description**: You can unsubscribe from any event

**Arguments**:

-   [0] event: string
-   [1] сb: Function

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})

ws.on(WebSocketEvent.Error, console.error)

ws.on(WebSocketEvent.Open, function open() {
    ws.send('something')
})

function message(data) {
    console.log('received: %s', data)
}

ws.on(WebSocketEvent.Message, message)

ws.off(WebSocketEvent.Message, message)
```

### onOpen

**Description**: subscribe to open event

**Arguments**:

-   [0] cb: Function

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})

ws.onOpen(() => {
    console.log('connection is opened')
})
```

### send

**Description**: send event to backend

**Arguments**:

-   [0] message: any message which can be serialized with JSON.stringify

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})

ws.send('my message')
```

### close

**Description**: close connection

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})

ws.close()
```

### onMessage

**Description**: subscribe to message event

**Arguments**:

-   [0] cb: (data: any) => void

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})

ws.onMessage((data) => {
    console.log('message received', data)
})
```

### onClose

**Description**: subscribe to close event

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})

ws.onClose(() => {
    console.log('connection is closed')
})
```

### onError

**Description**: subscribe to error event

**Arguments**:

-   [0] cb: (error: any) => void

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})

ws.onError((error) => {
    console.log('error is received', error)
})
```

**Order namespace**

### onOrder

**Description:** subscribe to order events

**Arguments:**

-   [0] cb: (data: OrderEventType) => void

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})

ws.order.onOrder((data) => {
    if (data.event === 'order_created') {
        // do something
    }
    if (data.event === 'order_invalid') {
        // do something
    }
})
```

### onOrderCreated

**Description:** subscribe to order_created events

**Arguments:**

-   [0] cb: (data: OrderCreatedEvent) => void

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})

ws.order.onOrderCreated((data) => {
    // do something
})
```

### onOrderInvalid

**Description:** subscribe to order_invalid events

**Arguments:**

-   [0] cb: (data: OrderInvalidEvent) => void

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})

ws.order.onOrderInvalid((data) => {
    // do something
})
```

### onOrderBalanceChange

**Description:** subscribe to order_balance_change events

**Arguments:**

-   [0] cb: (data: OrderBalanceChangeEvent) => void

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})

ws.order.onOrderBalanceChange((data) => {
    // do something
})
```

### onOrderAllowanceChange

**Description:** subscribe to order_allowance_change events

**Arguments:**

-   [0] cb: (data: OrderAllowanceChangeEvent) => void

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})

ws.order.onOrderAllowanceChange((data) => {
    // do something
})
```

### onOrderFilled

**Description:** subscribe to order_filled events

**Arguments:**

-   [0] cb: (data: OrderFilledEvent) => void

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})

ws.order.onOrderFilled((data) => {
    // do something
})
```

### onOrderFilledPartially

**Description:** subscribe to order_filled_partially events

**Arguments:**

-   [0] cb: (data: OrderFilledPartiallyEvent) => void

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})

ws.order.onOrderFilledPartially((data) => {
    // do something
})
```

### onOrderCancelled

**Description:** subscribe to order_cancelled events

**Arguments:**

-   [0] cb: (data: OrderCancelledEvent) => void

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})

ws.order.onOrderCancelled((data) => {
    // do something
})
```

**Rpc namespace**

### onPong

**Description:** subscribe to ping response

**Arguments:**

-   [0] cb: (data: string) => void

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})

ws.rpc.onPong((data) => {
    // do something
})
```

### ping

**Description:** ping healthcheck

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})

ws.rpc.ping()
```

### getAllowedMethods

**Description:** get the list of allowed methods

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})

ws.rpc.getAllowedMethods()
```

### onGetAllowedMethods

**Description:** subscribe to get allowed methods response

**Arguments:**

-   [0] cb: (data: RpcMethod[]) => void

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws',
})

ws.rpc.onGetAllowedMethods((data) => {
    // do something
})
```

### getActiveOrders

**Description:** get the list of active orders

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws'
})

ws.rpc.getActiveOrders()
```

### onGetActiveOrders

**Description:** subscribe to get active orders events

**Arguments:**

-   [0] cb: (data: PaginationOutput\<ActiveOrder\>) => void

**Example:**

```typescript
import {WebSocketApi, NetworkEnum} from '@1inch/cross-chain-sdk'

const ws = new WebSocketApi({
    url: 'wss://api.1inch.dev/fusion-plus/ws'
})

ws.rpc.onGetActiveOrders((data) => {
    // do something
})
```

## Types

### OrderEventType

```typescript
import {OrderType} from './types'

type Event<K extends string, T> = {event: K; data: T}

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

type OrderCreatedEvent = Event<
    'order_created',
    {
        orderHash: string
        signature: string
        order: LimitOrderV3Struct
        deadline: string
        auctionStartDate: string
        auctionEndDate: string
        remainingMakerAmount: string
    }
>

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

type OrderInvalidEvent = Event<
    EventType.OrderInvalid,
    {
        orderHash: string
    }
>

export type OrderCancelledEvent = Event<
    EventType.OrderCancelled,
    {
        orderHash: string
        remainingMakerAmount: string
    }
>

type OrderFilledEvent = Event<EventType.OrderFilled, {orderHash: string}>

type OrderFilledPartiallyEvent = Event<
    EventType.OrderFilledPartially,
    {orderHash: string; remainingMakerAmount: string}
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
```

### RpcMethod

```typescript
export enum RpcMethod {
    GetAllowedMethods = 'getAllowedMethods',
    Ping = 'ping',
    GetActiveOrders = 'getActiveOrders',
    GetSecrets = 'getSecrets'
}
```
