import {Address} from '@1inch/fusion-sdk'
import {AbiCoder, concat, keccak256} from 'ethers'
import {add0x, getBytesCount, isHexBytes, trim0x} from '@1inch/byte-utils'
import assert from 'assert'
import {EscrowFactory} from './escrow-factory'

export class EscrowFactoryZksync extends EscrowFactory {
    private static create2Prefix =
        '0x2020dba91b30cc0006188af794c2fb30dd8520db7e2c088b7fc7c103c00ca494'

    /**
     * ZkSync proxy bytecode do not depends on implementation address
     *
     * @see proxy example - https://explorer.zksync.io/address/0xd5317Ded4FBb98526AdD35A15d63cFBFB929efc7
     */
    private static minimalProxyBytecodeHash =
        '0x01000035492ceb24a47d861a8fd7e65b117f2eb5bf6453e191ba770c70ca7f43'

    /**
     * Calculate address of escrow contract in ZkSync Era
     *
     * @return escrow address at same the chain as `this.address`
     */
    public override getEscrowAddress(
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

        const inputHash = keccak256(
            AbiCoder.defaultAbiCoder().encode(
                ['address'],
                [implementationAddress.toString()]
            )
        )

        const concatenatedData = concat([
            EscrowFactoryZksync.create2Prefix,
            add0x(trim0x(this.address.toString()).padStart(64, '0')),
            immutablesHash,
            EscrowFactoryZksync.minimalProxyBytecodeHash,
            inputHash
        ])

        return new Address(add0x(keccak256(concatenatedData).slice(-40)))
    }
}
