import * as ecies25519 from 'ecies-25519'
import {hexToUint8Array, uint8ArrayToHex} from '@1inch/byte-utils'
import {toUtf8Bytes} from 'ethers'
import {Key} from './key'

export class PublicKey extends Key {
    public static fromHexString(hex: string): PublicKey {
        return new PublicKey(hexToUint8Array(hex))
    }

    /**
     * Encrypt text with PublicKey using ecies-25519
     * @param text utf-8 string
     *
     * @returns encrypted text encoded as hex
     */
    public async encrypt(text: string): Promise<string> {
        const bytes = toUtf8Bytes(text)
        const encrypted = await ecies25519.encrypt(bytes, this.key)

        return uint8ArrayToHex(encrypted)
    }
}
