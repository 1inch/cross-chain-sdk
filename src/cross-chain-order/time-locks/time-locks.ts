import {BitMask, BN, UINT_32_MAX} from '@1inch/byte-utils'
import assert from 'assert'
import {SrcTimeLocks} from './src-time-locks'
import {DstTimeLocks} from './dst-time-locks'

/**
 * Contains the duration of each stage of swap for source and destination chain
 *
 * Source chain intervals layout
 * | finality lock | private withdrawal | public withdrawal | private cancellation | public cancellation |
 * ^deployedAt
 *
 * Destination chain intervals layout
 * | finality lock | private withdrawal | public withdrawal | private cancellation |
 * ^deployedAt
 *
 * @see SrcTimeLocks
 * @see DstTimeLocks
 */
export class TimeLocks {
    static DEFAULT_RESCUE_DELAY = 604800n // 7 days

    static Web3Type = 'uint256'

    protected constructor(
        public readonly deployedAt: bigint,
        private readonly _srcWithdrawal: bigint,
        private readonly _srcPublicWithdrawal: bigint,
        private readonly _srcCancellation: bigint,
        private readonly _srcPublicCancellation: bigint,
        private readonly _dstWithdrawal: bigint,
        private readonly _dstPublicWithdrawal: bigint,
        private readonly _dstCancellation: bigint
    ) {
        assert(
            deployedAt <= UINT_32_MAX,
            'deployedAt can not be > uint32 max value'
        )

        assert(
            _srcWithdrawal <= UINT_32_MAX,
            'srcWithdrawal can not be > uint32 max value'
        )
        assert(
            _srcWithdrawal < _srcPublicWithdrawal,
            'srcWithdrawal can not be >= srcPublicWithdrawal'
        )

        assert(
            _srcPublicWithdrawal <= UINT_32_MAX,
            'srcPublicWithdrawal can not be > uint32 max value'
        )
        assert(
            _srcPublicWithdrawal < _srcCancellation,
            'srcPublicWithdrawal can not be >= srcCancellation'
        )

        assert(
            _srcCancellation <= UINT_32_MAX,
            'srcCancellation can not be > uint32 max value'
        )
        assert(
            _srcCancellation < _srcPublicCancellation,
            'srcCancellation can not be >= srcPublicCancellation'
        )

        assert(
            _srcPublicCancellation <= UINT_32_MAX,
            'srcPublicCancellation can not be > uint32 max value'
        )

        assert(
            _dstWithdrawal <= UINT_32_MAX,
            'dstWithdrawal can not be > uint32 max value'
        )
        assert(
            _dstWithdrawal < _dstPublicWithdrawal,
            'dstWithdrawal can not be >= dstPublicWithdrawal'
        )

        assert(
            _dstPublicWithdrawal <= UINT_32_MAX,
            'dstPublicWithdrawal can not be > uint32 max value'
        )
        assert(
            _dstPublicWithdrawal < _dstCancellation,
            'dstPublicWithdrawal can not be >= dstCancellation'
        )

        assert(
            _dstCancellation <= UINT_32_MAX,
            'dstCancellation can not be > uint32 max value'
        )
    }

    public static new(params: {
        /**
         * Network: Source
         * Delay from `deployedAt` at which ends `finality lock` and starts `private withdrawal` */
        srcWithdrawal: bigint
        /**
         * Network: Source
         * Delay from `deployedAt` at which ends `private withdrawal` and starts `public withdrawal` */
        srcPublicWithdrawal: bigint
        /**
         * Network: Source
         * Delay from `deployedAt` at which ends `public withdrawal` and starts `private cancellation` */
        srcCancellation: bigint
        /**
         * Network: Source
         * Delay from `deployedAt` at which ends `private cancellation` and starts `public cancellation` */
        srcPublicCancellation: bigint
        /**
         * Network: Destination
         * Delay from `deployedAt` at which ends `finality lock` and starts `private withdrawal` */
        dstWithdrawal: bigint
        /**
         * Network: Destination
         * Delay from `deployedAt` at which ends `private withdrawal` and starts `public withdrawal` */
        dstPublicWithdrawal: bigint
        /**
         * Network: Destination
         * Delay from `deployedAt` at which ends `public withdrawal` and starts `private cancellation` */
        dstCancellation: bigint
    }): TimeLocks {
        return new TimeLocks(
            0n,
            params.srcWithdrawal,
            params.srcPublicWithdrawal,
            params.srcCancellation,
            params.srcPublicCancellation,
            params.dstWithdrawal,
            params.dstPublicWithdrawal,
            params.dstCancellation
        )
    }

    public static fromBigInt(val: bigint): TimeLocks {
        const valBN = new BN(val)

        const params = Array.from({length: 8}).map((_, i) => {
            return valBN.getMask(
                new BitMask(BigInt(i) * 32n, BigInt(i + 1) * 32n)
            ).value
        }) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] // ts cannot infer that we have exactly 8 elements in the array after map

        return new TimeLocks(...params)
    }

    public build(): bigint {
        return [
            this.deployedAt,
            this._srcWithdrawal,
            this._srcPublicWithdrawal,
            this._srcCancellation,
            this._srcPublicCancellation,
            this._dstWithdrawal,
            this._dstPublicWithdrawal,
            this._dstCancellation
        ].reduceRight((acc, el) => (acc << 32n) | el)
    }

    public toSrcTimeLocks(deployedAt = this.deployedAt): SrcTimeLocks {
        return SrcTimeLocks.new({
            deployedAt,
            withdrawal: this._srcWithdrawal,
            publicWithdrawal: this._srcPublicWithdrawal,
            cancellation: this._srcCancellation,
            publicCancellation: this._srcPublicCancellation
        })
    }

    public toDstTimeLocks(deployedAt = this.deployedAt): DstTimeLocks {
        return DstTimeLocks.new({
            deployedAt,
            withdrawal: this._dstWithdrawal,
            publicWithdrawal: this._dstPublicWithdrawal,
            cancellation: this._dstCancellation
        })
    }
}
