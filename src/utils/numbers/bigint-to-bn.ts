import {BN} from './bn.js'

export function bigintToBN(value: bigint): BN {
    return new BN(value.toString())
}
