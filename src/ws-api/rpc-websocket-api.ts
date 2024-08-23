import {
    OnGetActiveOrdersCb,
    OnGetAllowedMethodsCb,
    OnPongCb
} from '@1inch/fusion-sdk'
import {RpcEventType} from './types'
import {PaginationParams, PaginationRequest} from '../api/pagination'
import {WsProviderConnector} from '../connector/ws'

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
