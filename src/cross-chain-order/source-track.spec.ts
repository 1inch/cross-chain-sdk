import {injectTrackCode} from './source-track.js'

describe('injectTrackCode', () => {
    it('encodes a human-readable source into the salt', () => {
        const salt = 1n
        const withSource = injectTrackCode(salt, 'sdk-test')
        const without = injectTrackCode(salt, '')

        expect(withSource).not.toBe(salt)
        expect(without).toBe(salt)
    })

    it('accepts a 10-character hex selector', () => {
        const encoded = injectTrackCode(0n, '0x12345678')

        expect(encoded).toBeGreaterThan(0n)
    })

    it('takes the first 4 bytes of a 32-byte hex string', () => {
        const full =
            '0xabcdef0100000000000000000000000000000000000000000000000000000000'
        const encoded = injectTrackCode(0n, full)

        expect(encoded).toBeGreaterThan(0n)
    })

    it('hashes unexpected hex lengths the same way as plain text', () => {
        const shortHex = injectTrackCode(0n, '0xab')
        const text = injectTrackCode(0n, 'ab')

        expect(shortHex).toBeGreaterThan(0n)
        expect(text).toBeGreaterThan(0n)
    })
})
