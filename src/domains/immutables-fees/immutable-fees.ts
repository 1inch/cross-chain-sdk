import {ZX} from '@1inch/fusion-sdk'
import assert from 'assert'
import {FeeParametersData} from './types.js'
import {coder} from '../../utils/coder.js'
import {EvmAddress} from '../addresses/index.js'

/**
 * Fee parameters stored in Immutables.parameters and DstImmutablesComplement.parameters.
 *
 * Contains:
 * - resolverFeeAmount: Fee amount for protocol
 * - integratorFeeAmount: Fee amount for integrator
 * - resolverFeeRecipient: Address to receive protocol fees
 * - integratorFeeRecipient: Address to receive integrator fees
 */
export class ImmutableFees {
    static readonly ZERO = new ImmutableFees(
        0n,
        0n,
        EvmAddress.ZERO,
        EvmAddress.ZERO
    )

    private static readonly ABI_TYPES = [
        'uint256',
        'uint256',
        'address',
        'address'
    ]

    constructor(
        public readonly resolverFeeAmount: bigint,
        public readonly integratorFeeAmount: bigint,
        public readonly resolverFeeRecipient: EvmAddress,
        public readonly integratorFeeRecipient: EvmAddress
    ) {
        assert(
            resolverFeeAmount === 0n || !resolverFeeRecipient.isZero(),
            'resolverFeeRecipient must be non-zero when resolverFeeAmount is non-zero'
        )
        assert(
            integratorFeeAmount === 0n || !integratorFeeRecipient.isZero(),
            'integratorFeeRecipient must be non-zero when integratorFeeAmount is non-zero'
        )
    }

    static fromJSON(data: FeeParametersData): ImmutableFees {
        return new ImmutableFees(
            BigInt(data.resolverFeeAmount),
            BigInt(data.integratorFeeAmount),
            EvmAddress.fromString(data.resolverFeeRecipient),
            EvmAddress.fromString(data.integratorFeeRecipient)
        )
    }

    static decode(bytes: string): ImmutableFees {
        if (bytes === ZX) {
            return ImmutableFees.ZERO
        }

        const [
            resolverFeeAmount,
            integratorFeeAmount,
            resolverFeeRecipient,
            integratorFeeRecipient
        ] = coder.decode(ImmutableFees.ABI_TYPES, bytes)

        return new ImmutableFees(
            BigInt(resolverFeeAmount),
            BigInt(integratorFeeAmount),
            EvmAddress.fromString(resolverFeeRecipient),
            EvmAddress.fromString(integratorFeeRecipient)
        )
    }

    /**
     * Encode fee parameters to bytes.
     * Always encodes all 4 fields (128 bytes) because the contract reads them in withdraw().
     */
    encode(): string {
        return coder.encode(ImmutableFees.ABI_TYPES, [
            this.resolverFeeAmount,
            this.integratorFeeAmount,
            this.resolverFeeRecipient.toString(),
            this.integratorFeeRecipient.toString()
        ])
    }

    toString(): string {
        return this.encode()
    }

    /**
     * Check if all fee values are zero.
     */
    isZero(): boolean {
        return (
            this.resolverFeeAmount === 0n &&
            this.integratorFeeAmount === 0n &&
            this.resolverFeeRecipient.equal(EvmAddress.ZERO) &&
            this.integratorFeeRecipient.equal(EvmAddress.ZERO)
        )
    }

    toJSON(): FeeParametersData {
        return {
            resolverFeeAmount: this.resolverFeeAmount.toString(),
            integratorFeeAmount: this.integratorFeeAmount.toString(),
            resolverFeeRecipient: this.resolverFeeRecipient.toString(),
            integratorFeeRecipient: this.integratorFeeRecipient.toString()
        }
    }
}
