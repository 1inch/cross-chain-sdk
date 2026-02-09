import {coder} from '../../utils/coder.js'
import {EvmAddress} from '../addresses/index.js'

export class DstEscrowCreatedEvent {
    static readonly TOPIC =
        '0xc30e111dcc74fddc2c3a4d98ffb97adec4485c0a687946bf5b22c2a99c7ff96d'

    constructor(
        public readonly escrow: EvmAddress,
        public readonly hashlock: string,
        public readonly taker: EvmAddress
    ) {}

    /**
     * @throws Error if the log data is invalid
     */
    static fromData(data: string): DstEscrowCreatedEvent {
        const [escrow, hashlock, taker] = coder.decode(
            ['address', 'bytes32', 'uint256'],
            data
        )

        return new DstEscrowCreatedEvent(
            EvmAddress.fromString(escrow as string),
            hashlock as string,
            EvmAddress.fromBigInt(taker as bigint)
        )
    }
}
