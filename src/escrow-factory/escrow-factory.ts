import {Address} from '@1inch/fusion-sdk'
import {getCreate2Address, keccak256} from 'ethers'
import {getBytesCount, isHexBytes, trim0x} from '@1inch/byte-utils'
import assert from 'assert'
import {Immutables} from '../immutables'
import {DstImmutablesComplement} from '../immutables/dst-immutables-complement'

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
         * Address of escrow implementation at the same chain as `this.address`
         */
        implementationAddress: Address
    ): Address {
        return this.getEscrowAddress(
            srcImmutables
                .withComplement(complement)
                .withDeployedAt(blockTime)
                .hash(),
            implementationAddress
        )
    }
}
