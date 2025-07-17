import {ResolverCancellationConfig} from './resolver-cancellation-config'
import {HashLock} from '../../domains/hash-lock'
import {TimeLocks} from '../../domains/time-locks'
import {NetworkEnum, SupportedChain} from '../../chains'
import {AuctionDetails} from '../../domains/auction-details'

export type SolanaEscrowParams = {
    hashLock: HashLock
    srcChainId: NetworkEnum.SOLANA
    dstChainId: SupportedChain
    srcSafetyDeposit: bigint
    dstSafetyDeposit: bigint
    timeLocks: TimeLocks
}

export type Details = {
    auction: AuctionDetails
}

export type Extra = {
    srcAssetIsNative?: boolean
    /**
     * Order will expire in `orderExpirationDelay` after auction ends
     * Default 12s
     */
    orderExpirationDelay?: bigint
    resolverCancellationConfig?: ResolverCancellationConfig
    source?: string
    allowMultipleFills?: boolean
    // random value in interval [0, UINT_32_MAX]
    salt?: bigint
}
