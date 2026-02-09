import {parseEther, parseUnits} from 'ethers'
import {randomBytes} from 'crypto'
import {SvmDstEscrowFactory} from './svm-dst-escrow-factory.js'
import {bufferFromHex, bufferToHex} from '../../utils/bytes.js'
import {
    HashLock,
    Immutables,
    SolanaAddress,
    TimeLocks
} from '../../domains/index.js'

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
            srcCancellationTimestamp: 100n,
            tokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID
        })

        expect(ix).toMatchSnapshot()
    })

    it('should parse create dst escrow instruction', async () => {
        const immutables = Immutables.fromJSON<SolanaAddress>({
            orderHash:
                '0x62b5cf375b2e813bf2a0f33112712601d5aab04e598701f0bab2b6c5e9fa8a76',
            hashlock:
                '0x1a52dc502242a54e1d3a609cb31e0160a504d9a26467fcf9a52b7a79060ef8f2',
            maker: '0x0000000000000000000000000000000000000000000000000000000000000001',
            taker: '0xf8bb3ce975e1ae20ccc5bd1e775828b2f811c617cafc6e4182d84c290a09f0f7',
            token: '0x0000000000000000000000000000000000000000000000000000000000000003',
            amount: '500000000000000000',
            safetyDeposit: '1000',
            timelocks:
                '4519513249946090673914462965909562690094454064409420748554250',
            parameters: '0x'
        })

        const srcCancellationTimestamp = BigInt(((Date.now() / 1000) | 0) + 100)

        const ix = SvmDstEscrowFactory.DEFAULT.createEscrow(immutables, {
            tokenProgramId: SolanaAddress.TOKEN_2022_PROGRAM_ID,
            srcCancellationTimestamp: srcCancellationTimestamp
        })

        const parsed = SvmDstEscrowFactory.parseCreateEscrowInstruction(ix)
        expect(parsed.orderHash).toEqual(bufferToHex(immutables.orderHash))
        expect(parsed.hashlock).toEqual(immutables.hashLock)
        expect(parsed.amount).toEqual(immutables.amount)
        expect(parsed.safetyDeposit).toEqual(immutables.safetyDeposit)
        expect(parsed.recipient).toEqual(
            SolanaAddress.fromBuffer(immutables.maker.toBuffer())
        )
        expect(parsed.assetIsNative).toEqual(false)
        expect(parsed.srcCancellationTimestamp).toEqual(
            Number(srcCancellationTimestamp)
        )
    })

    it('should parse withdraw instruction', async () => {
        const immutables = Immutables.fromJSON<SolanaAddress>({
            orderHash:
                '0x62b5cf375b2e813bf2a0f33112712601d5aab04e598701f0bab2b6c5e9fa8a76',
            hashlock:
                '0x1a52dc502242a54e1d3a609cb31e0160a504d9a26467fcf9a52b7a79060ef8f2',
            maker: '0x0000000000000000000000000000000000000000000000000000000000000001',
            taker: '0xf8bb3ce975e1ae20ccc5bd1e775828b2f811c617cafc6e4182d84c290a09f0f7',
            token: '0x0000000000000000000000000000000000000000000000000000000000000003',
            amount: '500000000000000000',
            safetyDeposit: '1000',
            timelocks:
                '4519513249946090673914462965909562690094454064409420748554250',
            parameters: '0x'
        })

        const secret = randomBytes(32)

        const ix = SvmDstEscrowFactory.DEFAULT.withdrawPrivate(
            immutables,
            secret,
            {
                tokenProgramId: SolanaAddress.TOKEN_2022_PROGRAM_ID
            }
        )

        const parsed = SvmDstEscrowFactory.parsePrivateWithdrawInstruction(ix)
        expect(parsed.secret).toEqual('0x' + secret.toString('hex'))
    })

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

    it('should parse publicWithdraw instruction', async () => {
        const immutables = Immutables.fromJSON<SolanaAddress>({
            orderHash: '0x62b5cf375b2e813bf2a0f33112712601d5aab2b6c5e9fa8a76',
            hashlock:
                '0x1a52dc502242a54e1d3a609cb31e0160a504d9a26467fcf9a52b7a79060ef8f2',
            maker: '0x0000000000000000000000000000000000000000000000000000000000000001',
            taker: '0xf8bb3ce975e1ae20ccc5bd1e775828b2f811c617cafc6e4182d84c290a09f0f7',
            token: '0x0000000000000000000000000000000000000000000000000000000000000003',
            amount: '500000000000000000',
            safetyDeposit: '1000',
            timelocks:
                '4519513249946090673914462965909562690094454064409420748554250',
            parameters: '0x'
        })

        const secret = randomBytes(32)

        const ix = SvmDstEscrowFactory.DEFAULT.withdrawPublic(
            immutables,
            secret,
            immutables.taker,
            {
                tokenProgramId: SolanaAddress.TOKEN_2022_PROGRAM_ID
            }
        )

        const parsed = SvmDstEscrowFactory.parsePublicWithdrawInstruction(ix)
        expect(parsed.secret).toEqual('0x' + secret.toString('hex'))
    })

    it('should generate cancelPrivate instruction', () => {
        const immutables = Immutables.new({
            orderHash: bufferFromHex(
                '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
            ),
            hashLock: HashLock.forSingleFill(
                '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba'
            ),
            maker: SolanaAddress.fromBigInt(200n),
            taker: SolanaAddress.fromBigInt(100n),
            token: SolanaAddress.fromBuffer(
                bufferFromHex(
                    '0x6521c75081a686617dfe3d3af3015864adc2860fc497d7dd470f522850c660a7'
                )
            ),
            amount: 500000000n,
            safetyDeposit: 2000n,
            timeLocks: TimeLocks.fromDurations({
                srcFinalityLock: 15n,
                srcPrivateWithdrawal: 150n,
                srcPublicWithdrawal: 120n,
                srcPrivateCancellation: 80n,
                dstFinalityLock: 12n,
                dstPrivateWithdrawal: 110n,
                dstPublicWithdrawal: 90n
            })
        })

        const ix = SvmDstEscrowFactory.DEFAULT.cancelPrivate(immutables, {
            tokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID
        })

        expect(ix).toMatchSnapshot()
    })
})
