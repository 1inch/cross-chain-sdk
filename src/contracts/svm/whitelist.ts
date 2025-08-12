import {BaseProgram} from './base-program'
import {SolanaAddress} from '../../domains/addresses'
import {getPda} from '../../utils'

export class WhitelistContract extends BaseProgram {
    static DEFAULT = new WhitelistContract(
        new SolanaAddress('5XYZ3LMWECpC6u7BWLskMMNx4xWbXF44dpDxvkVqkHtA')
    )

    constructor(programId: SolanaAddress) {
        super(programId)
    }

    public getAccessAccount(taker: SolanaAddress): SolanaAddress {
        return getPda(this.programId, [
            this.encoder.encode('resolver_access'),
            taker.toBuffer()
        ])
    }
}
