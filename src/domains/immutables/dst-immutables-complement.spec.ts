import {DstImmutablesComplement} from './dst-immutables-complement.js'
import {EvmAddress} from '../addresses/index.js'
import {ImmutableFees} from '../immutables-fees/index.js'

describe('DstImmutablesComplement', () => {
    it('serializes complement fields including fees', () => {
        const maker = EvmAddress.fromString(
            '0x1111111111111111111111111111111111111111'
        )
        const complement = DstImmutablesComplement.new({
            maker,
            amount: 10n,
            token: maker,
            taker: maker,
            safetyDeposit: 1n,
            chainId: 1n,
            fees: ImmutableFees.ZERO
        })

        const json = complement.toJSON()
        expect(json.maker).toBe(maker.toString())
        expect(json.amount).toBe('10')
        expect(json.safetyDeposit).toBe('1')
        expect(json.chainId).toBe('1')
        expect(json.fees).toBe(ImmutableFees.ZERO.encode())
    })
})
