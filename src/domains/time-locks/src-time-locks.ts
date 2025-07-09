import {UINT_32_MAX} from '@1inch/byte-utils'
import {now} from '@1inch/fusion-sdk'
import assert from 'assert'
import {BaseTimeLock} from './base-time-lock'

export enum SrcStage {
    FinalityLock,
    PrivateWithdrawal,
    PublicWithdrawal,
    PrivateCancellation,
    PublicCancellation
}

/**
 * Class to access source chain related time-locks
 *
 * Intervals layout
 * | finality lock | private withdrawal | public withdrawal | private cancellation | public cancellation |
 * ^deployedAt
 */
export class SrcTimeLocks extends BaseTimeLock {
    private constructor(
        deployedAt: bigint,
        private readonly _withdrawal: bigint,
        private readonly _publicWithdrawal: bigint,
        private readonly _cancellation: bigint,
        private readonly _publicCancellation: bigint
    ) {
        super(deployedAt)
        assert(
            _withdrawal <= UINT_32_MAX,
            'withdrawal can not be > uint32 max value'
        )
        assert(
            _withdrawal < _publicWithdrawal,
            'withdrawal can not be >= publicWithdrawal'
        )

        assert(
            _publicWithdrawal <= UINT_32_MAX,
            'publicWithdrawal can not be > uint32 max value'
        )
        assert(
            _publicWithdrawal < _cancellation,
            'publicWithdrawal can not be >= cancellation'
        )

        assert(
            _cancellation <= UINT_32_MAX,
            'cancellation can not be > uint32 max value'
        )
        assert(
            _cancellation < _publicCancellation,
            'cancellation can not be >= publicCancellation'
        )

        assert(
            _publicCancellation <= UINT_32_MAX,
            'publicCancellation can not be > uint32 max value'
        )

        // technically it is valid for smart-contract, but delay as big as timestamp make no sense in terms of user order
        assert(
            deployedAt > _withdrawal,
            `deployedAt timestamp can not be less than withdrawal delay,` +
                `deployedAt: ${deployedAt}, withdrawal: ${_withdrawal}`
        )
        assert(
            deployedAt > _publicWithdrawal,
            `deployedAt timestamp can not be less than publicWithdrawal delay,` +
                `deployedAt: ${deployedAt}, publicWithdrawal: ${_publicWithdrawal}`
        )
        assert(
            deployedAt > _cancellation,
            `deployedAt timestamp can not be less than cancellation delay,` +
                `deployedAt: ${deployedAt}, cancellation: ${_cancellation}`
        )
        assert(
            deployedAt > _publicCancellation,
            `deployedAt timestamp can not be less than publicCancellation delay,` +
                `deployedAt: ${deployedAt}, publicCancellation: ${_publicCancellation}`
        )
    }

    /** Timestamp at which ends `finality lock` and starts `private withdrawal` */
    public get privateWithdrawal(): bigint {
        return this.deployedAt + this._withdrawal
    }

    /** Timestamp at which ends `private withdrawal` and starts `public withdrawal` */
    public get publicWithdrawal(): bigint {
        return this.deployedAt + this._publicWithdrawal
    }

    /** Timestamp at which ends `public withdrawal` and starts `private cancellation` */
    public get privateCancellation(): bigint {
        return this.deployedAt + this._cancellation
    }

    /** Timestamp at which ends `private cancellation` and starts `public cancellation` */
    public get publicCancellation(): bigint {
        return this.deployedAt + this._publicCancellation
    }

    public static new(params: {
        /** Escrow deploy timestamp */
        deployedAt: bigint
        /** Delay from `deployedAt` at which ends `finality lock` and starts `private withdrawal` */
        withdrawal: bigint
        /** Delay from `deployedAt` at which ends `private withdrawal` and starts `public withdrawal` */
        publicWithdrawal: bigint
        /** Delay from `deployedAt` at which ends `public withdrawal` and starts `private cancellation` */
        cancellation: bigint
        /** Delay from `deployedAt` at which ends `private cancellation` and starts `public cancellation` */
        publicCancellation: bigint
    }): SrcTimeLocks {
        return new SrcTimeLocks(
            params.deployedAt,
            params.withdrawal,
            params.publicWithdrawal,
            params.cancellation,
            params.publicCancellation
        )
    }

    /**
     * Return true, when `time` in `finality lock` interval
     *
     * @param time default is `now()`
     */
    public isFinalityLock(time = now()): boolean {
        return time < this.privateWithdrawal
    }

    /**
     * Return true, when `time` in `private withdrawal` interval
     *
     * @param time default is `now()`
     */
    public isPrivateWithdrawal(time = now()): boolean {
        return time >= this.privateWithdrawal && time < this.publicWithdrawal
    }

    /**
     * Return true, when `time` in `public withdrawal` interval
     *
     * @param time default is `now()`
     */
    public isPublicWithdrawal(time = now()): boolean {
        return time >= this.publicWithdrawal && time < this.privateCancellation
    }

    /**
     * Return true, when `time` in `private cancellation` interval
     *
     * @param time default is `now()`
     */
    public isPrivateCancellation(time = now()): boolean {
        return (
            time >= this.privateCancellation && time < this.publicCancellation
        )
    }

    /**
     * Return true, when `time` in `public cancellation` interval
     *
     * @param time default is `now()`
     */
    public isPublicCancellation(time = now()): boolean {
        return time >= this.publicCancellation
    }

    public getStage(time = now()): SrcStage {
        if (this.isFinalityLock(time)) return SrcStage.FinalityLock

        if (this.isPrivateWithdrawal(time)) return SrcStage.PrivateWithdrawal

        if (this.isPublicWithdrawal(time)) return SrcStage.PublicWithdrawal

        if (this.isPrivateCancellation(time))
            return SrcStage.PrivateCancellation

        if (this.isPublicCancellation(time)) return SrcStage.PublicCancellation

        throw new Error('Unreachable')
    }
}
