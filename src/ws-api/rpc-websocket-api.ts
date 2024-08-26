import {
    OnGetActiveOrdersCb,
    OnGetAllowedMethodsCb,
    OnPongCb,
    WsProviderConnector
} from '@1inch/fusion-sdk'
import {OnGetSecretsCb, RpcEventType, RpcMethod} from './types'
import {PaginationParams, PaginationRequest} from '../api/pagination'

export class RpcWebsocketApi {
    public readonly provider: WsProviderConnector

    constructor(provider: WsProviderConnector) {
        this.provider = provider
    }

    onPong(cb: OnPongCb): void {
        this.provider.onMessage((data: RpcEventType) => {
            if (data.method === RpcMethod.Ping) {
                cb(data.result)
            }
        })
    }

    ping(): void {
        this.provider.send({method: RpcMethod.Ping})
    }

    getActiveOrders({limit, page}: PaginationParams = {}): void {
        const paginationRequest = new PaginationRequest(page, limit)

        this.provider.send({
            method: RpcMethod.GetActiveOrders,
            param: paginationRequest
        })
    }

    onGetActiveOrders(cb: OnGetActiveOrdersCb): void {
        this.provider.onMessage((data: RpcEventType) => {
            if (data.method === RpcMethod.GetActiveOrders) {
                cb(data.result)
            }
        })
    }

    getSecrets({limit, page}: PaginationParams = {}): void {
        const paginationRequest = new PaginationRequest(page, limit)

        this.provider.send({
            method: RpcMethod.GetSecrets,
            param: paginationRequest
        })
    }

    onGetSecrets(cb: OnGetSecretsCb): void {
        this.provider.onMessage((data: RpcEventType) => {
            if (data.method === RpcMethod.GetSecrets) {
                cb(data.result)
            }
        })
    }

    getAllowedMethods(): void {
        this.provider.send({method: RpcMethod.GetAllowedMethods})
    }

    onGetAllowedMethods(cb: OnGetAllowedMethodsCb): void {
        this.provider.onMessage((data: RpcEventType) => {
            if (data.method === RpcMethod.GetAllowedMethods) {
                cb(data.result)
            }
        })
    }
}
