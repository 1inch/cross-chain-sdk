import {FixedLengthArray} from '../../type-utils'

export function u24ToNumber(val: [FixedLengthArray<number, 3>]): number {
    return parseInt('0x' + Buffer.from(val[0]).toString('hex'))
}
