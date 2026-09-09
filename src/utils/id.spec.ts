import {id} from './id.js'

describe('id', () => {
    it('returns a non-negative integer', () => {
        const value = id()

        expect(Number.isInteger(value)).toBe(true)
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThan(2 ** 32)
    })
})
