import {uint256split} from './uint256-split.js'

export function uint256BorchSerialized(val: bigint): Buffer {
    const buffer = Buffer.alloc(32)
    const limbs = uint256split(val)

    limbs.forEach((limb, i) => {
        buffer.writeBigUInt64LE(limb, i * 8)
    })

    return buffer
}
