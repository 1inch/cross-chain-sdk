import {AbiCoder} from 'ethers'
import {ZX} from '@1inch/fusion-sdk'

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
    private static readonly ABI_TYPES = [
        'uint256',
        'uint256',
        'address',
        'address'
    ]

    static readonly EMPTY = new FeeParameters(0n, 0n, ZX, ZX)

    constructor(
        public readonly protocolFeeAmount: bigint,
        public readonly integratorFeeAmount: bigint,
        public readonly protocolFeeRecipient: string,
        public readonly integratorFeeRecipient: string
    ) {}

    static fromHex(bytes: string): FeeParameters | null {
        if (!bytes || bytes === ZX || bytes === '0x') {
            return null
        }

        try {
            const [
                protocolFeeAmount,
                integratorFeeAmount,
                protocolFeeRecipient,
                integratorFeeRecipient
            ] = AbiCoder.defaultAbiCoder().decode(
                FeeParameters.ABI_TYPES,
                bytes
            )

            return new FeeParameters(
                BigInt(protocolFeeAmount),
                BigInt(integratorFeeAmount),
                protocolFeeRecipient as string,
                integratorFeeRecipient as string
            )
        } catch {
            return null
        }
    }

    get isEmpty(): boolean {
        return this.protocolFeeAmount === 0n && this.integratorFeeAmount === 0n
    }

    get totalFee(): bigint {
        return this.protocolFeeAmount + this.integratorFeeAmount
    }

    toString(): string {
        if (this.isEmpty) {
            return ZX
        }

        return AbiCoder.defaultAbiCoder().encode(FeeParameters.ABI_TYPES, [
            this.protocolFeeAmount,
            this.integratorFeeAmount,
            this.protocolFeeRecipient,
            this.integratorFeeRecipient
        ])
    }

    toJSON(): FeeParametersJSON {
        return {
            protocolFeeAmount: this.protocolFeeAmount.toString(),
            integratorFeeAmount: this.integratorFeeAmount.toString(),
            protocolFeeRecipient: this.protocolFeeRecipient,
            integratorFeeRecipient: this.integratorFeeRecipient
        }
    }

    static fromJSON(data: FeeParametersJSON): FeeParameters {
        return new FeeParameters(
            BigInt(data.protocolFeeAmount),
            BigInt(data.integratorFeeAmount),
            data.protocolFeeRecipient,
            data.integratorFeeRecipient
        )
    }
}

export type FeeParametersJSON = {
    protocolFeeAmount: string
    integratorFeeAmount: string
    protocolFeeRecipient: string
    integratorFeeRecipient: string
}
