import {add0x, BitMask, UINT_32_MAX, UINT_64_MAX} from '@1inch/byte-utils'
import {AuctionCalculator, randBigInt} from '@1inch/fusion-sdk'
import {keccak256} from 'ethers'
import {ResolverCancellationConfig} from './resolver-cancellation-config'
import {Details, Extra, SolanaEscrowParams} from './types'
import {hashForSolana} from '../../domains/auction-details/hasher'
import {uint256BorchSerialized} from '../../utils/numbers/uint256-borsh-serialized'
import {uintAsBeBytes} from '../../utils/numbers/uint-as-be-bytes'
import {AddressLike, SolanaAddress} from '../../domains/addresses'
import {SupportedChain} from '../../chains'
import {HashLock} from '../../domains/hash-lock'
import {TimeLocks} from '../../domains/time-locks'
import {BaseOrder} from '../base-order'
import {assertUInteger, getAta, getPda} from '../../utils'
import {AuctionDetails} from '../../domains/auction-details'
import {injectTrackCode} from '../source-track'

export type SolanaOrderJSON = {
    order_hash: string // 32bytes hex
    hashlock: string // 32bytes hex
    maker: string // base58 address
    srcToken: string // base58 address
    dstToken: string // uint256 address
}

export type OrderInfoData = {
    srcToken: SolanaAddress
    dstToken: AddressLike
    maker: SolanaAddress
    srcAmount: bigint // u64
    minDstAmount: bigint // u64
    receiver: AddressLike
}

export class SvmCrossChainOrder extends BaseOrder<
    SolanaAddress,
    SolanaOrderJSON
> {
    private static TRACK_CODE_MASK = new BitMask(32n, 64n)

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
        salt: bigint // u64

        // ---extra---
        srcAssetIsNative: boolean
        // dst asset is native in case dstToken.isZero
        resolverCancellationConfig: ResolverCancellationConfig
        allowMultipleFills: boolean
    }

    private readonly details: Details

    private readonly escrowParams: SolanaEscrowParams

    private readonly encoder = new TextEncoder()

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

        const source = extra.source ?? SvmCrossChainOrder.DefaultExtra.source
        const salt = injectTrackCode(
            extra.salt ?? randBigInt(UINT_32_MAX),
            source,
            SvmCrossChainOrder.TRACK_CODE_MASK
        )

        const resolverCancellationConfig =
            extra.resolverCancellationConfig ||
            SvmCrossChainOrder.DefaultExtra.resolverCancellationConfig

        this.details = details
        this.escrowParams = escrowParams
        this.orderConfig = {
            ...orderInfo,
            salt,
            allowMultipleFills:
                extra.allowMultipleFills ??
                SvmCrossChainOrder.DefaultExtra.allowMultipleFills,
            srcAssetIsNative: extra.srcAssetIsNative || false,
            deadline: Number(deadline),
            resolverCancellationConfig: resolverCancellationConfig
        }
    }

    public get auction(): AuctionDetails {
        return this.details.auction
    }

    public get salt(): bigint {
        return this.orderConfig.salt
    }

    public get resolverCancellationConfig(): ResolverCancellationConfig {
        return this.orderConfig.resolverCancellationConfig
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

    public get srcAssetIsNative(): boolean {
        return this.orderConfig.srcAssetIsNative
    }

    static new(
        orderInfo: OrderInfoData,
        escrowParams: SolanaEscrowParams,
        details: Details,
        extra: Omit<Extra, 'srcAssetIsNative'>
    ): SvmCrossChainOrder {
        return new SvmCrossChainOrder(
            {
                ...orderInfo,
                srcToken: orderInfo.srcToken.isNative()
                    ? SolanaAddress.WRAPPED_NATIVE
                    : orderInfo.srcToken
            },
            escrowParams,
            details,
            {
                ...extra,
                srcAssetIsNative: orderInfo.srcToken.isNative()
            }
        )
    }

    public toJSON(): SolanaOrderJSON {
        throw new Error('Method not implemented.')
    }

    /**
     * Returns escrow address - owner of ATA where funds stored
     *
     * @see getEscrowATA to get ATA where funds stored
     */
    public getEscrowAddress(programId: SolanaAddress): SolanaAddress {
        return getPda(programId, [
            this.encoder.encode('escrow'),
            this.getOrderHashBuffer(),
            this.hashLock.toBuffer(),
            this.maker.toBuffer(),
            this.receiver.toBuffer(),
            this.makerAsset.toBuffer(),
            uintAsBeBytes(this.makingAmount, 64),
            uintAsBeBytes(this.srcSafetyDeposit, 64)
        ])
    }

    /**
     * Actual address where funds stored
     */
    public getEscrowATA(
        /**
         * Src escrow factory
         */
        srcEscrowProgramId: SolanaAddress,
        /**
         * TokenProgram or TokenProgram 2022
         */
        srcMintProgramId: SolanaAddress
    ): SolanaAddress {
        const escrowAddress = this.getEscrowAddress(srcEscrowProgramId)

        return getAta(escrowAddress, this.makerAsset, srcMintProgramId)
    }

    public getOrderHash(_srcChainId: number): string {
        return add0x(this.getOrderHashBuffer().toString('hex'))
    }

    public getOrderHashBuffer(): Buffer {
        return Buffer.from(
            keccak256(
                Buffer.concat([
                    this.hashLock.toBuffer(),
                    this.maker.toBuffer(),
                    this.makerAsset.toBuffer(),
                    uintAsBeBytes(this.makingAmount, 64),
                    uintAsBeBytes(this.srcSafetyDeposit, 64),
                    uint256BorchSerialized(this.timeLocks.build()),
                    uintAsBeBytes(this.deadline, 32),
                    Buffer.from([Number(this.srcAssetIsNative)]),
                    uint256BorchSerialized(this.takingAmount),
                    hashForSolana(this.auction),
                    uintAsBeBytes(
                        this.resolverCancellationConfig.maxCancellationPremium,
                        64
                    ),
                    uintAsBeBytes(
                        BigInt(
                            this.resolverCancellationConfig
                                .cancellationAuctionDuration
                        ),
                        32
                    ),
                    Buffer.from([Number(this.multipleFillsAllowed)]),
                    uintAsBeBytes(this.salt, 64)
                ])
            ).slice(2),
            'hex'
        )
    }

    public getCalculator(): AuctionCalculator {
        const details = this.details.auction

        return new AuctionCalculator(
            details.startTime,
            details.duration,
            details.initialRateBump,
            details.points,
            0n // no taker fee
        )
    }
}
