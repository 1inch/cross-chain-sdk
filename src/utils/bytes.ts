import {isHexBytes} from '@1inch/byte-utils'
import assert from 'assert'

export function bufferFromHex(hex: string, bytesSize: number = -1): Buffer {
    assert(isHexBytes(hex))
    assert(
        bytesSize === -1 || hex.slice(2).length / 2 <= bytesSize,
        'cannot extend buffer'
    )

    if (bytesSize === -1) {
        return Buffer.from(hex.slice(2), 'hex')
    }

    return Buffer.from(hex.slice(2).padStart(bytesSize * 2, '0'), 'hex')
}
