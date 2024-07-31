import {uint8ArrayToHex} from '@1inch/byte-utils'

export abstract class Key {
    constructor(protected readonly key: Uint8Array) {}

    public toString(): string {
        return uint8ArrayToHex(this.key)
    }

    public toJSON(): string {
        return this.toString()
    }
}
