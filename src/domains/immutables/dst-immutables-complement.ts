import {AddressLike} from '../addresses'

export class DstImmutablesComplement {
    private constructor(
        public readonly maker: AddressLike,
        public readonly amount: bigint,
        public readonly token: AddressLike,
        public readonly safetyDeposit: bigint
    ) {}

    public static new(params: {
        maker: AddressLike
        amount: bigint
        token: AddressLike
        safetyDeposit: bigint
    }): DstImmutablesComplement {
        return new DstImmutablesComplement(
            params.maker,
            params.amount,
            params.token,
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
