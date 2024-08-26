import {keccak256, solidityPackedKeccak256} from 'ethers'
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
        assert(
            isHexBytes(secret) && getBytesCount(secret) === 32n,
            'secret length must be 32 bytes hex encoded'
        )

        return keccak256(secret)
    }

    public static getMerkleLeaves(secrets: string[]): MerkleLeaf[] {
        return HashLock.getMerkleLeavesFromSecretHashes(
            secrets.map(HashLock.hashSecret)
        )
    }

    public static getMerkleLeavesFromSecretHashes(
        secretHashes: string[]
    ): MerkleLeaf[] {
        return secretHashes.map(
            (s, idx) =>
                solidityPackedKeccak256(
                    ['uint64', 'bytes32'],
                    [idx, s]
                ) as MerkleLeaf
        )
    }

    public static getProof(leaves: string[], idx: number): MerkleLeaf[] {
        return SimpleMerkleTree.of(leaves).getProof(idx) as MerkleLeaf[]
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
        assert(
            leaves.length > 2,
            'leaves array must be greater than 2. Or use HashLock.forSingleFill'
        )
        const root = SimpleMerkleTree.of(leaves).root
        const rootWithCount = BN.fromHex(root).setMask(
            new BitMask(240n, 256n),
            BigInt(leaves.length - 1)
        )

        return new HashLock(rootWithCount.toHex(64))
    }

    /**
     * Only use if HashLockInfo is for multiple fill order
     * Otherwise garbage will be returned
     *
     */
    public getPartsCount(): bigint {
        return new BN(BigInt(this.value)).getMask(new BitMask(240n, 256n)).value
    }

    public toString(): string {
        return this.value
    }

    public eq(other: HashLock): boolean {
        return this.value === other.value
    }
}

export type MerkleLeaf = string & {_tag: 'MerkleLeaf'}
