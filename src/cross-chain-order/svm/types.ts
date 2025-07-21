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

export type SolanaDetails = {
    auction: AuctionDetails
}

export type SolanaExtra = {
    srcAssetIsNative?: boolean
    /**
     * Order will expire in `orderExpirationDelay` after auction ends
     * Default 12s
     */
    orderExpirationDelay?: bigint
    resolverCancellationConfig?: ResolverCancellationConfig
    /**
     * Can be omitted for salt > UINT_32_MAX
     */
    source?: string
    allowMultipleFills?: boolean
    // random value in interval [0, UINT_32_MAX]
    // If salt > UINT_32_MAX, then source won't be injected to it
    salt?: bigint
}
