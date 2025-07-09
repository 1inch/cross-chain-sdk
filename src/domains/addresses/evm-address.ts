import {Address} from '@1inch/limit-order-sdk'
import {isAddress} from 'ethers'
import {AddressLike, HexString} from './types'
import {isBigintString} from '../../utils/numbers/is-bigint-string'

export class EvmAddress implements AddressLike {
    static readonly ZERO = new EvmAddress(Address.ZERO_ADDRESS)

    static readonly NATIVE = new EvmAddress(Address.NATIVE_CURRENCY)

    public constructor(public readonly inner: Address) {}

    static fromBigInt(val: bigint): EvmAddress {
        return new EvmAddress(Address.fromBigInt(val))
    }

    static fromString(address: string): EvmAddress {
        return new EvmAddress(new Address(address))
    }

    static fromUnknown(address: unknown): EvmAddress {
        if (typeof address === 'string') {
            if (isAddress(address)) {
                return EvmAddress.fromString(address)
            }

            if (isBigintString(address)) {
                return EvmAddress.fromBigInt(BigInt(address))
            }
        }

        if (typeof address == 'bigint') {
            return EvmAddress.fromBigInt(address)
        }

        throw new Error(`Unknown address: ${address}`)
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

    public toHex(): HexString {
        return this.inner.toString() as HexString
    }

    public equal(other: AddressLike): boolean {
        return this.inner.toString() === other.toString()
    }

    public isNative(): boolean {
        return this.inner.isNative()
    }

    public isZero(): boolean {
        return this.inner.isZero()
    }

    public toBigint(): bigint {
        return BigInt(this.inner.toString())
    }

    public toString(): string {
        return this.inner.toString()
    }
}
