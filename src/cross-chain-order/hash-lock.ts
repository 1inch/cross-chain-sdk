import {id} from 'ethers'
import {getBytesCount} from '@1inch/byte-utils'
import assert from 'assert'

export class HashLock {
    public static Web3Type = 'bytes32'

    private readonly value: string

    protected constructor(val: string) {
        this.value = val
    }

    /**
     * Create HashLock from keccak256 hash of secret
     */
    public static fromSecret(secret: string): HashLock {
        return new HashLock(id(secret))
    }

    public static fromString(hashLock: string): HashLock {
        assert(
            getBytesCount(hashLock) === 32n,
            'HashLock string must be result of keccak256'
        )

        return new HashLock(hashLock)
    }

    public toString(): string {
        return this.value
    }
}
