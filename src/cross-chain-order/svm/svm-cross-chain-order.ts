import {AuctionCalculator, AuctionDetails} from '@1inch/fusion-sdk'
import {UINT_64_MAX} from '@1inch/byte-utils'
import assert from 'assert'
import {ResolverCancellationConfig} from './resolver-cancellation-config'
import {SolanaAddress} from '../../domains/addresses'
import {NetworkEnum} from '../../chains'
import {HashLock} from '../../domains/hash-lock'
import {TimeLocks} from '../../domains/time-locks'
import {BaseOrder} from '../base-order'
import {assertUInteger} from '../../utils'

export type SolanaOrderJSON = {
    order_hash: string // 32bytes hex
    hashlock: string // 32bytes hex
    creator: string // base58 address
    token: string // base58 address
    amount: string // u64
    remaining_amount: string // u64
    parts_amount: string // u64
    safety_deposit: string // u64
    finality_duration: number // u32
    withdrawal_duration: number // u32
    public_withdrawal_duration: number // u32
    cancellation_duration: number // u32
    rescue_start: number // u32
    expiration_time: number // u32
    asset_is_native: boolean
    dst_amount: string // u256
    dutch_auction_data_hash: string
    max_cancellation_premium: string // u64
    cancellation_auction_duration: number // u32
    allow_multiple_fills: boolean
}

export class SvmCrossChainOrder extends BaseOrder<
    SolanaAddress,
    SolanaOrderJSON
> {
    private static DefaultExtra = {
        orderExpirationDelay: 12n,
        resolverCancellationConfig: ResolverCancellationConfig.ALMOST_ZERO // to enable cancellation by resolver
    }

    private constructor(
        orderInfo: OrderInfoData,
        auctionDetails: AuctionDetails,
        extra: {
            srcAssetIsNative: boolean
            dstAssetIsNative: boolean
            /**
             * Order will expire in `orderExpirationDelay` after auction ends
             * Default 12s
             */
            orderExpirationDelay?: bigint
            resolverCancellationConfig?: ResolverCancellationConfig
        }
    ) {
        assert(
            !orderInfo.dstMint.equal(orderInfo.srcMint),
            'tokens must be different'
        )

        const orderExpirationDelay =
            extra.orderExpirationDelay ??
            SvmCrossChainOrder.DefaultExtra.orderExpirationDelay

        const deadline =
            auctionDetails.startTime +
            auctionDetails.duration +
            orderExpirationDelay

        assertUInteger(orderExpirationDelay)
        assertUInteger(deadline)
        assertUInteger(orderInfo.id)
        assertUInteger(orderInfo.srcAmount, UINT_64_MAX)
        assertUInteger(orderInfo.estimatedDstAmount, UINT_64_MAX)
        assertUInteger(orderInfo.minDstAmount, UINT_64_MAX)

        const resolverCancellationConfig =
            extra.resolverCancellationConfig ||
            SvmCrossChainOrder.DefaultExtra.resolverCancellationConfig

        this.orderConfig = {
            ...orderInfo,
            dutchAuctionData: auctionDetails,
            srcAssetIsNative: extra.srcAssetIsNative,
            dstAssetIsNative: extra.dstAssetIsNative,
            expirationTime: deadline,
            resolverCancellationConfig: resolverCancellationConfig
        }
    }

    public get hashLock(): HashLock {
        throw new Error('Method not implemented.')
    }

    public get timeLocks(): TimeLocks {
        throw new Error('Method not implemented.')
    }

    public get srcSafetyDeposit(): bigint {
        throw new Error('Method not implemented.')
    }

    public get dstChainId(): NetworkEnum {
        throw new Error('Method not implemented.')
    }

    public get maker(): SolanaAddress {
        throw new Error('Method not implemented.')
    }

    public get takerAsset(): SolanaAddress {
        throw new Error('Method not implemented.')
    }

    public get makerAsset(): SolanaAddress {
        throw new Error('Method not implemented.')
    }

    public get takingAmount(): bigint {
        throw new Error('Method not implemented.')
    }

    public get makingAmount(): bigint {
        throw new Error('Method not implemented.')
    }

    public get receiver(): SolanaAddress {
        throw new Error('Method not implemented.')
    }

    public get deadline(): bigint {
        throw new Error('Method not implemented.')
    }

    public get auctionStartTime(): bigint {
        throw new Error('Method not implemented.')
    }

    public get auctionEndTime(): bigint {
        throw new Error('Method not implemented.')
    }

    public get nonce(): bigint {
        throw new Error('Method not implemented.')
    }

    public get partialFillAllowed(): boolean {
        throw new Error('Method not implemented.')
    }

    public get multipleFillsAllowed(): boolean {
        throw new Error('Method not implemented.')
    }

    public toJSON(): SolanaOrderJSON {
        throw new Error('Method not implemented.')
    }

    public getOrderHash(_srcChainId: number): string {
        throw new Error('Method not implemented.')
    }

    public getCalculator(): AuctionCalculator {
        throw new Error('Method not implemented.')
    }

    public calcTakingAmount(
        makingAmount: bigint,
        time: bigint,
        _blockBaseFee?: bigint
    ): bigint {
        throw new Error('Method not implemented.')
    }

    public canExecuteAt(
        executor: SolanaAddress,
        executionTime: bigint
    ): boolean {
        throw new Error('Method not implemented.')
    }

    public isExpiredAt(time: bigint): boolean {
        throw new Error('Method not implemented.')
    }

    public isExclusiveResolver(wallet: SolanaAddress): boolean {
        throw new Error('Method not implemented.')
    }

    public isExclusivityPeriod(time: bigint): boolean {
        throw new Error('Method not implemented.')
    }
}
