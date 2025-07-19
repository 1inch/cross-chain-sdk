import {BitMask, UINT_32_MAX, UINT_64_MAX} from '@1inch/byte-utils'
import {AuctionCalculator, randBigInt} from '@1inch/fusion-sdk'
import {keccak256} from 'ethers'
import {utils} from '@coral-xyz/anchor'
import assert from 'assert'
import {ResolverCancellationConfig} from './resolver-cancellation-config'
import {SolanaDetails, SolanaExtra, SolanaEscrowParams} from './types'
import {SvmSrcEscrowFactory} from '../../contracts'
import {hashForSolana} from '../../domains/auction-details/hasher'
import {uint256BorchSerialized} from '../../utils/numbers/uint256-borsh-serialized'
import {uintAsBeBytes} from '../../utils/numbers/uint-as-be-bytes'
import {AddressLike, EvmAddress, SolanaAddress} from '../../domains/addresses'
import {isSupportedChain, NetworkEnum, SupportedChain} from '../../chains'
import {HashLock} from '../../domains/hash-lock'
import {TimeLocks} from '../../domains/time-locks'
import {BaseOrder} from '../base-order'
import {assertUInteger} from '../../utils'
import {AuctionDetails, AuctionPoint} from '../../domains/auction-details'
import {injectTrackCode} from '../source-track'

export type SolanaOrderJSON = {
    orderInfo: {
        srcToken: string // base58 solana address
        dstToken: string // evm address
        maker: string // base58 solana address
        srcAmount: string // u64 bigint
        minDstAmount: string // u64 bigint
        receiver: string // evm address
    }
    escrowParams: {
        hashLock: string // 32bytes hex
        srcChainId: NetworkEnum.SOLANA
        dstChainId: number
        srcSafetyDeposit: string // u64 bigint
        dstSafetyDeposit: string // u64 bigint
        timeLocks: string // u256 bigint
    }
    details: {
        auction: {
            startTime: string
            duration: string
            initialRateBump: number
            points: AuctionPoint[]
        }
    }
    extra: {
        srcAssetIsNative: boolean
        orderExpirationDelay: string // bigint
        resolverCancellationConfig: {
            maxCancellationPremium: string // u64 bigint
            cancellationAuctionDuration: number
        }
        source: string
        allowMultipleFills: boolean
        salt: string // u32 bigint
    }
}

