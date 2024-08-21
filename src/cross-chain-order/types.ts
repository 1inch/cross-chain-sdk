import {
    Address,
    AuctionDetails,
    AuctionWhitelistItem,
    IntegratorFee
} from '@1inch/fusion-sdk'
import {HashLock} from './hash-lock'
import {TimeLocks} from './time-locks'
import {SupportedChain} from '../chains'

export type CrossChainOrderInfo = {
    /**
     * Source chain asset
     */
    makerAsset: Address
    /**
     * Destination chain asset
     */
    takerAsset: Address
    /**
     * Source chain amount
     */
    makingAmount: bigint
    /**
     * Destination chain min amount
     */
    takingAmount: bigint
    maker: Address
    salt?: bigint
    /**
     * Destination chain receiver address
     *
     * If not set, then `maker` used
     */
    receiver?: Address
}

export type Extra = {
    /**
     * Max size is 40bit
     */
    nonce?: bigint
    permit?: string
    /**
     * Order will expire in `orderExpirationDelay` after auction ends
     * Default 12s
     */
    orderExpirationDelay?: bigint
    enablePermit2?: boolean
    source?: string
    allowMultipleFills?: boolean
    allowPartialFills?: boolean
}

export type Details = {
    auction: AuctionDetails
    fees?: {
        integratorFee?: IntegratorFee
        bankFee?: bigint
    }
    whitelist: AuctionWhitelistItem[]
    /**
     * Time from which order can be executed
     */
    resolvingStartTime?: bigint
}

export type EscrowParams = {
    hashLock: HashLock
    srcChainId: SupportedChain
    dstChainId: SupportedChain
    srcSafetyDeposit: bigint
    dstSafetyDeposit: bigint
    timeLocks: TimeLocks
}
