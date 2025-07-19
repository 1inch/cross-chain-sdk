import {UINT_32_MAX} from '@1inch/byte-utils'

export function id(): number {
    return Math.floor(Math.random() * Number(UINT_32_MAX))
}
