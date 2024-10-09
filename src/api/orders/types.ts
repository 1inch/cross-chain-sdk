import {LimitOrderV4Struct} from '@1inch/fusion-sdk'
import {PaginationOutput} from '../types'
import {AuctionPoint} from '../quoter'
import {PaginationParams} from '../pagination'
import {SupportedChain} from '../../chains'

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

export type ActiveOrder = {
    quoteId: string
    orderHash: string
    signature: string
    deadline: string
    auctionStartDate: string
    auctionEndDate: string
    remainingMakerAmount: string
    makerBalance: string
    makerAllowance: string
    order: LimitOrderV4Struct
    extension: string
    srcChainId: SupportedChain
    dstChainId: SupportedChain
    isMakerContract: boolean
    secretHashes?: string[]
    fills: FillInfo[]
}

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
    blockTimestamp: number
}

export type OrderStatusResponse = {
    status: OrderStatus
    order: LimitOrderV4Struct
    extension: string
    points: AuctionPoint[] | null
    cancelTx: string | null
    fills: Fill[]
    createdAt: string
    auctionStartDate: number
    auctionDuration: number
    initialRateBump: number
    isNativeCurrency: boolean
    fromTokenToUsdPrice: string
    toTokenToUsdPrice: string
}

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

export enum PublicAction {
    Withdraw = 'withdraw',
    Cancel = 'cancel'
}

export type ReadyToExecutePublicAction = {
    action: PublicAction
    immutables: ChainImmutables
    chainId: SupportedChain
    escrow: string
    secret?: string
}

export type ReadyToExecutePublicActions = {
    actions: ReadyToExecutePublicAction[]
}
