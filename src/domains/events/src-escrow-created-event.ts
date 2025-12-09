import {Interface} from 'ethers'
import {Immutables, DstImmutablesComplement} from '../immutables/index.js'
import {FeeParameters} from '../fee-parameters/index.js'
import {EvmAddress} from '../addresses/index.js'
import {CROSS_CHAIN_ABI} from '../../abi/cross-chain-abi.js'

const iface = new Interface(CROSS_CHAIN_ABI)

export class SrcEscrowCreatedEvent {
    static readonly TOPIC =
        '0x73945706db1a66583157e3c437146151b922ff1782d28c1171adc7b2865df3f3'

    constructor(
        public readonly srcImmutables: Immutables<EvmAddress>,
        public readonly dstImmutablesComplement: DstImmutablesComplement<EvmAddress>
    ) {}

    /**
     * @throws Error if the log data is invalid
     */
    static fromLog(data: string): SrcEscrowCreatedEvent {
        const decoded = iface.decodeEventLog('SrcEscrowCreated', data, [
            SrcEscrowCreatedEvent.TOPIC
        ])

        const src = decoded.srcImmutables
        const dst = decoded.dstImmutablesComplement

        return new SrcEscrowCreatedEvent(
            Immutables.fromJSON<EvmAddress>({
                orderHash: src.orderHash,
                hashlock: src.hashlock,
                maker: src.maker,
                taker: src.taker,
                token: src.token,
                amount: src.amount.toString(),
                safetyDeposit: src.safetyDeposit.toString(),
                timelocks: src.timelocks.toString(),
                parameters: src.parameters
            }),
            DstImmutablesComplement.new<EvmAddress>({
                maker: EvmAddress.fromString(dst.maker),
                amount: BigInt(dst.amount),
                token: EvmAddress.fromString(dst.token),
                taker: EvmAddress.ZERO,
                safetyDeposit: BigInt(dst.safetyDeposit),
                chainId: BigInt(dst.chainId),
                feeParameters:
                    FeeParameters.fromHex(dst.parameters) ?? undefined
            })
        )
    }
}
