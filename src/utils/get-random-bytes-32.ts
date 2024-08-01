import {randomBytes} from 'ethers'

export function getRandomBytes32(): string {
    return [...randomBytes(32)].map((_, i) => String.fromCharCode(i)).join('')
}
