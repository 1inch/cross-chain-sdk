import {ZX} from '@1inch/fusion-sdk'
import {FeeParametersData} from './types.js'
import {coder} from '../../utils/coder.js'
import {EvmAddress} from '../addresses/index.js'

/**
 * Fee parameters stored in Immutables.parameters and DstImmutablesComplement.parameters.
 *
 * Contains:
 * - protocolFeeAmount: Fee amount for protocol
 * - integratorFeeAmount: Fee amount for integrator
 * - protocolFeeRecipient: Address to receive protocol fees
 * - integratorFeeRecipient: Address to receive integrator fees
 */
export class Fees {
    static readonly ZERO = new Fees(0n, 0n, EvmAddress.ZERO, EvmAddress.ZERO)

    private static readonly ABI_TYPES = [
        'uint256',
        'uint256',
        'address',
        'address'
    ]

    constructor(
        public readonly protocolFeeAmount: bigint,
        public readonly integratorFeeAmount: bigint,
        public readonly protocolFeeRecipient: EvmAddress,
        public readonly integratorFeeRecipient: EvmAddress
    ) {}

    static fromJSON(data: FeeParametersData): Fees {
        return new Fees(
            BigInt(data.protocolFeeAmount),
            BigInt(data.integratorFeeAmount),
            EvmAddress.fromString(data.protocolFeeRecipient),
            EvmAddress.fromString(data.integratorFeeRecipient)
        )
    }

    static decode(bytes: string): Fees {
        if (bytes === ZX) {
            return Fees.ZERO
        }

        const [
            protocolFeeAmount,
            integratorFeeAmount,
            protocolFeeRecipient,
            integratorFeeRecipient
        ] = coder.decode(Fees.ABI_TYPES, bytes)

        return new Fees(
            BigInt(protocolFeeAmount),
            BigInt(integratorFeeAmount),
            EvmAddress.fromString(protocolFeeRecipient),
            EvmAddress.fromString(integratorFeeRecipient)
        )
    }

    /**
     * Encode fee parameters to bytes.
     * Always encodes all 4 fields (128 bytes) because the contract reads them in withdraw().
     */
    encode(): string {
        return coder.encode(Fees.ABI_TYPES, [
            this.protocolFeeAmount,
            this.integratorFeeAmount,
            this.protocolFeeRecipient.toString(),
            this.integratorFeeRecipient.toString()
        ])
    }

    toString(): string {
        return this.encode()
    }

    toJSON(): FeeParametersData {
        return {
            protocolFeeAmount: this.protocolFeeAmount.toString(),
            integratorFeeAmount: this.integratorFeeAmount.toString(),
            protocolFeeRecipient: this.protocolFeeRecipient.toString(),
            integratorFeeRecipient: this.integratorFeeRecipient.toString()
        }
    }
}
