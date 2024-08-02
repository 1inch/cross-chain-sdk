import * as ecies25519 from 'ecies-25519'
import {hexToUint8Array, uint8ArrayToHex} from '@1inch/byte-utils'
import {Key} from './key'

export class PrivateKey extends Key {
    public static fromHexString(hex: string): PrivateKey {
        return new PrivateKey(hexToUint8Array(hex))
    }

    /**
     * Decrypt cipher with PrivateKey using ecies-25519
     * @param cipher hex string
     *
     * @returns hex encoded string
     */
    public async decrypt(cipher: string): Promise<string> {
        const bytes = hexToUint8Array(cipher)
        const decrypted = await ecies25519.decrypt(bytes, this.key)

        return uint8ArrayToHex(decrypted)
    }
}
