import {add0x, UINT_160_MAX} from '@1inch/byte-utils'
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
        const hex = this.inner.toString(16)

        return add0x(hex.length % 2 ? '0' + hex : hex)
    }

    public isZero(): boolean {
        return this.inner == 0n
    }
}
