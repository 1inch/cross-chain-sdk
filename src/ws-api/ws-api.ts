import {
    AnyFunction,
    AnyFunctionWithThis,
    OnMessageCb,
    WebsocketClient,
    WsApiConfigWithNetwork,
    WsProviderConnector,
    WsApiConfig
} from '@1inch/fusion-sdk'
import {ActiveOrdersWebSocketApi} from './active-websocket-orders-api'
import {RpcWebsocketApi} from './rpc-websocket-api'
import {WebSocketEvent} from './types'
import {castUrl} from './url'

export class WebSocketApi {
    private static Version = 'v1.0'

    public readonly rpc: RpcWebsocketApi

    public readonly order: ActiveOrdersWebSocketApi

    public readonly provider: WsProviderConnector

    constructor(configOrProvider: WsApiConfig | WsProviderConnector) {
        if (instanceOfWsApiConfig(configOrProvider)) {
            const url = castUrl(configOrProvider.url)
            const configWithUrl = {
                ...configOrProvider,
                url: `${url}/${WebSocketApi.Version}`
            }
            const provider = new WebsocketClient(configWithUrl)

            this.provider = provider
            this.rpc = new RpcWebsocketApi(provider)
            this.order = new ActiveOrdersWebSocketApi(provider)

            return
        }

        this.provider = configOrProvider
        this.rpc = new RpcWebsocketApi(configOrProvider)
        this.order = new ActiveOrdersWebSocketApi(configOrProvider)
    }

    static new(
        configOrProvider: WsApiConfigWithNetwork | WsProviderConnector
    ): WebSocketApi {
        return new WebSocketApi(configOrProvider)
    }

    init(): void {
        this.provider.init()
    }

    on(event: WebSocketEvent, cb: AnyFunctionWithThis): void {
        this.provider.on(event, cb)
    }

    off(event: WebSocketEvent, cb: AnyFunctionWithThis): void {
        this.provider.off(event, cb)
    }

    onOpen(cb: AnyFunctionWithThis): void {
        this.provider.onOpen(cb)
    }

    send<T>(message: T): void {
        this.provider.send(message)
    }

    close(): void {
        this.provider.close()
    }

    onMessage(cb: OnMessageCb): void {
        this.provider.onMessage(cb)
    }

    onClose(cb: AnyFunction): void {
        this.provider.onClose(cb)
    }

    onError(cb: AnyFunction): void {
        this.provider.onError(cb)
    }
}

function instanceOfWsApiConfig(
    val: WsApiConfig | WsProviderConnector
): val is WsApiConfig {
    return !('send' in val)
}
