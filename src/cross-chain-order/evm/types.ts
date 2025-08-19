import {AuctionDetails} from '../../domains/auction-details/index.js'
import {AddressLike, EvmAddress} from '../../domains/addresses/index.js'
import {HashLock} from '../../domains/hash-lock/index.js'
import {TimeLocks} from '../../domains/time-locks/index.js'
import {EvmChain, SupportedChain} from '../../chains.js'

export type EvmCrossChainOrderInfo = {
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

export type EvmExtra = {
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

export type AuctionWhitelistItem = {
    address: EvmAddress
    allowFrom: bigint
}

export type EvmDetails = {
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
    receiver?: EvmAddress
}
