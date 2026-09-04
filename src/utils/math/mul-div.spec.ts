import {mulDiv, Rounding} from './mul-div.js'

describe('mulDiv', () => {
    it('floors by default', () => {
        expect(mulDiv(5n, 3n, 2n)).toBe(7n)
        expect(mulDiv(5n, 3n, 2n, Rounding.Floor)).toBe(7n)
    })

    it('ceils when there is a remainder', () => {
        expect(mulDiv(5n, 3n, 2n, Rounding.Ceil)).toBe(8n)
    })

    it('does not add one when the product divides evenly', () => {
        expect(mulDiv(4n, 3n, 2n, Rounding.Ceil)).toBe(6n)
    })
})
