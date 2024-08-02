import {Address, FusionExtension, NetworkEnum} from '@1inch/fusion-sdk'
import {EscrowExtension} from './escrow-extension'
import {TimeLocks} from './time-locks'
import {HashLock} from './hash-lock'
import {getRandomBytes32} from '../test-utils/get-random-bytes-32'

describe('EscrowExtension', () => {
    it('Should build/decode', () => {
        const fusionExt = FusionExtension.decode(
            '0x000000cb0000005e0000005e0000005e0000005e0000002f0000000000000000fb2809a5314473e1165f6b58018e20ed8f07b84000b8460000222c6656b88f0000b401e0da00ba01009000b8460024fb2809a5314473e1165f6b58018e20ed8f07b84000b8460000222c6656b88f0000b401e0da00ba01009000b8460024fb2809a5314473e1165f6b58018e20ed8f07b8406656b877b09498030ae3416b66dc0000db05a6a504f04d92e79d00000c989d73cf0bd5f83b660000d18bd45f0b94f54a968f0000d61b892b2ad6249011850000d0847e80c0b823a65ce70000901f8f650d76dcc657d1000038'
        )

        const ext = new EscrowExtension(
            fusionExt.address,
            fusionExt.auctionDetails,
            fusionExt.postInteractionData,
            fusionExt.makerPermit,
            HashLock.forSingleFill(getRandomBytes32()),
            NetworkEnum.ARBITRUM,
            Address.fromBigInt(1n),
            100n,
            200n,
            TimeLocks.new({
                srcWithdrawal: 1n,
                srcPublicWithdrawal: 2n,
                srcCancellation: 3n,
                srcPublicCancellation: 4n,
                dstWithdrawal: 1n,
                dstPublicWithdrawal: 2n,
                dstCancellation: 3n
            })
        )

        expect(EscrowExtension.decode(ext.build().encode())).toEqual(ext)
    })

    it('Should build/decode with multiple fills', () => {
        const fusionExt = FusionExtension.decode(
            '0x000000cb0000005e0000005e0000005e0000005e0000002f0000000000000000fb2809a5314473e1165f6b58018e20ed8f07b84000b8460000222c6656b88f0000b401e0da00ba01009000b8460024fb2809a5314473e1165f6b58018e20ed8f07b84000b8460000222c6656b88f0000b401e0da00ba01009000b8460024fb2809a5314473e1165f6b58018e20ed8f07b8406656b877b09498030ae3416b66dc0000db05a6a504f04d92e79d00000c989d73cf0bd5f83b660000d18bd45f0b94f54a968f0000d61b892b2ad6249011850000d0847e80c0b823a65ce70000901f8f650d76dcc657d1000038'
        )

        const ext = new EscrowExtension(
            fusionExt.address,
            fusionExt.auctionDetails,
            fusionExt.postInteractionData,
            fusionExt.makerPermit,
            HashLock.forMultipleFills(
                HashLock.getMerkleLeaves([
                    '0x6466643931343237333333313437633162386632316365646666323931643738',
                    '0x3131353932633266343034343466363562333230313837353438356463616130',
                    '0x6634376135663837653765303462346261616566383430303662303336386635'
                ])
            ),
            NetworkEnum.ARBITRUM,
            Address.fromBigInt(1n),
            100n,
            200n,
            TimeLocks.new({
                srcWithdrawal: 1n,
                srcPublicWithdrawal: 2n,
                srcCancellation: 3n,
                srcPublicCancellation: 4n,
                dstWithdrawal: 1n,
                dstPublicWithdrawal: 2n,
                dstCancellation: 3n
            })
        )

        expect(EscrowExtension.decode(ext.build().encode())).toEqual(ext)
    })
})
