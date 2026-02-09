import {ImmutableFees} from './immutable-fees.js'

describe('FeeParameters', () => {
    // From smart contract test: DstImmutablesComplement.parameters
    const CONTRACT_FEE_PARAMETERS =
        '0x' +
        '00000000000000000000000000000000000000000000000000000000000015b4' +
        '00000000000000000000000000000000000000000000000000000000000000e7' +
        '0000000000000000000000005375ea61702dc3f421dd3c0c63c6b32101102e22' +
        '000000000000000000000000834704408a83c220ac4a85bf5c7c42307c4be4a5'

    it('should decode from smart contract', () => {
        const fees = ImmutableFees.decode(CONTRACT_FEE_PARAMETERS)

        expect(fees).not.toBeNull()
        expect(fees!.resolverFeeAmount).toBe(5556n)
        expect(fees!.integratorFeeAmount).toBe(231n)
        expect(fees!.resolverFeeRecipient.toString().toLowerCase()).toBe(
            '0x5375ea61702dc3f421dd3c0c63c6b32101102e22'
        )
        expect(fees!.integratorFeeRecipient.toString().toLowerCase()).toBe(
            '0x834704408a83c220ac4a85bf5c7c42307c4be4a5'
        )
    })

    it('should encode exactly matching smart contract', () => {
        const fees = ImmutableFees.decode(CONTRACT_FEE_PARAMETERS)

        expect(fees).not.toBeNull()
        expect(fees!.toString().toLowerCase()).toBe(
            CONTRACT_FEE_PARAMETERS.toLowerCase()
        )
    })

    it('should return ZERO for empty parameters', () => {
        expect(ImmutableFees.decode('0x')).toBe(ImmutableFees.ZERO)
    })

    it('should encode EMPTY as 128 bytes', () => {
        const encoded = ImmutableFees.ZERO.toString()
        // 0x + 128 bytes (256 hex chars)
        expect(encoded.length).toBe(2 + 256)
    })
})
