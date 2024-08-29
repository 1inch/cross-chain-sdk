import {HttpProviderConnector} from '@1inch/fusion-sdk'
import {RelayerRequest} from './relayer.request'
import {RelayerApiConfig} from './types'

export class RelayerApi {
    private static Version = 'v1.0'

    constructor(
        private readonly config: RelayerApiConfig,
        private readonly httpClient: HttpProviderConnector
    ) {}

    submit(params: RelayerRequest): Promise<void> {
        const url = `${this.config.url}/${RelayerApi.Version}/submit`

        return this.httpClient.post(url, params)
    }

    submitBatch(params: RelayerRequest[]): Promise<void> {
        const url = `${this.config.url}/${RelayerApi.Version}/submit/many`

        return this.httpClient.post(url, params)
    }

    submitSecret(orderHash: string, secret: string): Promise<void> {
        const url = `${this.config.url}/${RelayerApi.Version}/submit/secret`

        return this.httpClient.post(url, {
            orderHash,
            secret
        })
    }
}
