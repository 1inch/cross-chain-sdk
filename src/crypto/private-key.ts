import * as ecies25519 from 'ecies-25519'
import {hexToUint8Array} from '@1inch/byte-utils'
import {toUtf8String} from 'ethers'
import {Key} from './key'

export class PrivateKey extends Key {
    public static fromHexString(hex: string): PrivateKey {
        return new PrivateKey(hexToUint8Array(hex))
    }

    /**
     * Decrypt cipher with PrivateKey using ecies-25519
     * @param cipher hex string
     *
     * @returns utf-8 encoded string
     */
    public async decrypt(cipher: string): Promise<string> {
        const bytes = hexToUint8Array(cipher)
        const decrypted = await ecies25519.decrypt(bytes, this.key)

        return toUtf8String(decrypted)
    }
}
