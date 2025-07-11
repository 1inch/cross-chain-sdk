import {UINT_64_MAX} from '@1inch/byte-utils'
import {ResolverCancellationConfig} from './resolver-cancellation-config'
import {Details, Extra, SolanaEscrowParams} from './types'
import {AddressLike, SolanaAddress} from '../../domains/addresses'
import {SupportedChain} from '../../chains'
import {HashLock} from '../../domains/hash-lock'
import {TimeLocks} from '../../domains/time-locks'
import {BaseOrder} from '../base-order'
import {assertUInteger} from '../../utils'
import {AuctionCalculator} from '../../auction-calculator'

export type SolanaOrderJSON = {
    order_hash: string // 32bytes hex
    hashlock: string // 32bytes hex
    maker: string // base58 address
    srcToken: string // base58 address
    dstToken: string // uint256 address
}

export type OrderInfoData = {
    srcToken: SolanaAddress
    dstToken: SolanaAddress
    maker: SolanaAddress
    srcAmount: bigint // u64
    minDstAmount: bigint // u64
    receiver: AddressLike
}

export class SvmCrossChainOrder extends BaseOrder<
    SolanaAddress,
    SolanaOrderJSON
> {
    private static DefaultExtra = {
        orderExpirationDelay: 12n,
        allowMultipleFills: true,
        source: 'sdk',
        resolverCancellationConfig: ResolverCancellationConfig.ALMOST_ZERO // to enable cancellation by resolver
    }

    private readonly orderConfig: {
        srcToken: SolanaAddress
        dstToken: AddressLike
        maker: SolanaAddress
        receiver: AddressLike
        srcAmount: bigint // u64
        minDstAmount: bigint // u64
        deadline: number // u32

        // ---extra---
        srcAssetIsNative: boolean
        // dst asset is native in case dstToken.isZero
        resolverCancellationConfig: ResolverCancellationConfig
        source: string
        allowMultipleFills: boolean
    }

    private readonly details: Details

    private readonly escrowParams: SolanaEscrowParams

    private constructor(
        orderInfo: OrderInfoData,
        escrowParams: SolanaEscrowParams,
        details: Details,
        extra: Extra
    ) {
        super()

        const orderExpirationDelay =
            extra.orderExpirationDelay ??
            SvmCrossChainOrder.DefaultExtra.orderExpirationDelay

        const deadline =
            details.auction.startTime +
            details.auction.duration +
            orderExpirationDelay

        assertUInteger(orderExpirationDelay)
        assertUInteger(deadline)
        assertUInteger(orderInfo.srcAmount, UINT_64_MAX)
        assertUInteger(orderInfo.minDstAmount, UINT_64_MAX)
        // todo more asserts

        const resolverCancellationConfig =
            extra.resolverCancellationConfig ||
            SvmCrossChainOrder.DefaultExtra.resolverCancellationConfig

        this.details = details
        this.escrowParams = escrowParams
        this.orderConfig = {
            ...orderInfo,
            source: extra.source ?? SvmCrossChainOrder.DefaultExtra.source,
            allowMultipleFills:
                extra.allowMultipleFills ??
                SvmCrossChainOrder.DefaultExtra.allowMultipleFills,
            srcAssetIsNative: extra.srcAssetIsNative,
            deadline: Number(deadline),
            resolverCancellationConfig: resolverCancellationConfig
        }
    }

    public get hashLock(): HashLock {
        return this.escrowParams.hashLock
    }

    public get timeLocks(): TimeLocks {
        return this.escrowParams.timeLocks
    }

    public get srcSafetyDeposit(): bigint {
        return this.escrowParams.dstSafetyDeposit
    }

    public get dstChainId(): SupportedChain {
        return this.escrowParams.dstChainId
    }

    public get maker(): SolanaAddress {
        return this.orderConfig.maker
    }

    public get makerAsset(): SolanaAddress {
        return this.orderConfig.srcToken
    }

    public get takerAsset(): AddressLike {
        return this.orderConfig.dstToken
    }

    public get makingAmount(): bigint {
        return this.orderConfig.srcAmount
    }

    public get takingAmount(): bigint {
        return this.orderConfig.minDstAmount
    }

    public get receiver(): AddressLike {
        return this.orderConfig.receiver
    }

    public get deadline(): bigint {
        return BigInt(this.orderConfig.deadline)
    }

    public get auctionStartTime(): bigint {
        return this.details.auction.startTime
    }

    public get auctionEndTime(): bigint {
        return this.auctionStartTime + this.details.auction.duration
    }

    public get partialFillAllowed(): boolean {
        return this.orderConfig.allowMultipleFills
    }

    public get multipleFillsAllowed(): boolean {
        return this.orderConfig.allowMultipleFills
    }

    public toJSON(): SolanaOrderJSON {
        throw new Error('Method not implemented.')
    }

    public getOrderHash(_srcChainId: number): string {
        throw new Error('Method not implemented.')
    }

    public getCalculator(): AuctionCalculator {
        return AuctionCalculator.fromAuctionDetails(this.details.auction)
    }
}
