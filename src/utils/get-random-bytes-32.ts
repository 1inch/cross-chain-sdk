import {randomBytes} from 'ethers'
import {add0x} from '@1inch/byte-utils'

export function getRandomBytes32(): string {
    return add0x(Buffer.from(randomBytes(32)).toString('hex'))
}
