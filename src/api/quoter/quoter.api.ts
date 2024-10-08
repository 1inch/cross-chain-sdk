import {HttpProviderConnector} from '@1inch/fusion-sdk'
import {QuoterRequest} from './quoter.request'
import {QuoterApiConfig, QuoterResponse} from './types'
import {Quote} from './quote'
import {QuoterCustomPresetRequest} from './quoter-custom-preset.request'
import {concatQueryParams} from '../params'

export class QuoterApi {
    private static Version = 'v1.0'

    constructor(
        private readonly config: QuoterApiConfig,
        private readonly httpClient: HttpProviderConnector
    ) {}

    async getQuote(params: QuoterRequest): Promise<Quote> {
        const queryParams = concatQueryParams(params.build())
        const url = `${this.config.url}/${QuoterApi.Version}/quote/receive/${queryParams}`

        const res = await this.httpClient.get<QuoterResponse>(url)

        return new Quote(params, res)
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

        return new Quote(params, res)
    }
}
