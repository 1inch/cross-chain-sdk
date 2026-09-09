import {UINT_32_MAX} from '@1inch/byte-utils'
import {assertUInteger} from './assert-uinteger.js'

describe('assertUInteger', () => {
    it('accepts a non-negative integer within the default max', () => {
        expect(() => assertUInteger(0)).not.toThrow()
        expect(() => assertUInteger(42n)).not.toThrow()
        expect(() => assertUInteger(UINT_32_MAX)).not.toThrow()
    })

    it('rejects a non-integer number', () => {
        expect(() => assertUInteger(1.5)).toThrow(/integer/)
    })

    it('rejects a negative value', () => {
        expect(() => assertUInteger(-1)).toThrow(/>= 0/)
        expect(() => assertUInteger(-1n)).toThrow(/>= 0/)
    })

    it('rejects a value above the max', () => {
        expect(() => assertUInteger(11, 10n)).toThrow(/<=/)
        expect(() => assertUInteger(UINT_32_MAX + 1n)).toThrow(/<=/)
    })
})
