import {parseEther, parseUnits} from 'ethers'
import {SvmDstEscrowFactory} from './svm-dst-escrow-factory'
import {SolanaAddress} from '../../domains/addresses'
import {HashLock} from '../../domains/hash-lock'
import {TimeLocks} from '../../domains/time-locks'
import {Immutables} from '../../domains/immutables'

describe('SVM Escrow dst factory', () => {
    it('should generate withdrawPublic instruction', () => {
        const immutables = Immutables.new({
            orderHash: Buffer.from(
                '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
                'hex'
            ),
            hashLock: HashLock.forSingleFill(
                '0x4a52dc502242a54e1d3a609cb31e0160a504d9a26467fcf9a52b7a79060ef8f1'
            ),
            taker: SolanaAddress.fromBigInt(100n),
            token: SolanaAddress.NATIVE, // Native SOL to test wrapped native conversion
            maker: SolanaAddress.fromBigInt(300n),
            amount: parseEther('1'),
            safetyDeposit: 1000n,
            timeLocks: TimeLocks.fromDurations({
                srcFinalityLock: 10n,
                srcPrivateWithdrawal: 200n,
                srcPublicWithdrawal: 100n,
                srcPrivateCancellation: 100n,
                dstFinalityLock: 10n,
                dstPrivateWithdrawal: 100n,
                dstPublicWithdrawal: 100n
            })
        })

        const secret = Buffer.from(
            '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
            'hex'
        )
        const payer = SolanaAddress.fromBigInt(400n)

        const ix = SvmDstEscrowFactory.DEFAULT.withdrawPublic(
            immutables,
            secret,
            payer,
            {
                tokenProgramId: SolanaAddress.TOKEN_2022_PROGRAM_ID
            }
        )

        expect(ix).toMatchSnapshot()
    })

    it('should handle native token correctly in withdrawPublic', () => {
        const immutables = Immutables.new({
            orderHash: Buffer.from(
                'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                'hex'
            ),
            hashLock: HashLock.forSingleFill(
                '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
            ),
            taker: SolanaAddress.fromBigInt(7777n),
            token: SolanaAddress.NATIVE, // Native SOL
            maker: SolanaAddress.fromBigInt(8888n),
            amount: parseUnits('0.1', 9), // 0.1 SOL
            safetyDeposit: 500n,
            timeLocks: TimeLocks.fromDurations({
                srcFinalityLock: 5n,
                srcPrivateWithdrawal: 100n,
                srcPublicWithdrawal: 80n,
                srcPrivateCancellation: 60n,
                dstFinalityLock: 8n,
                dstPrivateWithdrawal: 90n,
                dstPublicWithdrawal: 70n
            })
        })

        const secret = Buffer.from(
            'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            'hex'
        )
        const payer = SolanaAddress.fromBigInt(6666n)

        const ix = SvmDstEscrowFactory.DEFAULT.withdrawPublic(
            immutables,
            secret,
            payer,
            {
                tokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID
            }
        )

        expect(ix).toMatchSnapshot()
    })
})
