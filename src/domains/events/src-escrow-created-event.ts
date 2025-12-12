import {coder} from '../../utils/coder.js'
import {Immutables, DstImmutablesComplement} from '../immutables/index.js'
import {ImmutableFees} from '../immutables-fees/index.js'
import {EvmAddress} from '../addresses/index.js'

export class SrcEscrowCreatedEvent {
    static readonly TOPIC =
        '0x1140dcf80f027f65ebd1c2e98c33e3ebf7ef025d944a079256037cd55271bf98'

    constructor(
        public readonly srcImmutables: Immutables<EvmAddress>,
        public readonly dstImmutablesComplement: DstImmutablesComplement<EvmAddress>
    ) {}

    /**
     * @throws Error if the log data is invalid
     */
    static fromData(data: string): SrcEscrowCreatedEvent {
        const [
            [
                orderHash,
                hashlock,
                maker,
                taker,
                token,
                amount,
                safetyDeposit,
                timelocks,
                srcParameters
            ],
            [
                dstMaker,
                dstAmount,
                dstToken,
                dstSafetyDeposit,
                dstChainId,
                dstParameters
            ]
        ] = coder.decode(
            [
                '(bytes32,bytes32,uint256,uint256,uint256,uint256,uint256,uint256,bytes)',
                '(uint256,uint256,uint256,uint256,uint256,bytes)'
            ],
            data
        )

        return new SrcEscrowCreatedEvent(
            Immutables.fromJSON<EvmAddress>({
                orderHash: orderHash as string,
                hashlock: hashlock as string,
                maker: EvmAddress.fromBigInt(maker as bigint).toString(),
                taker: EvmAddress.fromBigInt(taker as bigint).toString(),
                token: EvmAddress.fromBigInt(token as bigint).toString(),
                amount: (amount as bigint).toString(),
                safetyDeposit: (safetyDeposit as bigint).toString(),
                timelocks: (timelocks as bigint).toString(),
                parameters: srcParameters as string
            }),
            DstImmutablesComplement.new<EvmAddress>({
                maker: EvmAddress.fromBigInt(dstMaker as bigint),
                amount: dstAmount as bigint,
                token: EvmAddress.fromBigInt(dstToken as bigint),
                taker: EvmAddress.ZERO,
                safetyDeposit: dstSafetyDeposit as bigint,
                chainId: dstChainId as bigint,
                fees: ImmutableFees.decode(dstParameters as string) ?? undefined
            })
        )
    }
}
