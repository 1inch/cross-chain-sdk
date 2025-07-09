import {Address} from '@1inch/fusion-sdk'
import {AddressLike} from './types'

export class EvmAddress extends Address implements AddressLike {
    static readonly ZERO = new EvmAddress(Address.ZERO_ADDRESS.toString())

    static readonly NATIVE = new EvmAddress(Address.NATIVE_CURRENCY.toString())

    static fromBigInt(val: bigint): EvmAddress {
        return new EvmAddress(Address.fromBigInt(val).toString())
    }

    /**
     * @see zeroAsNative
     * @returns same address if current address is non native and zero address otherwise
     */
    public nativeAsZero(): EvmAddress {
        // because on contract side native address represent as zero address
        if (this.isNative()) {
            return EvmAddress.ZERO
        }

        return this
    }

    /**
     * @see nativeAsZero
     * @returns same address if current address is non zero and 0xee..ee otherwise
     */
    public zeroAsNative(): EvmAddress {
        // because on contract side native address represent as zero address
        if (this.isZero()) {
            return EvmAddress.NATIVE
        }

        return this
    }

    public toBuffer(): Buffer {
        return Buffer.from(this.toString().slice(2), 'hex')
    }
}
