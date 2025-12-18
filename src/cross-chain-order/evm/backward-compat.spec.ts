import {Extension} from '@1inch/fusion-sdk'
import {Address} from '@1inch/limit-order-sdk'
import {add0x} from '@1inch/byte-utils'
import {EvmCrossChainOrder} from './evm-cross-chain-order.js'
import {EscrowExtension} from './escrow-extension.js'

describe('Backward Compatibility', () => {
    it('should decode old format V1', () => {
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
        expect(decoded.dstChainId).toBe(42161)
        expect(decoded.makerAsset.toString()).toBe(oldOrder.makerAsset)
        expect(decoded.takerAsset.toString()).toBe(
            '0xaf88d065e77c8cc2239327c5edb3a432268e5831'
        ) // USDC on Arbitrum
        expect(decoded.escrowExtension.extra).toBe(undefined)
        expect(
            Address.fromBigInt(
                BigInt(
                    add0x(
                        decoded.escrowExtension.whitelist.whitelist[0]
                            .addressHalf
                    )
                )
            ).toString()
        ).toBe('0x000000000000000000000000000000000000000a')
    })

    it('decoding extension, checking backward compatibility', () => {
        const extension =
            '0x00000125000000540000005400000054000000540000002a0000000000000000a7bcb4eac8964306f9e3764f67db6a7af6ddf99a000000000000006942c2ae0000b400c4a000558f0078a7bcb4eac8964306f9e3764f67db6a7af6ddf99a000000000000006942c2ae0000b400c4a000558f0078a7bcb4eac8964306f9e3764f67db6a7af6ddf99a6942c29172f8a0c8c415454f629c0000c0d6ca36e23f4fcab1f7000010361cdb08001adb850ff992014900a80aae6f576b5fdbd737dc08a9190dafc09100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000a8131a5ac00000000000000000000000ba9b5346b5000000000000001840000010c000000180000023c000001c40000011000000004'

        const escrowExt = EscrowExtension.decode(extension)
        expect(escrowExt.whitelist.length).toBe(2)

        expect(escrowExt.whitelist.whitelist[0].addressHalf).toBe(
            '72f8a0c8c415454f629c'
        )
        expect(escrowExt.whitelist.whitelist[1].addressHalf).toBe(
            'c0d6ca36e23f4fcab1f7'
        )
        expect(escrowExt.auctionDetails.points[0].coefficient).toBe(21903)
        expect(escrowExt.auctionDetails.points[0].delay).toBe(120)
        expect(escrowExt.auctionDetails.duration).toBe(180n)
        expect(escrowExt.auctionDetails.initialRateBump).toBe(50336n)
        expect(escrowExt.auctionDetails.startTime).toBe(1765982894n)
        expect(escrowExt.whitelist.whitelist[0].delay).toBe(0n)
        expect(escrowExt.whitelist.whitelist[1].delay).toBe(0n)
        expect(escrowExt.dstSafetyDeposit).toBe(12823517490000n)
        expect(escrowExt.srcSafetyDeposit).toBe(11550000000000n)
        expect(escrowExt.hashLockInfo.toString()).toBe(
            '0x361cdb08001adb850ff992014900a80aae6f576b5fdbd737dc08a9190dafc091'
        )
        expect(escrowExt.timeLocks.build()).toBe(
            2435515473721714575181135055134583136705295881724189837623300n
        )
    })
})
