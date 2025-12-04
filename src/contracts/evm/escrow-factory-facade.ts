import {Interaction} from '@1inch/fusion-sdk'
import {EscrowFactory} from './escrow-factory.js'
import {EvmAddress as Address} from '../../domains/addresses/index.js'
import {
    DstImmutablesComplement,
    Immutables
} from '../../domains/immutables/index.js'
import {MerkleLeaf} from '../../domains/hash-lock/index.js'
import {NetworkEnum} from '../../chains.js'

/**
 * Facade for EscrowFactory that provides a unified interface.
 */
export class EscrowFactoryFacade implements EscrowFactory {
    private readonly factory: EscrowFactory

    constructor(chainId: NetworkEnum, factoryAddress: Address) {
        this.factory = new EscrowFactory(factoryAddress)
    }

    get address(): Address {
        return this.factory.address
    }

    getEscrowAddress(
        immutablesHash: string,
        implementationAddress: Address
    ): Address {
        return this.factory.getEscrowAddress(
            immutablesHash,
            implementationAddress
        )
    }

    getSrcEscrowAddress(
        srcImmutables: Immutables<Address>,
        implementationAddress: Address
    ): Address {
        return this.factory.getSrcEscrowAddress(
            srcImmutables,
            implementationAddress
        )
    }

    getDstEscrowAddress(
        srcImmutables: Immutables<Address>,
        complement: DstImmutablesComplement<Address>,
        blockTime: bigint,
        taker: Address,
        implementationAddress: Address
    ): Address {
        return this.factory.getDstEscrowAddress(
            srcImmutables,
            complement,
            blockTime,
            taker,
            implementationAddress
        )
    }

    getMultipleFillInteraction(
        proof: MerkleLeaf[],
        idx: number,
        secretHash: string
    ): Interaction {
        return this.factory.getMultipleFillInteraction(proof, idx, secretHash)
    }
}
