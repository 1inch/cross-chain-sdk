import {HttpProviderConnector} from '@1inch/fusion-sdk'
import {QuoterRequest} from './quoter.request.js'
import {QuoterApiConfig, QuoterResponse} from './types.js'
import {Quote} from './quote/index.js'
import {QuoterCustomPresetRequest} from './quoter-custom-preset.request.js'
import {concatQueryParams} from '../params.js'

export class QuoterApi {
    private static readonly Version = 'v1.2'

    constructor(
        private readonly config: QuoterApiConfig,
        private readonly httpClient: HttpProviderConnector
    ) {}

    async getQuote(params: QuoterRequest): Promise<Quote> {
        const queryParams = concatQueryParams(params.build())
        const url = `${this.config.url}/${QuoterApi.Version}/quote/receive/${queryParams}`

        const res = await this.httpClient.get<QuoterResponse>(url)

        if (params.isEvmRequest()) {
            return Quote.fromEVMQuote(params, res)
        }

        if (params.isSolanaRequest()) {
            return Quote.fromSolanaQuote(params, res)
        }

        throw new Error('unknown chain request')
    }

    async getQuoteWithCustomPreset(
        params: QuoterRequest,
        body: QuoterCustomPresetRequest
    ): Promise<Quote> {
        const bodyErr = body.validate()

        if (bodyErr) {
            throw new Error(bodyErr)
        }

        const queryParams = concatQueryParams(params.build())
        const bodyParams = body.build()
        const url = `${this.config.url}/${QuoterApi.Version}/quote/receive/${queryParams}`

        const res = await this.httpClient.post<QuoterResponse>(url, bodyParams)

        if (params.isEvmRequest()) {
            return Quote.fromEVMQuote(params, res)
        }

        if (params.isSolanaRequest()) {
            return Quote.fromSolanaQuote(params, res)
        }

        throw new Error('unknown chain request')
    }
}
