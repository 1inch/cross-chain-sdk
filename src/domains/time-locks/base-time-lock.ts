import {UINT_32_MAX} from '@1inch/byte-utils'
import assert from 'assert'

export abstract class BaseTimeLock {
    static DEFAULT_RESCUE_DELAY = 604800n // 7 days

    protected constructor(public readonly deployedAt: bigint) {
        assert(deployedAt !== 0n, 'deployedAt must be > 0n')

        assert(
            deployedAt <= UINT_32_MAX,
            'deployedAt can not be > uint32 max value'
        )
    }

    public getRescueStart(
        rescueDelay = BaseTimeLock.DEFAULT_RESCUE_DELAY
    ): bigint {
        return this.deployedAt + rescueDelay
    }
}
