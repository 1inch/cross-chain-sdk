import {ResolverCancellationConfig} from './resolver-cancellation-config.js'

describe('ResolverCancellationConfig', () => {
    it('serializes a non-zero config and reports isZero', () => {
        const config = new ResolverCancellationConfig(1000n, 60)

        expect(config.isZero()).toBe(false)
        expect(config.toJSON()).toEqual({
            maxCancellationPremium: '1000',
            cancellationAuctionDuration: 60
        })
    })

    it('disableResolverCancellation returns the zero config', () => {
        const disabled =
            ResolverCancellationConfig.disableResolverCancellation()

        expect(disabled.isZero()).toBe(true)
        expect(disabled).toBe(ResolverCancellationConfig.ZERO)
        expect(disabled.toJSON().maxCancellationPremium).toBe('0')
    })

    it('rejects an inconsistent zero/non-zero pair', () => {
        expect(() => new ResolverCancellationConfig(1n, 0)).toThrow(
            /inconsistent/
        )
        expect(() => new ResolverCancellationConfig(0n, 10)).toThrow(
            /inconsistent/
        )
    })
})
