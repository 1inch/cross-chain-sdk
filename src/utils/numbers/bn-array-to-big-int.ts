import {BN} from '@coral-xyz/anchor'
import {FixedLengthArray} from '../../type-utils.js'

export function bnArrayToBigInt(arr: FixedLengthArray<BN, 4>): bigint {
    const hex =
        '0x' +
        arr
            .reverse()
            .map((bn) => bn.toString(16).padStart(16, '0'))
            .join('')

    return BigInt(hex)
}
