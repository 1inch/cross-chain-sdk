import {AccountMeta} from './instruction'
import {SolanaAddress} from '../../domains/addresses'

export abstract class BaseProgram {
    protected encoder = new TextEncoder()

    constructor(public readonly programId: SolanaAddress) {}

    protected optionalAccount(meta: AccountMeta, skip: boolean): AccountMeta {
        if (skip) {
            return {
                pubkey: this.programId,
                isSigner: false,
                isWritable: false
            }
        }

        return meta
    }
}
