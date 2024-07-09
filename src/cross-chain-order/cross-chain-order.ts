import {
    Address,
    OrderInfoData,
    AuctionCalculator,
    Extension,
    LimitOrderV4Struct,
    EIP712TypedData,
    Interaction,
    MakerTraits,
    ZX,
    SettlementPostInteractionData,
    now
} from '@1inch/fusion-sdk'
import {CrossChainOrderInfo, Details, EscrowParams, Extra} from './types'
import {InnerOrder} from './inner-order'
import {EscrowExtension} from './escrow-extension'
import {TRUE_ERC20} from '../deployments'

export class CrossChainOrder {
    private inner: InnerOrder

    private constructor(
        extension: EscrowExtension,
        orderInfo: OrderInfoData,
        extra?: Extra
    ) {
        this.inner = new InnerOrder(extension, orderInfo, extra)
    }

    get escrowExtension(): EscrowExtension {
        return this.inner.escrowExtension
    }

    get extension(): Extension {
        return this.inner.extension
    }

    get maker(): Address {
        return this.inner.maker
    }

    get takerAsset(): Address {
        return this.inner.takerAsset
    }

    get makerAsset(): Address {
        return this.inner.escrowExtension.dstToken
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
    get receiver(): Address {
        return this.inner.receiver
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

    /**
     * Create new CrossChainOrder
     */
    public static new(
        escrowFactory: Address,
        orderInfo: CrossChainOrderInfo,
        escrowParams: EscrowParams,
        details: Details,
        extra?: Extra
    ): CrossChainOrder {
        const postInteractionData = SettlementPostInteractionData.new({
            bankFee: details.fees?.bankFee || 0n,
            integratorFee: details.fees?.integratorFee,
            whitelist: details.whitelist,
            resolvingStartTime: details.resolvingStartTime ?? now(),
            customReceiver: orderInfo.receiver
        })

        const ext = new EscrowExtension(
            escrowFactory,
            details.auction,
            postInteractionData,
            extra?.permit
                ? new Interaction(orderInfo.makerAsset, extra.permit)
                : undefined,
            escrowParams.hashLock,
            escrowParams.dstChainId,
            orderInfo.takerAsset,
            escrowParams.srcSafetyDeposit,
            escrowParams.dstSafetyDeposit,
            escrowParams.timeLocks
        )

        return new CrossChainOrder(
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
    ): CrossChainOrder {
        const ext = EscrowExtension.fromExtension(extension)
        const makerTraits = new MakerTraits(BigInt(order.makerTraits))
        const deadline = makerTraits.expiration()

        const orderExpirationDelay =
            deadline === null
                ? undefined
                : deadline -
                  ext.auctionDetails.startTime -
                  ext.auctionDetails.duration

        return new CrossChainOrder(
            ext,
            {
                makerAsset: new Address(order.makerAsset),
                takerAsset: new Address(order.takerAsset),
                makingAmount: BigInt(order.makingAmount),
                takingAmount: BigInt(order.takingAmount),
                receiver: new Address(order.receiver),
                maker: new Address(order.maker),
                salt: BigInt(order.salt) >> 160n
            },
            {
                enablePermit2: makerTraits.isPermit2(),
                nonce: makerTraits.nonceOrEpoch(),
                permit:
                    extension.makerPermit === ZX
                        ? undefined
                        : Interaction.decode(extension.makerPermit).data,
                unwrapWETH: makerTraits.isNativeUnwrapEnabled(),
                orderExpirationDelay
            }
        )
    }

    public build(): LimitOrderV4Struct {
        return this.inner.build()
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
     * Calculates required taking amount for passed `makingAmount` at block time `time`
     *
     * @param makingAmount maker swap amount
     * @param time execution time in sec
     * @param blockBaseFee block fee in wei.
     * */
    public calcTakingAmount(
        makingAmount: bigint,
        time: bigint,
        blockBaseFee?: bigint
    ): bigint {
        return this.inner.calcTakingAmount(makingAmount, time, blockBaseFee)
    }

    /**
     * Check whether address allowed to execute order at the given time
     *
     * @param executor address of executor
     * @param executionTime timestamp in sec at which order planning to execute
     */
    public canExecuteAt(executor: Address, executionTime: bigint): boolean {
        return this.inner.canExecuteAt(executor, executionTime)
    }

    /**
     * Check is order expired at a given time
     *
     * @param time timestamp in seconds
     */
    public isExpiredAt(time: bigint): boolean {
        return this.inner.isExpiredAt(time)
    }

    /**
     * Returns how much fee will be credited from a resolver deposit account
     * Token of fee set in Settlement extension constructor
     * Actual deployments can be found at https://github.com/1inch/limit-order-settlement/tree/master/deployments
     *
     * @param filledMakingAmount which resolver fills
     * @see https://github.com/1inch/limit-order-settlement/blob/0e3cae3653092ebb4ea5d2a338c87a54351ad883/contracts/extensions/ResolverFeeExtension.sol#L29
     */
    public getResolverFee(filledMakingAmount: bigint): bigint {
        return this.inner.getResolverFee(filledMakingAmount)
    }

    /**
     * Check if `wallet` can fill order before other
     */
    public isExclusiveResolver(wallet: Address): boolean {
        return this.inner.isExclusiveResolver(wallet)
    }

    /**
     * Check if the auction has exclusive resolver, and it is in the exclusivity period
     *
     * @param time timestamp to check, `now()` by default
     */
    public isExclusivityPeriod(time = now()): boolean {
        return this.inner.isExclusivityPeriod(time)
    }
}
