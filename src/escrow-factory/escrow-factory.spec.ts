import {Address} from '@1inch/fusion-sdk'
import {keccak256} from 'ethers'
import {EscrowFactory} from './escrow-factory'

describe('EscrowFactory', () => {
    it('Should correct calc src/dst address', () => {
        const factory = new EscrowFactory(Address.fromBigInt(1n))
        const immutablesHash = keccak256('0x')
        const srcImplAddress = Address.fromBigInt(1n)
        const dstImplAddress = Address.fromBigInt(2n)
        const srcAddress = factory.getEscrowAddress(
            immutablesHash,
            srcImplAddress
        )
        const dstAddress = factory.getEscrowAddress(
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
})
