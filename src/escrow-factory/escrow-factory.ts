import {Address} from '@1inch/fusion-sdk'
import {getCreate2Address, keccak256} from 'ethers'
import {trim0x} from '@1inch/byte-utils'
import {
    ESCROW_DST_IMPLEMENTATION_ADDRESS,
    ESCROW_SRC_IMPLEMENTATION_ADDRESS
} from '../deployments'

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
     * Calculate address of source escrow contract (source chain)
     */
    public getSrcEscrowAddress(
        /**
         * @see Immutables.hash
         */
        immutablesHash: string,
        srcImplementation = ESCROW_SRC_IMPLEMENTATION_ADDRESS
    ): Address {
        return new Address(
            getCreate2Address(
                this.address.toString(),
                immutablesHash,
                EscrowFactory.calcProxyBytecodeHash(srcImplementation)
            )
        )
    }

    /**
     * Calculate address of destination escrow contract (destination chain)
     */
    public getDstEscrowAddress(
        /**
         * @see Immutables.hash
         */
        immutablesHash: string,
        dstImplementation = ESCROW_DST_IMPLEMENTATION_ADDRESS
    ): Address {
        return new Address(
            getCreate2Address(
                this.address.toString(),
                immutablesHash,
                EscrowFactory.calcProxyBytecodeHash(dstImplementation)
            )
        )
    }
}
