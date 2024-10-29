import {Address, Interaction} from '@1inch/fusion-sdk'
import {AbiCoder, getCreate2Address, keccak256} from 'ethers'
import {add0x, getBytesCount, isHexBytes, trim0x} from '@1inch/byte-utils'
import assert from 'assert'
import {Immutables, DstImmutablesComplement} from '../immutables'
import {MerkleLeaf} from '../cross-chain-order/hash-lock/hash-lock'

export class EscrowFactory {
    constructor(public readonly address: Address) {}

    /**
     * See https://github.com/1inch/cross-chain-swap/blob/03d99b9604d8f7a5a396720fbe1059f7d94db762/contracts/libraries/ProxyHashLib.sol#L14
     */
    private static calcProxyBytecodeHash(impl: Address): string {
        return keccak256(
            `0x3d602d80600a3d3981f3363d3d373d3d3d363d73${trim0x(impl.toString())}5af43d82803e903d91602b57fd5bf3`
        )
    }

    /**
     * Calculate address of escrow contract in ZkSync Era
     *
     * @return escrow address at same the chain as `this.address`
     */
    public getZkEscrowAddress(
        /**
         * @see Immutables.hash
         */
        immutablesHash: string,
        /**
         * Address of escrow implementation at the same chain as `this.address`
         */
        implementationAddress: Address
    ): Address {
        assert(
            isHexBytes(immutablesHash) && getBytesCount(immutablesHash) === 32n,
            'invalid hash'
        )

        const bytecodeHash = EscrowFactory.calcProxyBytecodeHash(
            implementationAddress
        )
        const srcInputHash = keccak256(implementationAddress.toString())
        const create2Prefix =
            '0x2020dba91b30cc0006188af794c2fb30dd8520db7e2c088b7fc7c103c00ca494'

        const concatenatedData = `${create2Prefix}${trim0x(this.address.toString())}${trim0x(immutablesHash)}${trim0x(bytecodeHash)}${trim0x(srcInputHash)}`

        return new Address(add0x(keccak256(concatenatedData).slice(-40)))
    }

    /**
     * Calculates source escrow address for given params
     *
     * Make sure you call it on source chain escrow factory
     */
    public getZkSrcEscrowAddress(
        /**
         * From `SrcEscrowCreated` event (with correct timeLock.deployedAt)
         */
        srcImmutables: Immutables,
        /**
         * Address of escrow implementation at the same chain as `this.address`
         */
        implementationAddress: Address
    ): Address {
        return this.getZkEscrowAddress(
            srcImmutables.hash(),
            implementationAddress
        )
    }

    /**
     * Calculates destination escrow address for given params
     *
     * Make sure you call it on destination chain escrow factory
     */
    public getZkDstEscrowAddress(
        /**
         * From `SrcEscrowCreated` event
         */
        srcImmutables: Immutables,
        /**
         * From `SrcEscrowCreated` event
         */
        complement: DstImmutablesComplement,
        /**
         * Block time when event `DstEscrowCreated` produced
         */
        blockTime: bigint,
        /**
         * Taker from `DstEscrowCreated` event
         */
        taker: Address,
        /**
         * Address of escrow implementation at the same chain as `this.address`
         */
        implementationAddress: Address
    ): Address {
        return this.getEscrowAddress(
            srcImmutables
                .withComplement(complement)
                .withTaker(taker)
                .withDeployedAt(blockTime)
                .hash(),
            implementationAddress
        )
    }

    /**
     * Calculate address of escrow contract
     *
     * @return escrow address at same the chain as `this.address`
     */
    public getEscrowAddress(
        /**
         * @see Immutables.hash
         */
        immutablesHash: string,
        /**
         * Address of escrow implementation at the same chain as `this.address`
         */
        implementationAddress: Address
    ): Address {
        assert(
            isHexBytes(immutablesHash) && getBytesCount(immutablesHash) === 32n,
            'invalid hash'
        )

        return new Address(
            getCreate2Address(
                this.address.toString(),
                immutablesHash,
                EscrowFactory.calcProxyBytecodeHash(implementationAddress)
            )
        )
    }

    /**
     * Calculates source escrow address for given params
     *
     * Make sure you call it on source chain escrow factory
     */
    public getSrcEscrowAddress(
        /**
         * From `SrcEscrowCreated` event (with correct timeLock.deployedAt)
         */
        srcImmutables: Immutables,
        /**
         * Address of escrow implementation at the same chain as `this.address`
         */
        implementationAddress: Address
    ): Address {
        return this.getEscrowAddress(
            srcImmutables.hash(),
            implementationAddress
        )
    }

    /**
     * Calculates destination escrow address for given params
     *
     * Make sure you call it on destination chain escrow factory
     */
    public getDstEscrowAddress(
        /**
         * From `SrcEscrowCreated` event
         */
        srcImmutables: Immutables,
        /**
         * From `SrcEscrowCreated` event
         */
        complement: DstImmutablesComplement,
        /**
         * Block time when event `DstEscrowCreated` produced
         */
        blockTime: bigint,
        /**
         * Taker from `DstEscrowCreated` event
         */
        taker: Address,
        /**
         * Address of escrow implementation at the same chain as `this.address`
         */
        implementationAddress: Address
    ): Address {
        return this.getEscrowAddress(
            srcImmutables
                .withComplement(complement)
                .withTaker(taker)
                .withDeployedAt(blockTime)
                .hash(),
            implementationAddress
        )
    }

    public getMultipleFillInteraction(
        proof: MerkleLeaf[],
        idx: number,
        secretHash: string
    ): Interaction {
        const data = AbiCoder.defaultAbiCoder().encode(
            [
                `(
                        bytes32[] proof,
                        uint256 idx,
                        bytes32 secretHash,
                    )`
            ],
            [{proof, idx, secretHash}]
        )

        const dataNoOffset = add0x(data.slice(66))

        return new Interaction(this.address, dataNoOffset)
    }
}
