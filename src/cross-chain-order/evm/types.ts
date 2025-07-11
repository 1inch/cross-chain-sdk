import {AuctionWhitelistItem} from './fusion-order'
import {AuctionDetails} from '../../domains/auction-details'
import {AddressLike, EvmAddress} from '../../domains/addresses'
import {HashLock} from '../../domains/hash-lock'
import {TimeLocks} from '../../domains/time-locks'
import {EvmChain, SupportedChain} from '../../chains'

export type CrossChainOrderInfo = {
    /**
     * Source chain asset
     */
    makerAsset: EvmAddress
    /**
     * Destination chain asset
     */
    takerAsset: AddressLike
    /**
     * Source chain amount
     */
    makingAmount: bigint
    /**
     * Destination chain min amount
     */
    takingAmount: bigint
    maker: EvmAddress
    salt?: bigint
    /**
     * Destination chain receiver address
     *
     * If not set, then `maker` used
     */
    receiver?: AddressLike
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
    whitelist: AuctionWhitelistItem[]
    /**
     * Time from which order can be executed
     */
    resolvingStartTime?: bigint
}

export type EvmEscrowParams = {
    hashLock: HashLock
    srcChainId: EvmChain
    dstChainId: SupportedChain
    srcSafetyDeposit: bigint
    dstSafetyDeposit: bigint
    timeLocks: TimeLocks
}

export type OrderInfoData = {
    makerAsset: EvmAddress
    takerAsset: EvmAddress
    makingAmount: bigint
    takingAmount: bigint
    maker: EvmAddress
    salt?: bigint
    receiver?: AddressLike
}
