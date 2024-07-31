import * as ecies25519 from 'ecies-25519'
import {PrivateKey} from './private-key'
import {PublicKey} from './public-key'

describe('Crypto', () => {
    it('should encrypt/decrypt message with ecies-25519', async () => {
        const keyPair = ecies25519.generateKeyPair()

        const privateKey = new PrivateKey(keyPair.privateKey)
        const publicKey = new PublicKey(keyPair.publicKey)

        const message = 'hello 1inch'

        const encrypted = await publicKey.encrypt(message)
        const decrypted = await privateKey.decrypt(encrypted)
        expect(decrypted).toEqual(message)
        expect(encrypted.startsWith('0x')).toBe(true)
    })
})
