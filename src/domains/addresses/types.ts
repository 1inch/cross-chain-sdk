import {AddressComplement} from './address-complement'
import {EvmAddress} from './evm-address'

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
    /** Split the address into 2 parts
     * Second parts is 40 bytes as valid evm address
     * First bytes
     */
    splitToParts(): [AddressComplement, EvmAddress]
}
