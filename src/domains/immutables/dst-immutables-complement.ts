import {DstImmutablesComplementData} from './types.js'
import {AddressLike} from '../addresses/index.js'
import {Fees} from '../fees/index.js'

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
        public readonly fees: Fees
    ) {}

    static new<A extends AddressLike>({
        maker,
        amount,
        token,
        taker,
        safetyDeposit,
        chainId,
        fees = Fees.ZERO
    }: {
        maker: A
        amount: bigint
        token: A
        taker: A
        safetyDeposit: bigint
        chainId: bigint
        fees?: Fees
    }): DstImmutablesComplement<A> {
        return new DstImmutablesComplement(
            maker,
            amount,
            token,
            taker,
            safetyDeposit,
            chainId,
            fees
        )
    }

    toJSON(): DstImmutablesComplementData {
        return {
            maker: this.maker.toString(),
            amount: this.amount.toString(),
            token: this.token.toString(),
            safetyDeposit: this.safetyDeposit.toString(),
            chainId: this.chainId.toString(),
            fees: this.fees.encode()
        }
    }
}
