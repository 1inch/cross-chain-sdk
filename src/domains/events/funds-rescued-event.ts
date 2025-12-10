import {Interface} from 'ethers'
import {EvmAddress} from '../addresses/index.js'
import {ESCROW_FACTORY_ABI} from '../../abi/escrow-factory-abi.js'

const iface = new Interface(ESCROW_FACTORY_ABI)

export class FundsRescuedEvent {
    static readonly TOPIC =
        '0xc4474c2790e13695f6d2b6f1d8e164290b55370f87a542fd7711abe0a1bf40ac'

    constructor(
        public readonly token: EvmAddress,
        public readonly amount: bigint,
        public readonly escrowAddress: EvmAddress
    ) {}

    /**
     * @throws Error if the log data is invalid
     */
    static fromData(
        data: string,
        escrowAddress: EvmAddress
    ): FundsRescuedEvent {
        const decoded = iface.decodeEventLog('FundsRescued', data, [
            FundsRescuedEvent.TOPIC
        ])

        return new FundsRescuedEvent(
            EvmAddress.fromString(decoded.token),
            BigInt(decoded.amount),
            escrowAddress
        )
    }
}
