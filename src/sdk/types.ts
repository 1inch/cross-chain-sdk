import {
    BlockchainProviderConnector,
    HttpProviderConnector,
    LimitOrderV4Struct,
    NetworkEnum
} from '@1inch/fusion-sdk'
import {CustomPreset, PresetEnum} from '../api'
import {CrossChainOrder} from '../cross-chain-order'

export type CrossChainSDKConfigParams = {
    url: string
    authKey?: string
    blockchainProvider?: BlockchainProviderConnector
    httpProvider?: HttpProviderConnector
}

export type QuoteParams = {
    fromTokenAddress: string
    toTokenAddress: string
    amount: string
    walletAddress?: string
    enableEstimate?: boolean
    permit?: string
    takingFeeBps?: number // 100 == 1%
    source?: string
    isPermit2?: boolean
}

export type QuoteCustomPresetParams = {
    customPreset: CustomPreset
}

export type OrderParams = {
    fromTokenAddress: string
    toTokenAddress: string
    amount: string
    walletAddress: string
    permit?: string // without the first 20 bytes of token address
    receiver?: string // by default: walletAddress (makerAddress)
    preset?: PresetEnum // by default: recommended preset
    /**
     * Unique for `walletAddress` can be serial or random generated
     *
     * @see randBigInt
     */
    nonce?: bigint
    fee?: TakingFeeInfo
    source?: string
    isPermit2?: boolean
    customPreset?: CustomPreset
    /**
     * true by default
     */
    allowPartialFills?: boolean

    /**
     * true by default
     */
    allowMultipleFills?: boolean

    srcChainId: NetworkEnum
    dstChainId: NetworkEnum
}

export type TakingFeeInfo = {
    takingFeeBps: number // 100 == 1%
    takingFeeReceiver: string
}

export type OrderInfo = {
    order: LimitOrderV4Struct
    signature: string
    quoteId: string
    orderHash: string
    extension: string
}

export type PreparedOrder = {
    order: CrossChainOrder
    hash: string
    quoteId: string
}
