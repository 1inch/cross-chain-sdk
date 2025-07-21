import {isHexBytes} from '@1inch/byte-utils'
import assert from 'assert'

export function bufferFromHex(hex: string): Buffer {
    assert(isHexBytes(hex))

    return Buffer.from(hex.slice(2), 'hex')
}
