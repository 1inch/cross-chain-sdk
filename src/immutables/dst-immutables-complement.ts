import {Address} from '@1inch/fusion-sdk'

export class DstImmutablesComplement {
    private constructor(
        public readonly maker: Address,
        public readonly amount: bigint,
        public readonly token: Address,
        public readonly safetyDeposit: bigint
    ) {}

    public static new(params: {
        maker: Address
        amount: bigint
        token: Address
        safetyDeposit: bigint
    }): DstImmutablesComplement {
        return new DstImmutablesComplement(
            params.maker,
            params.amount,
            params.token,
            params.safetyDeposit
        )
    }
}
