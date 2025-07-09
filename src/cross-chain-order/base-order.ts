import {AuctionCalculator} from '@1inch/fusion-sdk'
import assert from 'assert'
import {NetworkEnum, SupportedChain} from '../chains'
import {HashLock} from '../domains/hash-lock'
import {Immutables} from '../domains/immutables'
import {TimeLocks} from '../domains/time-locks'
import {AddressLike} from '../domains/addresses'

export abstract class BaseOrder<TSrcAddress extends AddressLike, TJSON> {
    public abstract get hashLock(): HashLock

    public abstract get timeLocks(): TimeLocks

    public abstract get srcSafetyDeposit(): bigint

    public abstract get dstChainId(): NetworkEnum

    public abstract get maker(): TSrcAddress

    public abstract get takerAsset(): AddressLike

    public abstract get makerAsset(): TSrcAddress

    public abstract get takingAmount(): bigint

    public abstract get makingAmount(): bigint

    /**
     * If zero address, then maker will receive funds
     */
    public abstract get receiver(): AddressLike

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

    public abstract get nonce(): bigint

    public abstract get partialFillAllowed(): boolean

    public abstract get multipleFillsAllowed(): boolean

    /**
     * @param srcChainId
     * @param taker executor of fillOrder* transaction
     * @param amount making amount (make sure same amount passed to contact fillOrder method)
     * @param hashLock leaf of a merkle tree for multiple fill
     */
    public toSrcImmutables(
        srcChainId: SupportedChain,
        taker: TSrcAddress,
        amount: bigint,
        hashLock = this.hashLock
    ): Immutables {
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
            orderHash: this.getOrderHash(srcChainId),
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

    public abstract toJSON(): TJSON

    public abstract getOrderHash(srcChainId: number): string

    public abstract getCalculator(): AuctionCalculator

    /**
     * Calculates required taking amount for passed `makingAmount` at block time `time`
     *
     * @param makingAmount maker swap amount
     * @param time execution time in sec
     * @param blockBaseFee block fee in wei.
     * */
    public abstract calcTakingAmount(
        makingAmount: bigint,
        time: bigint,
        blockBaseFee?: bigint
    ): bigint

    /**
     * Check whether address allowed to execute order at the given time
     *
     * @param executor address of executor
     * @param executionTime timestamp in sec at which order planning to execute
     */
    public abstract canExecuteAt(
        executor: TSrcAddress,
        executionTime: bigint
    ): boolean

    /**
     * Check is order expired at a given time
     *
     * @param time timestamp in seconds
     */
    public abstract isExpiredAt(time: bigint): boolean

    /**
     * Check if `wallet` can fill order before other
     */
    public abstract isExclusiveResolver(wallet: TSrcAddress): boolean

    /**
     * Check if the auction has exclusive resolver, and it is in the exclusivity period
     *
     * @param time timestamp to check
     */
    public abstract isExclusivityPeriod(time: bigint): boolean
}
