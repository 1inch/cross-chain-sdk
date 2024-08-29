import {LimitOrderV4Struct} from '@1inch/fusion-sdk'
import {SupportedChain} from '../../chains'

export type RelayerRequestParams = {
    srcChainId: SupportedChain
    order: LimitOrderV4Struct
    signature: string
    quoteId: string
    extension: string
    secretHashes?: string[]
}

export type RelayerApiConfig = {
    url: string
    authKey?: string
}
