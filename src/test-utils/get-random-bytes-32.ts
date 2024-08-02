import {randomBytes} from 'ethers'
import {uint8ArrayToHex} from '@1inch/byte-utils'

export function getRandomBytes32(): string {
    return uint8ArrayToHex(randomBytes(32))
}
