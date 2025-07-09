import {UINT_64_MAX} from '@1inch/byte-utils'
import assert from 'assert'
import {assertUInteger} from '../../utils/validation'

export class ResolverCancellationConfig {
    public static BASE_1E3 = 1000n

    static readonly ZERO = new ResolverCancellationConfig(0n, 0)

    static readonly ALMOST_ZERO = new ResolverCancellationConfig(1n, 1)

    constructor(
        public readonly maxCancellationPremium: bigint,
        public readonly cancellationAuctionDuration: number
    ) {
        assertUInteger(cancellationAuctionDuration)
        assertUInteger(maxCancellationPremium, UINT_64_MAX)

        if (
            maxCancellationPremium === 0n ||
            cancellationAuctionDuration === 0
        ) {
            assert(
                maxCancellationPremium === 0n &&
                    cancellationAuctionDuration === 0,
                'inconsistent cancellation config'
            )
        }
    }

    static disableResolverCancellation(): ResolverCancellationConfig {
        return ResolverCancellationConfig.ZERO
    }

    public isZero(): boolean {
        return this.maxCancellationPremium === 0n
    }
}
