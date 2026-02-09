import {SupportedChain} from 'chains.js'
import {coder} from '../../utils/coder.js'
import {Immutables, DstImmutablesComplement} from '../immutables/index.js'
import {ImmutableFees} from '../immutables-fees/index.js'
import {AddressLike, createAddress, EvmAddress} from '../addresses/index.js'

export class SrcEscrowCreatedEvent {
    static readonly TOPIC =
        '0x1140dcf80f027f65ebd1c2e98c33e3ebf7ef025d944a079256037cd55271bf98'

    constructor(
        public readonly srcImmutables: Immutables<EvmAddress>,
        public readonly dstImmutablesComplement: DstImmutablesComplement<AddressLike>
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
                _dstChainId,
                dstParameters
            ]
        ] = coder.decode(
            [
                '(bytes32,bytes32,uint256,uint256,uint256,uint256,uint256,uint256,bytes)',
                '(uint256,uint256,uint256,uint256,uint256,bytes)'
            ],
            data
        )

        const dstChainId: SupportedChain = Number(_dstChainId)

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
            DstImmutablesComplement.new({
                maker: createAddress(dstMaker as bigint, dstChainId),
                amount: dstAmount as bigint,
                token: createAddress(dstToken as bigint, dstChainId),
                taker: createAddress(0n, dstChainId),
                safetyDeposit: dstSafetyDeposit as bigint,
                chainId: BigInt(dstChainId),
                fees: ImmutableFees.decode(dstParameters as string) ?? undefined
            })
        )
    }
}
