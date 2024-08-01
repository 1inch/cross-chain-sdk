import {id, solidityPackedKeccak256} from 'ethers'
import {SimpleMerkleTree} from '@openzeppelin/merkle-tree'
import {BitMask, BN, getBytesCount, isHexBytes} from '@1inch/byte-utils'
import assert from 'assert'

export class HashLock {
    public static Web3Type = 'bytes32'

    private readonly value: string

    protected constructor(val: string) {
        this.value = val
    }

    public static hashSecret(secret: string): string {
        assert(secret.length === 32, 'secret length must be 32')

        return id(secret)
    }

    public static getMerkleLeaves(secrets: string[]): MerkleLeaf[] {
        return secrets.map(
            (s, idx) =>
                solidityPackedKeccak256(
                    ['uint256', 'bytes32'],
                    [idx, HashLock.hashSecret(s)]
                ) as MerkleLeaf
        )
    }

    public static fromString(value: string): HashLock {
        assert(
            isHexBytes(value) && getBytesCount(value) === 32n,
            'HashLock value must be bytes32 hex encoded'
        )

        return new HashLock(value)
    }

    /**
     * Create HashLock from keccak256 hash of secret
     */
    public static forSingleFill(secret: string): HashLock {
        return new HashLock(HashLock.hashSecret(secret))
    }

    public static forMultipleFills(leaves: MerkleLeaf[]): HashLock {
        assert(leaves.length > 1, 'leaves array must be greater than 1')
        const root = SimpleMerkleTree.of(leaves).root
        const rootWithCount = BN.fromHex(root).setMask(
            new BitMask(241n, 256n),
            BigInt(leaves.length)
        )

        return new HashLock(rootWithCount.toHex(64))
    }

    public toString(): string {
        return this.value
    }

    public eq(other: HashLock): boolean {
        return this.value === other.value
    }
}

type MerkleLeaf = string & {_tag: 'MerkleLeaf'}
