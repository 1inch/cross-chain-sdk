import {Interaction} from '@1inch/fusion-sdk'
import {EscrowFactory} from './escrow-factory'
import {EscrowFactoryZksync} from './escrow-factory-zksync'
import {EvmAddress as Address} from '../../domains/addresses'
import {DstImmutablesComplement, Immutables} from '../../domains/immutables'
import {MerkleLeaf} from '../../domains/hash-lock'
import {NetworkEnum} from '../../chains'

export class EscrowFactoryFacade implements EscrowFactory {
    private factory: EscrowFactory

    constructor(chainId: NetworkEnum, factoryAddress: Address) {
        this.factory = EscrowFactoryFacade.getFactory(chainId, factoryAddress)
    }

    get address(): Address {
        return this.factory.address
    }

    public static getFactory(
        chainId: NetworkEnum,
        factoryAddress: Address
    ): EscrowFactory {
        switch (chainId) {
            case NetworkEnum.ZKSYNC:
                return new EscrowFactoryZksync(factoryAddress)
            default:
                return new EscrowFactory(factoryAddress)
        }
    }

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
        return this.factory.getEscrowAddress(
            immutablesHash,
            implementationAddress
        )
    }

    public getSrcEscrowAddress(
        /**
         * From `SrcEscrowCreated` event (with correct timeLock.deployedAt)
         */
        srcImmutables: Immutables<Address>,
        /**
         * Address of escrow implementation at the same chain as `this.address`
         */
        implementationAddress: Address
    ): Address {
        return this.factory.getSrcEscrowAddress(
            srcImmutables,
            implementationAddress
        )
    }

    public getDstEscrowAddress(
        /**
         * From `SrcEscrowCreated` event
         */
        srcImmutables: Immutables<Address>,
        /**
         * From `SrcEscrowCreated` event
         */
        complement: DstImmutablesComplement<Address>,
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
        return this.factory.getDstEscrowAddress(
            srcImmutables,
            complement,
            blockTime,
            taker,
            implementationAddress
        )
    }

    public getMultipleFillInteraction(
        proof: MerkleLeaf[],
        idx: number,
        secretHash: string
    ): Interaction {
        return this.factory.getMultipleFillInteraction(proof, idx, secretHash)
    }
}
