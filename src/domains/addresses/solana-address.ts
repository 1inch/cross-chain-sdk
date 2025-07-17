import bs58 from 'bs58'
import {hexToUint8Array, uint8ArrayToHex} from '@1inch/byte-utils'
import {hexlify} from 'ethers'
import {UINT_160_MAX} from '@1inch/fusion-sdk'
import {web3} from '@coral-xyz/anchor'
import {AddressLike, HexString} from './types'
import {AddressComplement} from './address-complement'
import {EvmAddress} from './evm-address'
import {isBigintString} from '../../utils/numbers/is-bigint-string'

export class SolanaAddress implements AddressLike {
    public static ASSOCIATED_TOKE_PROGRAM_ID = new SolanaAddress(
        'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
    )

    public static TOKEN_PROGRAM_ID = new SolanaAddress(
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
    )

    public static TOKEN_2022_PROGRAM_ID = new SolanaAddress(
        'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
    )

    public static SYSTEM_PROGRAM_ID = new SolanaAddress(
        '11111111111111111111111111111111'
    )

    public static SYSVAR_RENT_ID = new SolanaAddress(
        'SysvarRent111111111111111111111111111111111'
    )

    public static ZERO = SolanaAddress.fromBigInt(0n)

    public static readonly WRAPPED_NATIVE = new SolanaAddress(
        'So11111111111111111111111111111111111111112'
    )

    public static readonly NATIVE = new SolanaAddress(
        'SoNative11111111111111111111111111111111111'
    )

    private readonly buf: Uint8Array

    constructor(value: string) {
        try {
            this.buf = bs58.decode(value)

            if (this.buf.length !== 32) {
                throw ''
            }
        } catch {
            throw new Error(`${value} is not a valid address.`)
        }
    }

    static fromString(str: string): SolanaAddress {
        return new SolanaAddress(str)
    }

    static fromUnknown(val: unknown): SolanaAddress {
        if (!val) {
            throw new Error('invalid address')
        }

        if (typeof val === 'string') {
            if (isBigintString(val)) {
                return SolanaAddress.fromBigInt(BigInt(val))
            }

            return new SolanaAddress(val)
        }

        if (typeof val === 'bigint') {
            return SolanaAddress.fromBigInt(val)
        }

        if (
            typeof val === 'object' &&
            'toBuffer' in val &&
            typeof val.toBuffer === 'function'
        ) {
            const buffer = val.toBuffer()

            if (buffer instanceof Buffer || buffer instanceof Uint8Array) {
                return SolanaAddress.fromBuffer(buffer)
            }
        }

        throw new Error('invalid address')
    }

    static fromPublicKey(publicKey: web3.PublicKey): SolanaAddress {
        return SolanaAddress.fromBuffer(publicKey.toBuffer())
    }

    static fromBuffer(buf: Buffer | Uint8Array): SolanaAddress {
        return new SolanaAddress(bs58.encode(buf))
    }

    static fromBigInt(val: bigint): SolanaAddress {
        const buffer = hexToUint8Array(
            '0x' + val.toString(16).padStart(64, '0')
        )

        return SolanaAddress.fromBuffer(buffer)
    }

    public nativeAsZero(): this {
        return this
    }

    public zeroAsNative(): this {
        return this
    }

    toString(): string {
        return bs58.encode(this.buf)
    }

    toJSON(): string {
        return this.toString()
    }

    public toBuffer(): Buffer {
        return Buffer.from(this.buf)
    }

    public equal(other: AddressLike): boolean {
        return this.toBuffer().equals(other.toBuffer())
    }

    public isNative(): boolean {
        return this.equal(SolanaAddress.NATIVE)
    }

    public isZero(): boolean {
        return this.equal(SolanaAddress.ZERO)
    }

    public toHex(): HexString {
        return hexlify(this.toBuffer()) as HexString
    }

    public toBigint(): bigint {
        return BigInt(uint8ArrayToHex(this.buf))
    }

    public splitToParts(): [AddressComplement, EvmAddress] {
        const bn = this.toBigint()

        return [
            new AddressComplement(bn >> 160n),
            EvmAddress.fromBigInt(bn & UINT_160_MAX)
        ]
    }
}
