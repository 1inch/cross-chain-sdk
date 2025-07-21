import {BN} from '@coral-xyz/anchor'

export function bigintToBN(value: bigint): BN {
    return new BN(value.toString())
}
