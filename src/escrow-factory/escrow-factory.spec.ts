import {Address} from '@1inch/fusion-sdk'
import {keccak256} from 'ethers'
import {EscrowFactoryFacade} from './escrow-factory-facade'

describe('EscrowAddressFacade', () => {
    it('Should correct calc src/dst address for Ethereum', () => {
        const facade = new EscrowFactoryFacade(Address.fromBigInt(1n))
        const immutablesHash = keccak256('0x')
        const srcImplAddress = Address.fromBigInt(1n)
        const dstImplAddress = Address.fromBigInt(2n)

        const srcAddress = facade.getEscrowAddressByChain(
            1,
            immutablesHash,
            srcImplAddress
        )
        const dstAddress = facade.getEscrowAddressByChain(
            1,
            immutablesHash,
            dstImplAddress
        )

        expect(srcAddress).toEqual(
            new Address('0x2f8f065e797ad5499066c0e7d1f8f1c0405e3179')
        )

        expect(dstAddress).toEqual(
            new Address('0x291200ceb5fab3847c9f30c5f272961f78d6cfd4')
        )
    })

    it('Should correct calc zk src/dst address for zkSync', () => {
        const facade = new EscrowFactoryFacade(Address.fromBigInt(1n))
        const immutablesHash = keccak256('0x')
        const srcImplAddress = Address.fromBigInt(1n)
        const dstImplAddress = Address.fromBigInt(2n)

        const srcAddress = facade.getEscrowAddressByChain(
            324,
            immutablesHash,
            srcImplAddress
        )
        const dstAddress = facade.getEscrowAddressByChain(
            324,
            immutablesHash,
            dstImplAddress
        )

        expect(srcAddress).toEqual(
            new Address('0x48f33ed21a3ab24b699fc2f709266f86b0c5714e')
        )

        expect(dstAddress).toEqual(
            new Address('0x68460df9d1f08e7eaff280cb880d9be59b2143b7')
        )
    })
})
