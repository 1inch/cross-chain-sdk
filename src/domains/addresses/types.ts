export type AddressLike = {
    nativeAsZero(): AddressLike
    zeroAsNative(): AddressLike
    toBuffer(): Buffer
}
