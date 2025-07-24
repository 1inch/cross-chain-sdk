import {HttpProviderConnector} from '@1inch/fusion-sdk'
import {RelayerRequestEvm, RelayerRequestSvm} from './relayer.request'
import {RelayerApiConfig} from './types'

export class RelayerApi {
    private static Version = 'v1.1'

    constructor(
        private readonly config: RelayerApiConfig,
        private readonly httpClient: HttpProviderConnector
    ) {}

    submit(params: RelayerRequestEvm | RelayerRequestSvm): Promise<void> {
        const url = `${this.config.url}/${RelayerApi.Version}/submit`

        return this.httpClient.post(url, params.build())
    }

    submitBatch(
        params: RelayerRequestEvm[] | RelayerRequestSvm[]
    ): Promise<void> {
        const url = `${this.config.url}/${RelayerApi.Version}/submit/many`

        return this.httpClient.post(
            url,
            params.map((p) => p.build())
        )
    }

    submitSecret(orderHash: string, secret: string): Promise<void> {
        const url = `${this.config.url}/${RelayerApi.Version}/submit/secret`

        return this.httpClient.post(url, {
            orderHash,
            secret
        })
    }
}
