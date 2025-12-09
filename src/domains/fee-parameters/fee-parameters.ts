import {ZX} from '@1inch/fusion-sdk'
import {coder} from '../../utils/coder.js'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

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
    static readonly EMPTY = new FeeParameters(
        0n,
        0n,
        ZERO_ADDRESS,
        ZERO_ADDRESS
    )

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

    static fromJSON(data: {
        protocolFeeAmount: string
        integratorFeeAmount: string
        protocolFeeRecipient: string
        integratorFeeRecipient: string
    }): FeeParameters {
        return new FeeParameters(
            BigInt(data.protocolFeeAmount),
            BigInt(data.integratorFeeAmount),
            data.protocolFeeRecipient,
            data.integratorFeeRecipient
        )
    }

    static fromHex(bytes: string): FeeParameters | null {
        if (!bytes || bytes === ZX || bytes.length < 130) {
            return null
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
            return null
        }
    }

    /**
     * Encode fee parameters to bytes.
     * Always encodes all 4 fields (128 bytes) because the contract reads them in withdraw().
     */
    toString(): string {
        return coder.encode(FeeParameters.ABI_TYPES, [
            this.protocolFeeAmount,
            this.integratorFeeAmount,
            this.protocolFeeRecipient,
            this.integratorFeeRecipient
        ])
    }

    toJSON(): {
        protocolFeeAmount: string
        integratorFeeAmount: string
        protocolFeeRecipient: string
        integratorFeeRecipient: string
    } {
        return {
            protocolFeeAmount: this.protocolFeeAmount.toString(),
            integratorFeeAmount: this.integratorFeeAmount.toString(),
            protocolFeeRecipient: this.protocolFeeRecipient,
            integratorFeeRecipient: this.integratorFeeRecipient
        }
    }
}
