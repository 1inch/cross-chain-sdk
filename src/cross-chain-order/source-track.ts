import {add0x, BitMask, BN, isHexString} from '@1inch/byte-utils'
import {id} from 'ethers'

const TRACK_CODE_MASK = new BitMask(224n, 256n)

function getTrackCodeForSource(source: string): bigint {
    if (!isHexString(source)) {
        return createId(source)
    }

    if (source.length === 10) {
        return BigInt(source)
    }

    if (source.length === 66) {
        return BigInt(source.substring(0, 10))
    }

    return createId(source)
}

function createId(source: string): bigint {
    return BigInt(add0x(id(source).slice(0, 10)))
}

export function injectTrackCode(
    salt: bigint,
    source: string,
    mask = TRACK_CODE_MASK
): bigint {
    const track = source ? getTrackCodeForSource(source) : 0n

    return new BN(salt).setMask(mask, track).value
}
