import {
    AuctionCalculator,
    CHAIN_TO_WRAPPER,
    FusionOrder,
    EIP712TypedData,
    Extension,
    Interaction,
    LimitOrderV4Struct,
    MakerTraits,
    Whitelist,
    ZX,
    NetworkEnum
} from '@1inch/fusion-sdk'
import {ProxyFactory} from '@1inch/limit-order-sdk'
import assert from 'assert'
import {
    EvmCrossChainOrderInfo,
    EvmDetails,
    EvmEscrowParams,
    EvmExtra,
    OrderInfoData
} from './types.js'
import {InnerOrder} from './inner-order.js'
import {EscrowExtension} from './escrow-extension.js'
import {AddressComplement} from '../../domains/addresses/address-complement.js'
import {now} from '../../utils/time/index.js'
import {
    createAddress,
    AddressLike,
    EvmAddress
} from '../../domains/addresses/index.js'
import {BaseOrder} from '../base-order.js'
import {TRUE_ERC20} from '../../deployments.js'
import {isEvm, isSupportedChain, SupportedChain} from '../../chains.js'
import {HashLock} from '../../domains/hash-lock/index.js'
import {TimeLocks} from '../../domains/time-locks/index.js'
import {bufferFromHex} from '../../utils/bytes.js'

export class EvmCrossChainOrder extends BaseOrder<
    EvmAddress,
    LimitOrderV4Struct
> {
    protected inner: InnerOrder

    constructor(
        extension: EscrowExtension,
        orderInfo: OrderInfoData,
        extra?: EvmExtra
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

    public get dstSafetyDeposit(): bigint {
        return this.escrowExtension.dstSafetyDeposit
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
     * Real receiver of funds on dst chain
     */
    get receiver(): AddressLike {
        const receiver = createAddress(
            this.inner.receiver.toString(),
            this.dstChainId,
            this.escrowExtension.dstAddressFirstPart
        )

        return receiver.isZero() ? this.maker : receiver
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
        orderInfo: EvmCrossChainOrderInfo,
        escrowParams: EvmEscrowParams,
        details: EvmDetails,
        extra?: EvmExtra
    ): EvmCrossChainOrder {
        assert(
            isEvm(escrowParams.srcChainId),
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

        const whitelist = Whitelist.new(
            details.resolvingStartTime ?? BigInt(now()),
            details.whitelist.map((i) => ({
                address: i.address.inner,
                allowFrom: i.allowFrom
            }))
        )

        if (!isEvm(escrowParams.dstChainId) && !orderInfo.receiver) {
            throw new Error('Receiver is required for non EVM chain')
        }

        const [complement, receiver] = orderInfo.receiver?.splitToParts() || [
            AddressComplement.ZERO,
            EvmAddress.ZERO
        ]

        const makerPermit = extra?.permit
            ? new Interaction(orderInfo.makerAsset.inner, extra.permit)
            : undefined

        const ext = new EscrowExtension(
            escrowFactory,
            details.auction,
            whitelist,
            escrowParams.hashLock,
            escrowParams.dstChainId,
            orderInfo.takerAsset,
            escrowParams.srcSafetyDeposit,
            escrowParams.dstSafetyDeposit,
            escrowParams.timeLocks,
            complement,
            {makerPermit, fees: details.fees}
        )

        return new EvmCrossChainOrder(
            ext,
            {
                ...orderInfo,
                receiver,
                takerAsset: TRUE_ERC20[escrowParams.srcChainId]
            },
            extra
        )
    }

    static isNativeOrder(
        chainId: number,
        ethOrderFactory: ProxyFactory,
        order: LimitOrderV4Struct,
        signature: string
    ): boolean {
        return FusionOrder.isNativeOrder(
            chainId,
            ethOrderFactory,
            order,
            signature
        )
    }

    /**
     * Create new order from native asset
     *
     *
     * Note, that such order should be submitted on-chain through `NativeOrderFactory.create` AND off-chain through submit to relayer
     * @see NativeOrderFactory.create https://github.com/1inch/limit-order-protocol/blob/feature/new-eth-orders/contracts/extensions/NativeOrderFactory.sol#L53
     */
    static fromNative(
        chainId: number,
        ethOrdersFactory: ProxyFactory,
        escrowFactory: EvmAddress,
        orderInfo: Omit<EvmCrossChainOrderInfo, 'makerAsset'>,
        details: EvmDetails,
        escrowParams: EvmEscrowParams,
        extra?: EvmExtra
    ): EvmCrossChainOrder {
        const _orderInfo = {
            ...orderInfo,
            makerAsset: EvmAddress.fromString(
                CHAIN_TO_WRAPPER[chainId as NetworkEnum].toString()
            ),
            receiver:
                orderInfo.receiver && !orderInfo.receiver.isZero()
                    ? orderInfo.receiver
                    : orderInfo.maker
        }

        const _order = EvmCrossChainOrder.new(
            escrowFactory,
            _orderInfo,
            escrowParams,
            details,
            {...extra, optimizeReceiverAddress: false}
        )

        _order.inner = _order.inner.toNativeOrder(
            chainId,
            ethOrdersFactory,
            extra
        )

        return _order
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
                makerAsset: EvmAddress.fromUnknown(order.makerAsset),
                takerAsset: EvmAddress.fromUnknown(order.takerAsset),
                makingAmount: BigInt(order.makingAmount),
                takingAmount: BigInt(order.takingAmount),
                receiver: EvmAddress.fromUnknown(order.receiver),
                maker: EvmAddress.fromUnknown(order.maker),
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

    public isNative(
        chainId: number,
        ethOrderFactory: ProxyFactory,
        signature: string
    ): boolean {
        return this.inner.isNative(chainId, ethOrderFactory, signature)
    }

    /**
     * Returns signature for submitting native order on-chain
     * Only valid if order is native
     *
     * @see EvmCrossChainOrder.isNative
     * @see EvmCrossChainOrder.fromNative
     */
    public nativeSignature(maker: EvmAddress): string {
        return this.inner.nativeSignature(maker.inner)
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

    public getOrderHashBuffer(srcChainId: number): Buffer {
        return bufferFromHex(this.getOrderHash(srcChainId))
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
        return this.inner.isExclusivityPeriod(time)
    }

    /**
     * Check whether address allowed to execute order at the given time
     *
     * @param executor address of executor
     * @param executionTime timestamp in sec at which order planning to execute
     */
    public canExecuteAt(executor: EvmAddress, executionTime: bigint): boolean {
        return this.inner.canExecuteAt(executor.inner, executionTime)
    }

    /**
     * Calculate protocol fee for the given parameters
     *
     * @param taker address of taker (resolver)
     * @param time execution timestamp in sec
     * @param blockBaseFee block base fee in wei (optional)
     * @param makingAmount amount to fill (defaults to full order)
     */
    public getProtocolFee(
        taker: EvmAddress,
        time: bigint,
        blockBaseFee = 0n,
        makingAmount = this.makingAmount
    ): bigint {
        return this.inner.getProtocolFee(taker.inner, time, blockBaseFee, makingAmount)
    }

    /**
     * Calculate integrator fee for the given parameters
     *
     * @param taker address of taker (resolver)
     * @param time execution timestamp in sec
     * @param blockBaseFee block base fee in wei (optional)
     * @param makingAmount amount to fill (defaults to full order)
     */
    public getIntegratorFee(
        taker: EvmAddress,
        time: bigint,
        blockBaseFee = 0n,
        makingAmount = this.makingAmount
    ): bigint {
        return this.inner.getIntegratorFee(taker.inner, time, blockBaseFee, makingAmount)
    }
}
