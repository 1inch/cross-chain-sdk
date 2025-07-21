import {now} from '@1inch/fusion-sdk'
import {SvmDstEscrowFactory} from './svm-dst-escrow-factory'
import {bufferFromHex} from '../../utils/bytes'
import {HashLock, Immutables, SolanaAddress, TimeLocks} from '../../domains'

describe('SVM Escrow dst factory', () => {
    it('should generate create escrow instruction', () => {
        const immutables = Immutables.new({
            orderHash: bufferFromHex(
                '0x663e58c85e0ac6721b6fe635eda03279e9552866f45938dc00effaac1fd0ac0b'
            ),
            hashLock: HashLock.fromString(
                '0x6e6b426ba6241e7544d5b6802897f93d68e6ed09cbc816058cf67096ff1494de'
            ),
            maker: SolanaAddress.fromBuffer(
                bufferFromHex(
                    '0xb96a60f72dcd59fa0e8378cd0f86bbda0a6dc305d1a228705c9d620ada73b62c'
                )
            ),
            taker: SolanaAddress.fromBuffer(
                bufferFromHex(
                    '0xaa298a629432ad57157beff906c3695e45871e077c33579c13db2d03f9607569'
                )
            ),
            token: SolanaAddress.fromBuffer(
                bufferFromHex(
                    '0x6521c75081a686617dfe3d3af3015864adc2860fc497d7dd470f522850c660a7'
                )
            ),
            amount: 1000000000n,
            safetyDeposit: 1000n,
            timeLocks:
                TimeLocks.fromBigInt(
                    47259175731581550628966830069363148924329979951954020279276990920496521412618n
                )
        })

        const ix = SvmDstEscrowFactory.DEFAULT.createEscrow(immutables, {
            srcCancellationTimestamp: now(),
            tokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID
        })

        expect(ix).toMatchSnapshot()
    })
})
