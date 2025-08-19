import {ResolverCancellationConfig} from './resolver-cancellation-config.js'
import {SvmCrossChainOrder} from './svm-cross-chain-order.js'
import {HashLock} from '../../domains/hash-lock/index.js'
import {TimeLocks} from '../../domains/time-locks/index.js'
import {NetworkEnum, SupportedChain} from '../../chains.js'
import {AuctionDetails} from '../../domains/auction-details/index.js'
import {FixedLengthArray} from '../../type-utils.js'
import {BN} from '../../utils/numbers/bn.js'

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
    assetIsNative: boolean
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

export type OrderHashParams = Pick<
    SvmCrossChainOrder,
    | 'hashLock'
    | 'maker'
    | 'makerAsset'
    | 'makingAmount'
    | 'srcSafetyDeposit'
    | 'timeLocks'
    | 'deadline'
    | 'srcAssetIsNative'
    | 'takingAmount'
    | 'resolverCancellationConfig'
    | 'multipleFillsAllowed'
    | 'salt'
> &
    (
        | {
              auction: AuctionDetails
          }
        | {
              auctionHash: Buffer
          }
    )
