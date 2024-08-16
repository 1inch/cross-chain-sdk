import {LimitOrderV4Struct} from '@1inch/fusion-sdk'

export type RelayerRequestParams = {
    order: LimitOrderV4Struct
    signature: string
    quoteId: string
    extension: string
}

export type RelayerApiConfig = {
    url: string
    authKey?: string
}
