import {
    Address,
    calcTakingAmount,
    EIP712TypedData,
    Extension,
    Interaction,
    LimitOrder,
    LimitOrderV4Struct,
    MakerTraits,
    ZX,
    Uint256
} from '@1inch/limit-order-sdk'
import assert from 'assert'
import {FusionExtension} from './fusion-extension'
import {
    AuctionWhitelistItem,
    SettlementPostInteractionData
} from './settlement-post-interaction-data'
import {injectTrackCode} from './source-track'
import {AuctionDetails} from '../../../domains/auction-details'
import {EvmAddress} from '../../../domains/addresses'
import {now} from '../../../utils/time/now'
import {AuctionCalculator} from '../../auction-calculator'

export type OrderInfoData = {
    makerAsset: EvmAddress
    takerAsset: EvmAddress
    makingAmount: bigint
    takingAmount: bigint
    maker: EvmAddress
    salt?: bigint
    receiver?: Uint256
}

export class FusionOrder {
    private static defaultExtra = {
        allowPartialFills: true,
        allowMultipleFills: true,
        unwrapWETH: false,
        enablePermit2: false,
        orderExpirationDelay: 12n
    }

    public readonly fusionExtension: FusionExtension

    private inner: LimitOrder

    protected constructor(
        /**
         * Fusion extension address
         * @see https://github.com/1inch/limit-order-settlement
         */
        public readonly settlementExtensionContract: EvmAddress,
        orderInfo: OrderInfoData,
        auctionDetails: AuctionDetails,
        postInteractionData: SettlementPostInteractionData,
        extra: {
            unwrapWETH?: boolean
            /**
             * Required if `allowPartialFills` or `allowMultipleFills` is false
             */
            nonce?: bigint
            /**
             * 0x prefixed without the token address
             */
            permit?: string
            /**
             * Default is true
             */
            allowPartialFills?: boolean

            /**
             * Default is true
             */
            allowMultipleFills?: boolean
            /**
             * Order will expire in `orderExpirationDelay` after auction ends
             * Default 12s
             */
            orderExpirationDelay?: bigint
            enablePermit2?: boolean
            source?: string
        } = FusionOrder.defaultExtra,
        extension = new FusionExtension(
            settlementExtensionContract,
            auctionDetails,
            postInteractionData,
            extra.permit
                ? new Interaction(orderInfo.makerAsset.inner, extra.permit)
                : undefined
        )
    ) {
        const allowPartialFills =
            extra.allowPartialFills ??
            FusionOrder.defaultExtra.allowPartialFills
        const allowMultipleFills =
            extra.allowMultipleFills ??
            FusionOrder.defaultExtra.allowMultipleFills
        const unwrapWETH =
            extra.unwrapWETH ?? FusionOrder.defaultExtra.unwrapWETH
        const enablePermit2 =
            extra.enablePermit2 ?? FusionOrder.defaultExtra.enablePermit2
        const orderExpirationDelay =
            extra.orderExpirationDelay ??
            FusionOrder.defaultExtra.orderExpirationDelay

        const deadline =
            auctionDetails.startTime +
            auctionDetails.duration +
            orderExpirationDelay

        const makerTraits = MakerTraits.default()
            .withExpiration(deadline)
            .setPartialFills(allowPartialFills)
            .setMultipleFills(allowMultipleFills)
            .enablePostInteraction()

        if (makerTraits.isBitInvalidatorMode()) {
            assert(
                extra.nonce !== undefined,
                'Nonce required, when partial fill or multiple fill disallowed'
            )
        }

        if (unwrapWETH) {
            makerTraits.enableNativeUnwrap()
        }

        if (enablePermit2) {
            makerTraits.enablePermit2()
        }

        if (extra.nonce !== undefined) {
            makerTraits.withNonce(extra.nonce)
        }

        const builtExtension = extension.build()
        const salt = LimitOrder.buildSalt(builtExtension, orderInfo.salt)
        const saltWithInjectedTrackCode = orderInfo.salt
            ? salt
            : injectTrackCode(salt, extra.source)

        this.inner = new LimitOrder(
            {
                ...orderInfo,
                maker: orderInfo.maker.inner,
                makerAsset: orderInfo.makerAsset.inner,
                takerAsset: orderInfo.takerAsset.inner,
                receiver: new Uint256(orderInfo.receiver?.toBigint() || 0n),
                salt: saltWithInjectedTrackCode
            },
            makerTraits,
            builtExtension
        )

        this.fusionExtension = extension
    }

    get extension(): Extension {
        return this.inner.extension
    }

    get maker(): EvmAddress {
        return new EvmAddress(this.inner.maker)
    }

    get takerAsset(): EvmAddress {
        return new EvmAddress(this.inner.takerAsset)
    }

    get makerAsset(): EvmAddress {
        return new EvmAddress(this.inner.makerAsset)
    }

    get takingAmount(): bigint {
        return this.inner.takingAmount
    }

    get makingAmount(): bigint {
        return this.inner.makingAmount
    }

    get receiver(): Uint256 | Address {
        return this.inner.receiver
    }

    /**
     * Timestamp in sec
     */
    get deadline(): bigint {
        return this.inner.makerTraits.expiration() || 0n
    }

    /**
     * Timestamp in sec
     */
    get auctionStartTime(): bigint {
        return this.fusionExtension.auctionDetails.startTime
    }

    /**
     * Timestamp in sec
     */
    get auctionEndTime(): bigint {
        const {startTime, duration} = this.fusionExtension.auctionDetails

        return startTime + duration
    }

