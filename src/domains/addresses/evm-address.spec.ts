import {EvmAddress} from './evm-address.js'

describe('EvmAddress', () => {
    it('Should create from buffer', () => {
        const address = EvmAddress.fromBigInt(0xdeadbeefn)

        expect(EvmAddress.fromBuffer(address.toBuffer()).toString()).toBe(
            '0x00000000000000000000000000000000deadbeef'
        )
    })
})
