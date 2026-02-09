import {EvmAddress} from '../addresses/index.js'

export class EscrowCancelledEvent {
    static readonly TOPIC =
        '0x6e3be9294e58d10b9c8053cfd5e09871b67e442fe394d6b0870d336b9df984a9'

    constructor(public readonly escrowAddress: EvmAddress) {}
}
