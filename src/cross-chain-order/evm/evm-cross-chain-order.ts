import {
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
import assert from 'assert'
import {CrossChainOrderInfo, Details, EvmEscrowParams, Extra} from './types'
import {InnerOrder} from './inner-order'
import {EscrowExtension} from './escrow-extension'
import {Address, EvmAddress} from '../../domains/addresses'
import {BaseOrder} from '../base-order'
import {TRUE_ERC20} from '../../deployments'
import {isSupportedChain, NetworkEnum, SupportedChain} from '../../chains'
import {Immutables} from '../../domains/immutables'
import {HashLock} from '../../domains/hash-lock'
import {TimeLocks} from '../../domains/time-locks'

export class EvmCrossChainOrder extends BaseOrder<LimitOrderV4Struct> {
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

    get dstChainId(): NetworkEnum {
        return this.inner.escrowExtension.dstChainId
    }

    get escrowExtension(): EscrowExtension {
        return this.inner.escrowExtension
    }

    get extension(): Extension {
        return this.inner.extension
    }

    get maker(): Address {
        return new Address(this.inner.maker)
    }

    get takerAsset(): Address {
        return new Address(this.inner.escrowExtension.dstToken)
    }

    get makerAsset(): Address {
        return new Address(this.inner.makerAsset)
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
        return new Address(this.inner.receiver)
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
                makerAsset: new EvmAddress(order.makerAsset),
                takerAsset: new EvmAddress(order.takerAsset),
                makingAmount: BigInt(order.makingAmount),
                takingAmount: BigInt(order.takingAmount),
                receiver: new EvmAddress(order.receiver),
                maker: new EvmAddress(order.maker),
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
        executor.assertEvm()

        return this.inner.canExecuteAt(executor.inner, executionTime)
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
        wallet.assertEvm()

        return this.inner.isExclusiveResolver(wallet.inner)
    }

    /**
     * Check if the auction has exclusive resolver, and it is in the exclusivity period
     *
     * @param time timestamp to check, `now()` by default
     */
    public isExclusivityPeriod(time = now()): boolean {
        return this.inner.isExclusivityPeriod(time)
    }

    /**
     * @param srcChainId
     * @param taker executor of fillOrder* transaction
     * @param amount making amount (make sure same amount passed to contact fillOrder method)
     * @param hashLock leaf of a merkle tree for multiple fill
     */
    public toSrcImmutables(
        srcChainId: SupportedChain,
        taker: Address,
        amount: bigint,
        hashLock = this.escrowExtension.hashLockInfo
    ): Immutables {
        const isPartialFill = amount !== this.makingAmount
        const isLeafHashLock = hashLock !== this.escrowExtension.hashLockInfo

        if (isPartialFill && !isLeafHashLock) {
            throw new Error(
                'Provide leaf of merkle tree as HashLock for partial fell'
            )
        }

        return Immutables.new({
            hashLock,
            safetyDeposit: this.escrowExtension.srcSafetyDeposit,
            taker,
            maker: this.maker,
            orderHash: this.getOrderHash(srcChainId),
            amount,
            timeLocks: this.escrowExtension.timeLocks,
            token: this.makerAsset
        })
    }

    public getMultipleFillIdx(
        fillAmount: bigint,
        remainingAmount = this.makingAmount
    ): number {
        assert(
            this.inner.multipleFillsAllowed,
            'Multiple fills disabled for order'
        )
        const partsCount = this.escrowExtension.hashLockInfo.getPartsCount()

        const calculatedIndex =
            ((this.makingAmount - remainingAmount + fillAmount - 1n) *
                partsCount) /
            this.makingAmount

        if (remainingAmount === fillAmount) {
            return Number(calculatedIndex + 1n)
        }

        return Number(calculatedIndex)
    }
}
