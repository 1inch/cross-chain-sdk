import {Extension} from '@1inch/fusion-sdk'
import {EvmCrossChainOrder} from './evm-cross-chain-order.js'

describe('Backward Compatibility', () => {
    it('should decode old order without fees', () => {
        const oldOrder = {
            maker: '0x74ba356625f4552eae1a7a6b5b8fb0f4880885ff',
            makerAsset: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            takerAsset: '0xda0000d4000015a526378bb6fafc650cea5966f8',
            makerTraits:
                '4523128485832663883733241601901871401843601222724813886053469525858848866304',
            salt: '18384870378636312251882455055136129202388318884893508088699654577398',
            makingAmount: '10000000',
            takingAmount: '10000000',
            receiver: '0x0000000000000000000000000000000000000000'
        }

        const extension =
            '0x0000010f0000004a0000004a0000004a0000004a000000250000000000000000a7bcb4eac8964306f9e3764f67db6a7af6ddf99a0000000000000069428c5e000078000000a7bcb4eac8964306f9e3764f67db6a7af6ddf99a0000000000000069428c5e000078000000a7bcb4eac8964306f9e3764f67db6a7af6ddf99a69428c5e0000000000000000000a00000861c2fff9ccedab979c135972ee62624dcc762eb1d0904404ebd7e9e29aa575a3000000000000000000000000000000000000000000000000000000000000a4b1000000000000000000000000af88d065e77c8cc2239327c5edb3a432268e58310000000000000000016345785d8a00000000000000000000016345785d8a00000000000000000007000000060000000500000004000000030000000200000001'

        const decoded = EvmCrossChainOrder.fromDataAndExtension(
            oldOrder,
            Extension.decode(extension)
        )

        expect(decoded.maker.toString().toLowerCase()).toBe(
            oldOrder.maker.toLowerCase()
        )
        expect(decoded.makingAmount.toString()).toBe(oldOrder.makingAmount)
        expect(decoded.takingAmount.toString()).toBe(oldOrder.takingAmount)

        const resolverFee = decoded.getResolverFee(
            decoded.maker,
            BigInt(Math.floor(Date.now() / 1000))
        )
        const integratorFee = decoded.getIntegratorFee(
            decoded.maker,
            BigInt(Math.floor(Date.now() / 1000))
        )

        expect(integratorFee).toBe(0n)
        expect(resolverFee).toBe(0n)
        expect(decoded.dstChainId).toBe(42161)
        expect(decoded.dstChainId).toBe(42161)
    })
})
