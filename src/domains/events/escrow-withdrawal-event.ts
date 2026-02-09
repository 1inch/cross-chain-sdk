import {Interface} from 'ethers'
import {ESCROW_FACTORY_ABI} from '../../abi/escrow-factory-abi.js'

const iface = new Interface(ESCROW_FACTORY_ABI)

export class EscrowWithdrawalEvent {
    static readonly TOPIC =
        '0xe346f5c97a360db5188bfa5d3ec5f0583abde420c6ba4d08b6cfe61addc17105'

    constructor(public readonly secret: string) {}

    /**
     * @throws Error if the log data is invalid
     */
    static fromData(data: string): EscrowWithdrawalEvent {
        const decoded = iface.decodeEventLog('EscrowWithdrawal', data, [
            EscrowWithdrawalEvent.TOPIC
        ])

        return new EscrowWithdrawalEvent(decoded.secret)
    }
}
