import {AddressLike} from '../addresses/index.js'

export class DstImmutablesComplement<A extends AddressLike> {
    private constructor(
        public readonly maker: A,
        public readonly amount: bigint,
        public readonly token: A,
        public readonly taker: A,
        public readonly safetyDeposit: bigint
    ) {}

    public static new<A extends AddressLike>(params: {
        maker: A
        amount: bigint
        token: A
        taker: A
        safetyDeposit: bigint
    }): DstImmutablesComplement<A> {
        return new DstImmutablesComplement(
            params.maker,
            params.amount,
            params.token,
            params.taker,
            params.safetyDeposit
        )
    }

    public toJSON(): {
        maker: string
        amount: string
        token: string
        safetyDeposit: string
    } {
        return {
            maker: this.maker.toString(),
            amount: this.amount.toString(),
            token: this.token.toString(),
            safetyDeposit: this.safetyDeposit.toString()
        }
    }
}
