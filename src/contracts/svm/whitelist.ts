import {SolanaAddress} from '../../domains/addresses'

export class WhitelistContract {
    static DEFAULT = new WhitelistContract(
        new SolanaAddress('CShaLBTQn6xbwq9behWTZuDuYY7APeWvXchsHkTw3DcZ')
    )

    constructor(public readonly programId: SolanaAddress) {}
}
