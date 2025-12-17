import {LimitOrderV4Struct} from '@1inch/fusion-sdk'
import {AuctionPoint} from '../../domains/index.js'
import {PaginationOutput} from '../types.js'
import {PaginationParams} from '../pagination.js'
import {EvmChain, SolanaChain, SupportedChain} from '../../chains.js'
import {SolanaOrderJSON} from '../../cross-chain-order/index.js'

export type OrdersApiConfig = {
    url: string
    authKey?: string
}

export type ActiveOrdersRequestParams = PaginationParams & {
    srcChainId?: SupportedChain
    dstChainId?: SupportedChain
}

export type FillInfo = {
    txHash: string
}

export enum ApiVersion {
    V1_1 = 'v1.1',
    V1_2 = 'v1.2'
}

export type ActiveOrder = {
    quoteId: string
    orderHash: string
    deadline: string
    auctionStartDate: string
    auctionEndDate: string
    dstChainId: SupportedChain
    remainingMakerAmount: string
    secretHashes?: string[]
    fills: FillInfo[]
    version: ApiVersion
} & (
    | {
          srcChainId: EvmChain
          order: LimitOrderV4Struct
          isMakerContract: boolean
          signature: string
          makerBalance: string
          makerAllowance: string
          extension: string
      }
    | {
          srcChainId: SolanaChain
          order: SolanaOrderJSON
      }
)

export type ActiveOrdersResponse = PaginationOutput<ActiveOrder>

export type OrderStatusParams = {
    orderHash: string
}

export enum ValidationStatus {
    Valid = 'valid',
    OrderPredicateReturnedFalse = 'order-predicate-returned-false',
    NotEnoughBalance = 'not-enough-balance',
    NotEnoughAllowance = 'not-enough-allowance',
    InvalidPermitSignature = 'invalid-permit-signature',
    InvalidPermitSpender = 'invalid-permit-spender',
    InvalidPermitSigner = 'invalid-permit-signer',
    InvalidSignature = 'invalid-signature',
    FailedToParsePermitDetails = 'failed-to-parse-permit-details',
    UnknownPermitVersion = 'unknown-permit-version',
    WrongEpochManagerAndBitInvalidator = 'wrong-epoch-manager-and-bit-invalidator',
    FailedToDecodeRemainingMakerAmount = 'failed-to-decode-remaining',
    UnknownFailure = 'unknown-failure'
}

export enum FillStatus {
    Pending = 'pending',
    Executed = 'executed',
    Refunding = 'refunding',
    Refunded = 'refunded'
}

export enum OrderStatus {
    Pending = 'pending',
    Executed = 'executed',
    Expired = 'expired',
    Cancelled = 'cancelled',
    Refunding = 'refunding',
    Refunded = 'refunded'
}

export type Fill = {
    status: FillStatus
    txHash: string
    filledMakerAmount: string
    filledAuctionTakerAmount: string
    escrowEvents: EscrowEventData[]
}

export enum EscrowEventSide {
    Src = 'src',
    Dst = 'dst'
}

export enum EscrowEventAction {
    SrcEscrowCreated = 'src_escrow_created',
    DstEscrowCreated = 'dst_escrow_created',
    Withdrawn = 'withdrawn',
    FundsRescued = 'funds_rescued',
    EscrowCancelled = 'escrow_cancelled'
}

export type EscrowEventData = {
    transactionHash: string
    escrow: string
    side: EscrowEventSide
    action: EscrowEventAction
    /**
     * Unix timestamp in ms
     */
    blockTimestamp: number
}

export type OrderStatusResponse = {
    orderHash: string
    status: OrderStatus
    validation: ValidationStatus
    points: AuctionPoint[]
    approximateTakingAmount: string
    positiveSurplus: string
    fills: Fill[]
    /**
     * unix timestamp in sec
     */
    auctionStartDate: number
    /**
     * in sec
     */
    auctionDuration: number
    initialRateBump: number

    /**
     * unix timestamp in ms
     */
    createdAt: number
    srcTokenPriceUsd: string | null
    dstTokenPriceUsd: string | null
    cancelTx: string | null
    dstChainId: SupportedChain
    cancelable: boolean
    takerAsset: string
    /**
     * hex encoded with 0x prefix
     */
    timeLocks: string
} & (
    | {srcChainId: EvmChain; order: LimitOrderV4Struct; extension: string}
    | {srcChainId: SolanaChain; order: SolanaOrderJSON}
)

export type OrdersByMakerParams = {
    address: string
    srcChain?: SupportedChain
    dstChain?: SupportedChain
    srcToken?: string
    dstToken?: string
    withToken?: string
    timestampFrom?: number
    timestampTo?: number
} & PaginationParams

export type OrderFillsByMakerOutput = {
    orderHash: string
    validation: ValidationStatus
    status: OrderStatus
    makerAsset: string
    takerAsset: string
    makerAmount: string
    minTakerAmount: string
    approximateTakingAmount: string
    cancelTx: string | null
    fills: Fill[]
    points: AuctionPoint[] | null
    auctionStartDate: number
    auctionDuration: number
    initialRateBump: number
    isNativeCurrency: boolean
    srcChainId: SupportedChain
    dstChainId: SupportedChain
    createdAt: string
    cancelable: boolean
}

export type OrdersByMakerResponse = PaginationOutput<OrderFillsByMakerOutput>

export type ReadyToAcceptSecretFill = {
    idx: number
    srcEscrowDeployTxHash: string
    dstEscrowDeployTxHash: string
}

export type ReadyToAcceptSecretFills = {
    fills: ReadyToAcceptSecretFill[]
}

export enum OrderType {
    SingleFill = 'SingleFill',
    MultipleFills = 'MultipleFills'
}

export type ChainImmutables = {
    orderHash: string
    hashlock: string
    maker: string
    taker: string
    token: string
    amount: string
    safetyDeposit: string
    timelocks: string
}

export type PublicSecret = {
    idx: number
    secret: string
    srcImmutables: ChainImmutables
    dstImmutables: ChainImmutables
}

export type PublishedSecretsResponse = {
    orderType: OrderType
    secrets: PublicSecret[]

    // empty for OrderType.SingleFill
    secretHashes?: string[]
}

export type SvmCancellableOrderData = {
    orderHash: string
    txSignature: string
    maker: string
    order: {
        orderInfo: {
            srcToken: string
            dstToken: string
            maker: string
            srcAmount: string
            minDstAmount: string
            receiver: string
        }
        extra: {
            resolverCancellationConfig: {
                maxCancellationPremium: string
                cancellationAuctionDuration: number
            }
            srcAssetIsNative: boolean
        }
    }
}

export type EvmCancellableOrderData = {
    orderHash: string
    maker: string
    srcChainId: number
    dstChainId: number
    order: LimitOrderV4Struct
    extension: string
    remainingMakerAmount: string
}

export type CancellableOrdersResponse =
    | PaginationOutput<SvmCancellableOrderData>
    | PaginationOutput<EvmCancellableOrderData>

export enum PublicAction {
    Withdraw = 'withdraw',
    Cancel = 'cancel'
}

export type ReadyToExecutePublicAction = {
    side: EscrowEventSide
    action: PublicAction
    immutables: ChainImmutables
    chainId: SupportedChain
    escrow: string
    secret?: string
    /**
     * Exists only for solana
     */
    srcAssetIsNative?: boolean
}

export type ReadyToExecutePublicActions = {
    actions: ReadyToExecutePublicAction[]
}
