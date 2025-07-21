import {FixedLengthArray} from '../../type-utils'

export function u24ToNumber(val: [FixedLengthArray<number, 3>]): number {
    const bytes = val[0]

    return (bytes[0] << 16) | (bytes[1] << 8) | bytes[2]
}
