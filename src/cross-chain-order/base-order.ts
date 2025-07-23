import {AuctionCalculator, calcTakingAmount} from '@1inch/fusion-sdk'
import assert from 'assert'
import {now} from '../utils'
import {NetworkEnum, SupportedChain} from '../chains'
import {HashLock} from '../domains/hash-lock'
import {Immutables} from '../domains/immutables'
import {TimeLocks} from '../domains/time-locks'
import {AddressLike} from '../domains/addresses'

export abstract class BaseOrder<
    TSrcAddress extends AddressLike,
    TJSON,
    TDstAddress extends AddressLike = AddressLike
> {
    public abstract get hashLock(): HashLock

    public abstract get timeLocks(): TimeLocks

    public abstract get srcSafetyDeposit(): bigint

    public abstract get dstSafetyDeposit(): bigint

    public abstract get dstChainId(): NetworkEnum

    public abstract get maker(): TSrcAddress

    public abstract get takerAsset(): TDstAddress

    public abstract get makerAsset(): TSrcAddress

    public abstract get takingAmount(): bigint

    public abstract get makingAmount(): bigint

    /**
     * If zero address, then maker will receive funds
     */
    public abstract get receiver(): TDstAddress

    /**
     * Timestamp in sec
     */
    public abstract get deadline(): bigint

    /**
     * Timestamp in sec
     */
    public abstract get auctionStartTime(): bigint

    /**
     * Timestamp in sec
     */
    public abstract get auctionEndTime(): bigint

    public abstract get partialFillAllowed(): boolean

    public abstract get multipleFillsAllowed(): boolean

    /**
     * Calculate expiration delay from deadline and auction times
     */
    static calcExpirationDelay(
        /**
         * Order deadline
         */
        deadline: bigint,
        /**
         * Auction start time
         */
        startTime: bigint,
        /**
         * Auction duration
         */
        duration: bigint
    ): bigint {
        return deadline - startTime - duration
    }

    /**
     * @param srcChainId
     * @param taker executor of tx (signer or msg.sender)
     * @param amount making amount (make sure same amount passed to contract)
     * @param hashLock leaf of a merkle tree for multiple fill
     */
    public toSrcImmutables(
        srcChainId: SupportedChain,
        taker: TSrcAddress,
        amount: bigint,
        hashLock = this.hashLock
    ): Immutables<TSrcAddress> {
        const isPartialFill = amount !== this.makingAmount
        const isHashRoot = hashLock.eq(this.hashLock)

        if (isPartialFill && isHashRoot) {
            throw new Error(
                'Provide leaf of merkle tree as HashLock for partial fill'
            )
        }

        return Immutables.new({
            hashLock,
            safetyDeposit: this.srcSafetyDeposit,
            taker,
            maker: this.maker,
            orderHash: this.getOrderHashBuffer(srcChainId),
            amount,
            timeLocks: this.timeLocks,
            token: this.makerAsset
        })
    }

    public getMultipleFillIdx(
        fillAmount: bigint,
        remainingAmount = this.makingAmount
    ): number {
        assert(this.multipleFillsAllowed, 'Multiple fills disabled for order')
        const partsCount = this.hashLock.getPartsCount()

        const calculatedIndex =
            ((this.makingAmount - remainingAmount + fillAmount - 1n) *
                partsCount) /
            this.makingAmount

        if (remainingAmount === fillAmount) {
            return Number(calculatedIndex + 1n)
        }

        return Number(calculatedIndex)
    }

    /**
     * Check is order expired at a given time
     *
     * @param time timestamp in seconds
     */
    public isExpiredAt(time = now()): boolean {
        return time >= this.deadline
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

    public abstract toJSON(): TJSON

    public abstract getOrderHash(srcChainId: number): string

    public abstract getOrderHashBuffer(srcChainId: number): Buffer

    public abstract getCalculator(): AuctionCalculator
}
