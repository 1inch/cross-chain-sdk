import {Address} from '@1inch/limit-order-sdk'

export type HexString = `0x${string}`

export type AddressLike = {
    nativeAsZero(): AddressLike
    zeroAsNative(): AddressLike
    toBuffer(): Buffer
    toHex(): HexString
    equal(other: AddressLike): boolean
    isNative(): boolean
    isZero(): boolean
    toBigint(): bigint
}

export function asFusionAddress<T extends AddressLike | undefined>(
    a: T
): T extends undefined ? Address | undefined : Address {
    return a as unknown as Address
}
