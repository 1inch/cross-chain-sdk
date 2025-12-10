import {DstImmutablesComplementData} from './types.js'
import {AddressLike} from '../addresses/index.js'
import {Fees} from '../fee-parameters/index.js'

/**
 * Complement data for destination chain immutables.
 * Contains the additional fields needed to construct dst escrow.
 */
export class DstImmutablesComplement<A extends AddressLike> {
    static readonly Web3Type = `tuple(${[
        'address maker',
        'uint256 amount',
        'address token',
        'uint256 safetyDeposit',
        'uint256 chainId',
        'bytes parameters'
    ]})`

    private constructor(
        public readonly maker: A,
        public readonly amount: bigint,
        public readonly token: A,
        public readonly taker: A,
        public readonly safetyDeposit: bigint,
        public readonly chainId: bigint,
        public readonly parameters: string
    ) {}

    static new<A extends AddressLike>(params: {
        maker: A
        amount: bigint
        token: A
        taker: A
        safetyDeposit: bigint
        chainId: bigint
        feeParameters?: Fees
    }): DstImmutablesComplement<A> {
        const feeParams = params.feeParameters ?? Fees.ZERO

        return new DstImmutablesComplement(
            params.maker,
            params.amount,
            params.token,
            params.taker,
            params.safetyDeposit,
            params.chainId,
            feeParams.toString()
        )
    }

    toJSON(): DstImmutablesComplementData {
        return {
            maker: this.maker.toString(),
            amount: this.amount.toString(),
            token: this.token.toString(),
            safetyDeposit: this.safetyDeposit.toString(),
            chainId: this.chainId.toString(),
            parameters: this.parameters
        }
    }
}
