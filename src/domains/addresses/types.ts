import {AddressComplement} from './address-complement.js'
import {EvmAddress} from './evm-address.js'

export type HexString = `0x${string}`

export type AddressLike = {
    toString(): string
    nativeAsZero(): AddressLike
    zeroAsNative(): AddressLike
    toBuffer(): Buffer
    toHex(): HexString
    equal(other: AddressLike): boolean
    isNative(): boolean
    isZero(): boolean
    toBigint(): bigint
    /**
     * Split the address into 2 parts
     * Second parts is 20 bytes as valid evm address
     * First bytes is rest bytes with length equal to `TotalBytes - 20`
     */
    splitToParts(): [AddressComplement, EvmAddress]
}
