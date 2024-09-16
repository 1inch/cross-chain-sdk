import {
    BlockchainProviderConnector,
    HttpProviderConnector,
    LimitOrderV4Struct
} from '@1inch/fusion-sdk'
import {CustomPreset, PresetEnum} from '../api'
import {CrossChainOrder, HashLock} from '../cross-chain-order'
import {SupportedChain} from '../chains'

export type CrossChainSDKConfigParams = {
    url: string
    authKey?: string
    blockchainProvider?: BlockchainProviderConnector
    httpProvider?: HttpProviderConnector
}

export type QuoteParams = {
    srcChainId: SupportedChain
    dstChainId: SupportedChain
    srcTokenAddress: string
    dstTokenAddress: string
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
    walletAddress: string
    hashLock: HashLock
    secretHashes: string[]
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
