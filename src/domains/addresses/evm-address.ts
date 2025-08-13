import {isAddress} from 'ethers'
import {Address} from '@1inch/fusion-sdk'
import {Buffer} from 'buffer'
import {AddressLike, HexString} from './types.js'
import {AddressComplement} from './address-complement.js'
import {isBigintString} from '../../utils/numbers/is-bigint-string.js'
import {bufferFromHex} from '../../utils/bytes.js'

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

    static fromBuffer(address: Buffer): EvmAddress {
        const hex =
            '0x' +
            address
                .toString('hex')
                .substring(address.length * 2 - 40, address.length * 2)

        return new EvmAddress(new Address(hex))
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
        return bufferFromHex(this.toString())
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

    public toJSON(): string {
        return this.inner.toString()
    }

    public splitToParts(): [AddressComplement, EvmAddress] {
        return [AddressComplement.ZERO, this]
    }
}
