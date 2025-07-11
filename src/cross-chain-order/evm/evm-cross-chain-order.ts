import {
    EIP712TypedData,
    Extension,
    Interaction,
    LimitOrderV4Struct,
    MakerTraits,
    ZX
} from '@1inch/limit-order-sdk'
import assert from 'assert'
import {
    CrossChainOrderInfo,
    Details,
    EvmEscrowParams,
    Extra,
    OrderInfoData
} from './types'
import {InnerOrder} from './inner-order'
import {EscrowExtension} from './escrow-extension'
import {SettlementPostInteractionData} from './fusion-order'
import {AuctionCalculator} from '../../auction-calculator'
import {now} from '../../utils/time'
import {createAddress, AddressLike, EvmAddress} from '../../domains/addresses'
import {BaseOrder} from '../base-order'
import {TRUE_ERC20} from '../../deployments'
import {isSupportedChain, SupportedChain} from '../../chains'
import {HashLock} from '../../domains/hash-lock'
import {TimeLocks} from '../../domains/time-locks'

export class EvmCrossChainOrder extends BaseOrder<
    EvmAddress,
    LimitOrderV4Struct
> {
    private inner: InnerOrder

    private constructor(
        extension: EscrowExtension,
        orderInfo: OrderInfoData,
        extra?: Extra
    ) {
        super()
        this.inner = new InnerOrder(extension, orderInfo, extra)
    }

    public get hashLock(): HashLock {
        return this.escrowExtension.hashLockInfo
    }

    public get timeLocks(): TimeLocks {
        return this.escrowExtension.timeLocks
    }

    public get srcSafetyDeposit(): bigint {
        return this.escrowExtension.srcSafetyDeposit
    }

    get dstChainId(): SupportedChain {
        return this.inner.escrowExtension.dstChainId
    }

    get escrowExtension(): EscrowExtension {
        return this.inner.escrowExtension
    }

    get extension(): Extension {
        return this.inner.extension
    }

    get maker(): EvmAddress {
        return EvmAddress.fromString(this.inner.maker.toString())
    }

    get takerAsset(): AddressLike {
        return createAddress(
            this.inner.escrowExtension.dstToken.toString(),
            this.dstChainId
        )
    }

    get makerAsset(): EvmAddress {
        return EvmAddress.fromString(this.inner.makerAsset.toString())
    }

    get takingAmount(): bigint {
        return this.inner.takingAmount
    }

    get makingAmount(): bigint {
        return this.inner.makingAmount
    }

    get salt(): bigint {
        return this.inner.salt
    }

    /**
     * If zero address, then maker will receive funds
     */
    get receiver(): AddressLike {
        return createAddress(this.inner.receiver.toString(), this.dstChainId)
    }

    /**
     * Timestamp in sec
     */
    get deadline(): bigint {
        return this.inner.deadline
    }

    /**
     * Timestamp in sec
     */
    get auctionStartTime(): bigint {
        return this.inner.auctionStartTime
    }

    /**
     * Timestamp in sec
     */
    get auctionEndTime(): bigint {
        return this.inner.auctionEndTime
    }

    get nonce(): bigint {
        return this.inner.nonce
    }

    get partialFillAllowed(): boolean {
        return this.inner.partialFillAllowed
    }

    get multipleFillsAllowed(): boolean {
        return this.inner.multipleFillsAllowed
    }

    /**
     * Create new EvmCrossChainOrder
     */
    public static new(
        escrowFactory: EvmAddress,
        orderInfo: CrossChainOrderInfo,
        escrowParams: EvmEscrowParams,
        details: Details,
        extra?: Extra
    ): EvmCrossChainOrder {
        const postInteractionData = SettlementPostInteractionData.new({
            whitelist: details.whitelist,
            resolvingStartTime: details.resolvingStartTime ?? BigInt(now())
        })

        const ext = new EscrowExtension(
            escrowFactory,
            details.auction,
            postInteractionData,
            extra?.permit
                ? new Interaction(orderInfo.makerAsset.inner, extra.permit)
                : undefined,
            escrowParams.hashLock,
            escrowParams.dstChainId,
            orderInfo.takerAsset,
            escrowParams.srcSafetyDeposit,
            escrowParams.dstSafetyDeposit,
            escrowParams.timeLocks
        )

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

        return new EvmCrossChainOrder(
            ext,
            {
                ...orderInfo,
                takerAsset: TRUE_ERC20[escrowParams.srcChainId]
            },
            extra
        )
    }

    /**
     * Create CrossChainOrder from order data and extension
     *
     */
    public static fromDataAndExtension(
        order: LimitOrderV4Struct,
        extension: Extension
    ): EvmCrossChainOrder {
        const ext = EscrowExtension.fromExtension(extension)
        const makerTraits = new MakerTraits(BigInt(order.makerTraits))
        const deadline = makerTraits.expiration()

        const orderExpirationDelay =
            deadline === null
                ? undefined
                : deadline -
                  ext.auctionDetails.startTime -
                  ext.auctionDetails.duration

        return new EvmCrossChainOrder(
            ext,
            {
                makerAsset: EvmAddress.fromString(order.makerAsset),
                takerAsset: EvmAddress.fromString(order.takerAsset),
                makingAmount: BigInt(order.makingAmount),
                takingAmount: BigInt(order.takingAmount),
                receiver: createAddress(order.receiver, ext.dstChainId),
                maker: EvmAddress.fromString(order.maker),
                salt: BigInt(order.salt) >> 160n
            },
            {
                enablePermit2: makerTraits.isPermit2(),
                nonce: makerTraits.nonceOrEpoch(),
                permit:
                    extension.makerPermit === ZX
                        ? undefined
                        : Interaction.decode(extension.makerPermit).data,
                orderExpirationDelay,
                allowMultipleFills: makerTraits.isMultipleFillsAllowed(),
                allowPartialFills: makerTraits.isPartialFillAllowed()
            }
        )
    }

    public build(): LimitOrderV4Struct {
        return this.inner.build()
    }

    public toJSON(): LimitOrderV4Struct {
        return this.build()
    }

    public getOrderHash(srcChainId: number): string {
        return this.inner.getOrderHash(srcChainId)
    }

    public getTypedData(srcChainId: number): EIP712TypedData {
        return this.inner.getTypedData(srcChainId)
    }

    public getCalculator(): AuctionCalculator {
        return this.inner.getCalculator()
    }

    /**
     * Check if `wallet` can fill order before other
     */
    public isExclusiveResolver(wallet: EvmAddress): boolean {
        return this.inner.isExclusiveResolver(wallet.inner)
    }

    /**
     * Check if the auction has exclusive resolver, and it is in the exclusivity period
     *
     * @param time timestamp to check, `now()` by default
     */
    public isExclusivityPeriod(time: bigint): boolean {
        return this.inner.isExclusivityPeriod(Number(time))
    }
}
