import {BN} from '@coral-xyz/anchor'
import {ResolverCancellationConfig} from './resolver-cancellation-config'
import {OrderInfoData} from './svm-cross-chain-order'
import {HashLock} from '../../domains/hash-lock'
import {TimeLocks} from '../../domains/time-locks'
import {NetworkEnum, SupportedChain} from '../../chains'
import {AuctionDetails} from '../../domains/auction-details'
import {FixedLengthArray} from '../../type-utils'

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

export type CreateOrderData = {
    hashlock: FixedLengthArray<number, 32>
    amount: BN
    safetyDeposit: BN
    timelocks: FixedLengthArray<BN, 4>
    expirationTime: number
    assetsIsNative: boolean
    dstAmount: FixedLengthArray<BN, 4>
    dutchAuctionDataHash: FixedLengthArray<number, 32>
    maxCancellationPremium: BN
    cancellationAuctionDuration: number
    allowMultipleFills: boolean
    salt: BN
    dstChainParams: {
        chainId: number
        makerAddress: FixedLengthArray<number, 4>
        token: FixedLengthArray<number, 4>
        safetyDeposit: BN
    }
}

export type ParsedCreateInstructionData = {
    orderInfo: OrderInfoData
    escrowParams: SolanaEscrowParams
    extraDetails: Omit<SolanaExtra, 'orderExpirationDelay'>
    expirationTime: bigint
    dutchAuctionDataHash: string
}
