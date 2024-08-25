import {
    OnGetActiveOrdersCb,
    OnGetAllowedMethodsCb,
    OnPongCb,
    WsProviderConnector
} from '@1inch/fusion-sdk'
import {OnGetSecretsCb, RpcEventType} from './types'
import {PaginationParams, PaginationRequest} from '../api/pagination'

export class RpcWebsocketApi {
    public readonly provider: WsProviderConnector

    constructor(provider: WsProviderConnector) {
        this.provider = provider
    }

    onPong(cb: OnPongCb): void {
        this.provider.onMessage((data: RpcEventType) => {
            if (data.method === 'ping') {
                cb(data.result)
            }
        })
    }

    ping(): void {
        this.provider.send({method: 'ping'})
    }

    getActiveOrders({limit, page}: PaginationParams = {}): void {
        const paginationRequest = new PaginationRequest(page, limit)

        this.provider.send({
            method: 'getActiveOrders',
            param: paginationRequest
        })
    }

    onGetActiveOrders(cb: OnGetActiveOrdersCb): void {
        this.provider.onMessage((data: RpcEventType) => {
            if (data.method === 'getActiveOrders') {
                cb(data.result)
            }
        })
    }

    getSecrets({limit, page}: PaginationParams = {}): void {
        const paginationRequest = new PaginationRequest(page, limit)

        this.provider.send({
            method: 'getSecrets',
            param: paginationRequest
        })
    }

    onGetSecrets(cb: OnGetSecretsCb): void {
        this.provider.onMessage((data: RpcEventType) => {
            if (data.method === 'getSecrets') {
                cb(data.result)
            }
        })
    }

    getAllowedMethods(): void {
        this.provider.send({method: 'getAllowedMethods'})
    }

    onGetAllowedMethods(cb: OnGetAllowedMethodsCb): void {
        this.provider.onMessage((data: RpcEventType) => {
            if (data.method === 'getAllowedMethods') {
                cb(data.result)
            }
        })
    }
}