export type OrderInfoData = {
    srcToken: SolanaAddress
    dstToken: EvmAddress
    maker: SolanaAddress
    srcAmount: bigint // u64
    minDstAmount: bigint // u64
    receiver: EvmAddress
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
        receiver: EvmAddress
        srcAmount: bigint // u64
        minDstAmount: bigint // u64
        deadline: number // u32
        salt: bigint // u64

        // ---extra---
        srcAssetIsNative: boolean
        // dst asset is native in case dstToken.isZero
        resolverCancellationConfig: ResolverCancellationConfig
        allowMultipleFills: boolean
        orderExpirationDelay: bigint
        source: string
    }

    private readonly details: SolanaDetails

    private readonly escrowParams: SolanaEscrowParams

    private readonly encoder = new TextEncoder()

    private constructor(
        orderInfo: OrderInfoData,
        escrowParams: SolanaEscrowParams,
        details: SolanaDetails,
        extra: SolanaExtra
    ) {
        assert(
            isSupportedChain(escrowParams.srcChainId),
            `Not supported chain ${escrowParams.srcChainId}`
        )
        assert(
            isSupportedChain(escrowParams.dstChainId),
            `Not supported chain ${escrowParams.dstChainId}`
        )
        assert(
            escrowParams.srcChainId !== escrowParams.dstChainId,
            'Chains must be different'
        )

        super()

        const orderExpirationDelay =
            extra.orderExpirationDelay ??
            SvmCrossChainOrder.DefaultExtra.orderExpirationDelay
        assertUInteger(orderExpirationDelay)

        const deadline =
            details.auction.startTime +
            details.auction.duration +
            orderExpirationDelay

        assertUInteger(deadline, UINT_32_MAX)
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
            source,
            salt,
            allowMultipleFills:
                extra.allowMultipleFills ??
                SvmCrossChainOrder.DefaultExtra.allowMultipleFills,
            srcAssetIsNative: extra.srcAssetIsNative || false,
            deadline: Number(deadline),
            resolverCancellationConfig: resolverCancellationConfig,
            orderExpirationDelay
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
        return this.escrowParams.srcSafetyDeposit
    }

    public get dstSafetyDeposit(): bigint {
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

    public get receiver(): EvmAddress {
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
        details: SolanaDetails,
        extra: Omit<SolanaExtra, 'srcAssetIsNative'>
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

    static fromJSON(data: SolanaOrderJSON): SvmCrossChainOrder {
        return new SvmCrossChainOrder(
            {
                srcToken: SolanaAddress.fromString(data.orderInfo.srcToken),
                dstToken: EvmAddress.fromString(data.orderInfo.dstToken),
                srcAmount: BigInt(data.orderInfo.srcAmount),
                minDstAmount: BigInt(data.orderInfo.minDstAmount),
                maker: SolanaAddress.fromString(data.orderInfo.maker),
                receiver: EvmAddress.fromString(data.orderInfo.receiver)
            },
            {
                dstChainId: data.escrowParams.dstChainId,
                dstSafetyDeposit: BigInt(data.escrowParams.dstSafetyDeposit),
                hashLock: HashLock.fromString(data.escrowParams.hashLock),
                srcChainId: data.escrowParams.srcChainId,
                srcSafetyDeposit: BigInt(data.escrowParams.srcSafetyDeposit),
                timeLocks: TimeLocks.fromBigInt(
                    BigInt(data.escrowParams.timeLocks)
                )
            },
            {
                auction: AuctionDetails.fromJSON({
                    ...data.details.auction,
                    gasCost: {gasBumpEstimate: '0', gasPriceEstimate: '0'}
                })
            },
            {
                allowMultipleFills: data.extra.allowMultipleFills,
                orderExpirationDelay: BigInt(data.extra.orderExpirationDelay),
                salt: BigInt(data.extra.salt),
                resolverCancellationConfig: new ResolverCancellationConfig(
                    BigInt(
                        data.extra.resolverCancellationConfig
                            .maxCancellationPremium
                    ),
                    data.extra.resolverCancellationConfig.cancellationAuctionDuration
                ),
                source: data.extra.source,
                srcAssetIsNative: data.extra.srcAssetIsNative
            }
        )
    }

    public toJSON(): SolanaOrderJSON {
        const auction = this.auction.toJSON()

        return {
            details: {
                // skip gasCost field
                auction: {
                    duration: auction.duration,
                    initialRateBump: auction.initialRateBump,
                    points: auction.points,
                    startTime: auction.startTime
                }
            },
            orderInfo: {
                srcToken: this.orderConfig.srcToken.toString(),
                dstToken: this.orderConfig.dstToken.toString(),
                maker: this.orderConfig.maker.toString(),
                srcAmount: this.orderConfig.srcAmount.toString(),
                minDstAmount: this.orderConfig.minDstAmount.toString(),
                receiver: this.orderConfig.receiver.toString()
            },
            escrowParams: {
                hashLock: this.hashLock.toString(),
                srcChainId: NetworkEnum.SOLANA,
                dstChainId: this.dstChainId,
                srcSafetyDeposit: this.escrowParams.srcSafetyDeposit.toString(),
                dstSafetyDeposit: this.escrowParams.dstSafetyDeposit.toString(),
                timeLocks: this.timeLocks.build().toString()
            },
            extra: {
                srcAssetIsNative: this.srcAssetIsNative,
                orderExpirationDelay:
                    this.orderConfig.orderExpirationDelay.toString(),
                resolverCancellationConfig:
                    this.resolverCancellationConfig.toJSON(),
                source: this.orderConfig.source,
                allowMultipleFills: this.multipleFillsAllowed,
                // use only last bits because high ones set from source
                salt: (this.salt & UINT_32_MAX).toString()
            }
        }
    }

    public getOrderAccount(
        /**
         * Src escrow factory program id
         */
        programId: SolanaAddress
    ): SolanaAddress {
        return new SvmSrcEscrowFactory(programId).getOrderAccount(
            this.getOrderHashBuffer()
        )
    }

    /**
     * Returns escrow address - owner of ATA where funds stored after fill
     *
     * @see getSrcEscrowATA to get ATA where funds stored
     */
    public getSrcEscrowAddress(
        /**
         * Src escrow factory program id
         */
        programId: SolanaAddress,
        /**
         * Address who fill order and create corresponding escrow
         */
        taker: SolanaAddress,
        /**
         * Hash of corresponding to fill amount secret
         * Can be omitted  for orders where `multipleFillsAllowed` is false
         */
        secretHash = this.hashLock.toBuffer()
    ): SolanaAddress {
        return new SvmSrcEscrowFactory(programId).getEscrowAddress({
            orderHash: this.getOrderHashBuffer(),
            secretHash,
            maker: this.maker,
            taker,
            makerAsset: this.makerAsset,
            makingAmount: this.makingAmount,
            srcSafetyDeposit: this.srcSafetyDeposit
        })
    }

    // /**
    //  * Actual address where funds stored
    //  */
    // public getEscrowATA(
    //     /**
    //      * Src escrow factory
    //      */
    //     srcEscrowProgramId: SolanaAddress,
    //     /**
    //      * TokenProgram or TokenProgram 2022
    //      */
    //     srcMintProgramId: SolanaAddress
    // ): SolanaAddress {
    //     const escrowAddress = this.getEscrowAddress(srcEscrowProgramId)
    //
    //     return getAta(escrowAddress, this.makerAsset, srcMintProgramId)
    // }

    /**
     * @returns order has in base58 encoding
     */
    public getOrderHash(_srcChainId: number): string {
        return utils.bytes.bs58.encode(this.getOrderHashBuffer())
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