    get isBitInvalidatorMode(): boolean {
        return this.inner.makerTraits.isBitInvalidatorMode()
    }

    get partialFillAllowed(): boolean {
        return this.inner.makerTraits.isPartialFillAllowed()
    }

    get multipleFillsAllowed(): boolean {
        return this.inner.makerTraits.isMultipleFillsAllowed()
    }

    get nonce(): bigint {
        return this.inner.makerTraits.nonceOrEpoch()
    }

    get salt(): bigint {
        return this.inner.salt
    }

    static new(
        /**
         * Fusion extension address
         * @see https://github.com/1inch/limit-order-settlement
         */
        settlementExtension: EvmAddress,
        orderInfo: OrderInfoData,
        details: {
            auction: AuctionDetails
            whitelist: AuctionWhitelistItem[]
            /**
             * Time from which order can be executed
             */
            resolvingStartTime?: bigint
        },
        extra?: {
            unwrapWETH?: boolean
            /**
             * Required if `allowPartialFills` or `allowMultipleFills` is false
             * Max size is 40bit
             */
            nonce?: bigint
            permit?: string
            /**
             * Default is true
             */
            allowPartialFills?: boolean

            /**
             * Default is true
             */
            allowMultipleFills?: boolean
            /**
             * Order will expire in `orderExpirationDelay` after auction ends
             * Default 12s
             */
            orderExpirationDelay?: bigint
            enablePermit2?: boolean
            source?: string
        }
    ): FusionOrder {
        return new FusionOrder(
            settlementExtension,
            orderInfo,
            details.auction,
            SettlementPostInteractionData.new({
                whitelist: details.whitelist,
                resolvingStartTime: details.resolvingStartTime ?? BigInt(now())
            }),
            extra
        )
    }

    /**
     * Create FusionOrder from order data and extension
     *
     */
    static fromDataAndExtension(
        order: LimitOrderV4Struct,
        extension: Extension
    ): FusionOrder {
        const settlementContract = Address.fromFirstBytes(
            extension.makingAmountData
        )

        assert(
            Address.fromFirstBytes(extension.takingAmountData).equal(
                settlementContract
            ) &&
                Address.fromFirstBytes(extension.postInteraction).equal(
                    settlementContract
                ),
            'Invalid extension, all calls should be to the same address'
        )

        const makerTraits = new MakerTraits(BigInt(order.makerTraits))

        assert(!makerTraits.isPrivate(), 'fusion order can not be private')
        assert(
            makerTraits.hasPostInteraction(),
            'post-interaction must be enabled'
        )

        const auctionDetails = AuctionDetails.fromExtension(extension)

        const postInteractionData =
            SettlementPostInteractionData.fromExtension(extension)

        const deadline = makerTraits.expiration()

        const orderExpirationDelay =
            deadline === null
                ? undefined
                : deadline - auctionDetails.startTime - auctionDetails.duration

        return new FusionOrder(
            new EvmAddress(settlementContract),
            {
                // shift because of how LimitOrder.buildSalt works
                salt: BigInt(order.salt) >> 160n,
                maker: EvmAddress.fromString(order.maker),
                receiver: new Uint256(BigInt(order.receiver)),
                makerAsset: EvmAddress.fromString(order.makerAsset),
                takerAsset: EvmAddress.fromString(order.takerAsset),
                makingAmount: BigInt(order.makingAmount),
                takingAmount: BigInt(order.takingAmount)
            },
            auctionDetails,
            postInteractionData,
            {
                allowMultipleFills: makerTraits.isMultipleFillsAllowed(),
                allowPartialFills: makerTraits.isPartialFillAllowed(),
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

    public getOrderHash(chainId: number): string {
        return this.inner.getOrderHash(chainId)
    }

    public getTypedData(chainId: number): EIP712TypedData {
        return this.inner.getTypedData(chainId)
    }

    public getCalculator(): AuctionCalculator {
        return AuctionCalculator.fromAuctionData(
            this.fusionExtension.postInteractionData,
            this.fusionExtension.auctionDetails
        )
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
        blockBaseFee = 0n
    ): bigint {
        const takingAmount = calcTakingAmount(
            makingAmount,
            this.makingAmount,
            this.takingAmount
        )

        const calculator = this.getCalculator()

        const bump = calculator.calcRateBump(time, blockBaseFee)

        return calculator.calcAuctionTakingAmount(takingAmount, bump)
    }

    /**
     * Check whether address allowed to execute order at the given time
     *
     * @param executor address of executor
     * @param executionTime timestamp in sec at which order planning to execute
     */
    public canExecuteAt(executor: Address, executionTime: bigint): boolean {
        return this.fusionExtension.postInteractionData.canExecuteAt(
            executor,
            executionTime
        )
    }

    /**
     * Check is order expired at a given time
     *
     * @param time timestamp in seconds
     */
    public isExpiredAt(time: bigint): boolean {
        return time > this.deadline
    }

    /**
     * Check if `wallet` can fill order before other
     */
    public isExclusiveResolver(wallet: Address): boolean {
        return this.fusionExtension.postInteractionData.isExclusiveResolver(
            wallet
        )
    }

    /**
     * Check if the auction has exclusive resolver, and it is in the exclusivity period
     */
    public isExclusivityPeriod(time = now()): boolean {
        return this.fusionExtension.postInteractionData.isExclusivityPeriod(
            time
        )
    }
}
