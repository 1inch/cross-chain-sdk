import {Bps} from '@1inch/limit-order-sdk'
import {AuctionPoint, EvmAddress} from '../../domains/index.js'
import {SupportedChain} from '../../chains.js'

export type QuoterRequestParams<
    SrcChain extends SupportedChain = SupportedChain,
    DstChain extends SupportedChain = SupportedChain
> = {
    srcChain: SrcChain
    dstChain: DstChain
    srcTokenAddress: string
    dstTokenAddress: string
    amount: string
    walletAddress: string
    enableEstimate?: boolean
    permit?: string
    fee?: number
    source?: string
    isPermit2?: boolean
}

export type QuoterCustomPresetRequestParams = {
    customPreset: CustomPreset
}

export type QuoterApiConfig = {
    url: string
    authKey?: string
}

export type ProtocolFeeParams = {
    /**
     * protocol address
     */
    receiver: EvmAddress
    bps: Bps
    whitelistDiscountPercent: Bps
}

export type ProtocolFeeParamsRaw = {
    receiver: string
    bps: number
    whitelistDiscountPercent: number
}

export type IntegratorFeeParams = {
    /**
     * Address which will receive `share` of `value` fee, other part will be sent to protocol
     */
    receiver: EvmAddress
    /**
     * How much to charge
     */
    bps: Bps
    /**
     * Integrator will receive only `share` part from charged fee
     */
    sharePercent: Bps
}

export type IntegratorFeeParamsRaw = {
    receiver: string
    bps: number
    sharePercent: number
}

export type QuoterResponse = {
    quoteId: string | null
    srcTokenAmount: string
    dstTokenAmount: string
    presets: QuoterPresets
    srcEscrowFactory: string
    dstEscrowFactory: string
    recommendedPreset: PresetEnum
    prices: Cost
    volume: Cost
    whitelist: string[]
    timeLocks: TimeLocksRaw
    srcSafetyDeposit: string
    dstSafetyDeposit: string
    autoK: number
    nativeOrderFactoryAddress?: string
    nativeOrderImplAddress?: string
    protocolFee?: ProtocolFeeParamsRaw
    integratorFee?: IntegratorFeeParamsRaw
}

export type TimeLocksRaw = {
    srcWithdrawal: number
    srcPublicWithdrawal: number
    srcCancellation: number
    srcPublicCancellation: number
    dstWithdrawal: number
    dstPublicWithdrawal: number
    dstCancellation: number
}

export type QuoterPresets = {
    fast: PresetData
    medium: PresetData
    slow: PresetData
    custom?: PresetData
}

export type PresetData = {
    auctionDuration: number
    startAuctionIn: number
    initialRateBump: number
    auctionStartAmount: string
    startAmount: string
    auctionEndAmount: string
    costInDstToken: string
    points: AuctionPoint[]
    allowPartialFills: boolean
    allowMultipleFills: boolean
    gasCost: {
        gasBumpEstimate: number
        gasPriceEstimate: string
    }
    exclusiveResolver: string | null
    secretsCount: number
}

export type Cost = {
    usd: {
        srcToken: string
        dstToken: string
    }
}

export enum PresetEnum {
    fast = 'fast',
    medium = 'medium',
    slow = 'slow',
    custom = 'custom'
}

export type CustomPreset = {
    auctionDuration: number
    auctionStartAmount: string
    auctionEndAmount: string
    points?: CustomPresetPoint[]
}

export type CustomPresetPoint = {toTokenAmount: string; delay: number}
