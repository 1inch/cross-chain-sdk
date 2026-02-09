import {BaseProgram} from './base-program.js'
import {SolanaAddress} from '../../domains/addresses/index.js'
import {getPda} from '../../utils/index.js'

export class WhitelistContract extends BaseProgram {
    static DEFAULT = new WhitelistContract(
        new SolanaAddress('CShaLBTQn6xbwq9behWTZuDuYY7APeWvXchsHkTw3DcZ')
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
