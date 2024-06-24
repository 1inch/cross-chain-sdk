import {BitMask, BN, UINT_32_MAX} from '@1inch/byte-utils'
import assert from 'assert'

// todo check intervals and add docs
export class TimeLocks {
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
            _srcPublicWithdrawal <= UINT_32_MAX,
            'srcPublicWithdrawal can not be > uint32 max value'
        )
        assert(
            _srcCancellation <= UINT_32_MAX,
            'srcCancellation can not be > uint32 max value'
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
            _dstPublicWithdrawal <= UINT_32_MAX,
            'dstPublicWithdrawal can not be > uint32 max value'
        )
        assert(
            _dstCancellation <= UINT_32_MAX,
            'dstCancellation can not be > uint32 max value'
        )
    }

    public get srcWithdrawal(): bigint {
        return this.deployedAt + this._srcWithdrawal
    }

    public get srcPublicWithdrawal(): bigint {
        return this.deployedAt + this._srcPublicWithdrawal
    }

    public get srcCancellation(): bigint {
        return this.deployedAt + this._srcCancellation
    }

    public get srcPublicCancellation(): bigint {
        return this.deployedAt + this._srcPublicCancellation
    }

    public get dstWithdrawal(): bigint {
        return this.deployedAt + this._dstWithdrawal
    }

    public get dstPublicWithdrawal(): bigint {
        return this.deployedAt + this._dstPublicWithdrawal
    }

    public get dstCancellation(): bigint {
        return this.deployedAt + this._dstCancellation
    }

    public static new(params: {
        deployedAt: bigint
        srcWithdrawal: bigint
        srcPublicWithdrawal: bigint
        srcCancellation: bigint
        srcPublicCancellation: bigint
        dstWithdrawal: bigint
        dstPublicWithdrawal: bigint
        dstCancellation: bigint
    }): TimeLocks {
        return new TimeLocks(
            params.deployedAt,
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
}
