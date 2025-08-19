import {uintAsBeBytes} from './uint-as-be-bytes.js'

describe('uintAsBeBytes', () => {
    it('should convert u64 to big endian buffer', () => {
        const buffer = uintAsBeBytes(0xff00cc00dd00aa00n, 64)

        expect(buffer).toEqual(Buffer.from('ff00cc00dd00aa00', 'hex'))
    })

    it('should convert u32 to big endian buffer', () => {
        const buffer = uintAsBeBytes(0xffn, 32)

        expect(buffer).toEqual(Buffer.from('000000ff', 'hex'))
    })
})
