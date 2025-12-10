import {Interface} from 'ethers'
import {EvmAddress} from '../addresses/index.js'
import {ESCROW_FACTORY_ABI} from '../../abi/escrow-factory-abi.js'

const iface = new Interface(ESCROW_FACTORY_ABI)

export class DstEscrowCreatedEvent {
    static readonly TOPIC =
        '0xbfd5e2039d3537cb8378a5ba1d9a6170f92307d49369f6fadd6b2ee64ca254a7'

    constructor(
        public readonly escrow: EvmAddress,
        public readonly hashlock: string,
        public readonly taker: EvmAddress
    ) {}

    /**
     * @throws Error if the log data is invalid
     */
    static fromData(data: string): DstEscrowCreatedEvent {
        const decoded = iface.decodeEventLog('DstEscrowCreated', data, [
            DstEscrowCreatedEvent.TOPIC
        ])

        return new DstEscrowCreatedEvent(
            EvmAddress.fromString(decoded.escrow),
            decoded.hashlock,
            EvmAddress.fromString(decoded.taker)
        )
    }
}
