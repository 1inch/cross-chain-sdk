import {add0x} from '@1inch/byte-utils'
import {randomBytes} from 'crypto'

export function getSecret(): string {
    return add0x(randomBytes(32).toString('hex'))
}

console.log(getSecret())
