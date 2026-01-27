import {
    BlockchainProviderConnector,
    HttpProviderConnector,
    LimitOrderV4Struct
} from '@1inch/fusion-sdk'
import {
    ResolverCancellationConfig,
    SvmCrossChainOrder,
    EvmCrossChainOrder
} from '../cross-chain-order/index.js'
import {
    ApiVersion,
    CustomPreset,
    IntegratorFeeRequest,
    PaginationOutput,
    PresetEnum
} from '../api/index.js'
import {EvmChain, SupportedChain} from '../chains.js'
import {EvmAddress, HashLock, SolanaAddress} from '../domains/index.js'

export type CrossChainSDKConfigParams = {
    url: string
    authKey?: string
    blockchainProvider?: BlockchainProviderConnector
    httpProvider?: HttpProviderConnector
}

export type QuoteParams<
    SrcChain extends SupportedChain = SupportedChain,
    DstChain extends SupportedChain = SupportedChain
> = {
    srcChainId: SrcChain
    dstChainId: DstChain
    srcTokenAddress: string
    dstTokenAddress: string
    amount: string
    walletAddress: string
    enableEstimate?: boolean
    permit?: string
    integratorFee?: IntegratorFeeRequest
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
    order: EvmCrossChainOrder | SvmCrossChainOrder
    hash: string
    quoteId: string
}

export type OrderCancellationData =
    | PaginationOutput<SvmOrderCancellationData>
    | PaginationOutput<EvmOrderCancellationData>

export type SvmOrderCancellationData = {
    orderHash: Buffer
    maker: SolanaAddress
    token: SolanaAddress
    cancellationConfig: ResolverCancellationConfig
    isAssetNative: boolean
}

export type EvmOrderCancellationData<
    SrcChain extends EvmChain = EvmChain,
    DstChain extends SupportedChain = SupportedChain
> = {
    orderHash: string
    maker: EvmAddress
    srcChainId: SrcChain
    dstChainId: DstChain
    order: LimitOrderV4Struct
    extension: string
    remainingMakerAmount: bigint
    version: ApiVersion
}
