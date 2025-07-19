import {add0x, UINT_160_MAX} from '@1inch/byte-utils'
import {hexlify} from 'ethers'
import assert from 'assert'

/**
 * Contains highest bits of address (>UINT_160_MAX) if address is bigger than UINT_160_MAX
 *
 * @see SolanaAddress.splitToParts
 */
export class AddressComplement {
    static ZERO = new AddressComplement(0n)

    constructor(public inner: bigint) {
        assert(inner <= UINT_160_MAX)
    }

    public asHex(): string {
        return hexlify(add0x(this.inner.toString(16)))
    }

    public isZero(): boolean {
        return this.inner == 0n
    }
}
