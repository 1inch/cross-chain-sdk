import {ZX} from '@1inch/fusion-sdk'
import {Jsonify} from 'type-fest'
import {coder} from '../../utils/coder.js'
import {DataFor} from '../../type-utils.js'

/**
 * Fee parameters stored in Immutables.parameters and DstImmutablesComplement.parameters.
 *
 * Contains:
 * - protocolFeeAmount: Fee amount for protocol
 * - integratorFeeAmount: Fee amount for integrator
 * - protocolFeeRecipient: Address to receive protocol fees
 * - integratorFeeRecipient: Address to receive integrator fees
 */
export class FeeParameters {
    static readonly EMPTY = new FeeParameters(0n, 0n, ZX, ZX)

    private static readonly ABI_TYPES = [
        'uint256',
        'uint256',
        'address',
        'address'
    ]

    constructor(
        public readonly protocolFeeAmount: bigint,
        public readonly integratorFeeAmount: bigint,
        public readonly protocolFeeRecipient: string,
        public readonly integratorFeeRecipient: string
    ) {}

    get isEmpty(): boolean {
        return this.protocolFeeAmount === 0n && this.integratorFeeAmount === 0n
    }

    static fromJSON(data: Jsonify<DataFor<FeeParameters>>): FeeParameters {
        return new FeeParameters(
            BigInt(data.protocolFeeAmount),
            BigInt(data.integratorFeeAmount),
            data.protocolFeeRecipient,
            data.integratorFeeRecipient
        )
    }

    static fromHex(bytes: string): FeeParameters {
        if (!bytes || bytes === ZX) {
            return FeeParameters.EMPTY
        }

        try {
            const [
                protocolFeeAmount,
                integratorFeeAmount,
                protocolFeeRecipient,
                integratorFeeRecipient
            ] = coder.decode(FeeParameters.ABI_TYPES, bytes)

            return new FeeParameters(
                BigInt(protocolFeeAmount),
                BigInt(integratorFeeAmount),
                protocolFeeRecipient,
                integratorFeeRecipient
            )
        } catch {
            return FeeParameters.EMPTY
        }
    }

    toString(): string {
        if (this.isEmpty) {
            return ZX
        }

        return coder.encode(FeeParameters.ABI_TYPES, [
            this.protocolFeeAmount,
            this.integratorFeeAmount,
            this.protocolFeeRecipient,
            this.integratorFeeRecipient
        ])
    }

    toJSON(): Jsonify<DataFor<FeeParameters>> {
        return {
            protocolFeeAmount: this.protocolFeeAmount.toString(),
            integratorFeeAmount: this.integratorFeeAmount.toString(),
            protocolFeeRecipient: this.protocolFeeRecipient,
            integratorFeeRecipient: this.integratorFeeRecipient
        }
    }
}
