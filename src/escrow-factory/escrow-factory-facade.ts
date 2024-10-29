import {Address, NetworkEnum} from '@1inch/fusion-sdk'
import {EscrowFactory} from './escrow-factory'
import {DstImmutablesComplement, Immutables} from '../immutables'

export class EscrowFactoryFacade {
    private factory: EscrowFactory

    constructor(factoryAddress: Address) {
        this.factory = new EscrowFactory(factoryAddress)
    }

    public getEscrowAddressByChain(
        /**
         * chain id
         */
        chainId: NetworkEnum,
        /**
         * @see Immutables.hash
         */
        immutablesHash: string,
        /**
         * Address of escrow implementation at the same chain as `this.address`
         */
        implementationAddress: Address
    ): Address {
        switch (chainId) {
            case NetworkEnum.ZKSYNC:
                return this.factory.getZkEscrowAddress(
                    immutablesHash,
                    implementationAddress
                )
            default:
                return this.factory.getEscrowAddress(
                    immutablesHash,
                    implementationAddress
                )
        }
    }

    public getSrcEscrowAddressByChain(
        /**
         * chain id
         */
        chainId: NetworkEnum,
        /**
         * From `SrcEscrowCreated` event (with correct timeLock.deployedAt)
         */
        srcImmutables: Immutables,
        /**
         * Address of escrow implementation at the same chain as `this.address`
         */
        implementationAddress: Address
    ): Address {
        switch (chainId) {
            case NetworkEnum.ZKSYNC:
                return this.factory.getZkSrcEscrowAddress(
                    srcImmutables,
                    implementationAddress
                )
            default:
                return this.factory.getSrcEscrowAddress(
                    srcImmutables,
                    implementationAddress
                )
        }
    }

    public getDstEscrowAddressByChain(
        /**
         * chain id
         */
        chainId: NetworkEnum,
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
        switch (chainId) {
            case NetworkEnum.ZKSYNC:
                return this.factory.getZkDstEscrowAddress(
                    srcImmutables,
                    complement,
                    blockTime,
                    taker,
                    implementationAddress
                )
            default:
                return this.factory.getDstEscrowAddress(
                    srcImmutables,
                    complement,
                    blockTime,
                    taker,
                    implementationAddress
                )
        }
    }
}
