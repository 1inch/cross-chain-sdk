import {parseEther, parseUnits} from 'ethers'
import {Buffer} from 'buffer'
import {randomBytes} from 'crypto'
import {SvmSrcEscrowFactory} from './svm-src-escrow-factory'
import {NetworkEnum} from '../../chains'
import {SvmCrossChainOrder} from '../../cross-chain-order/svm/svm-cross-chain-order'
import {EvmAddress, SolanaAddress} from '../../domains/addresses'
import {HashLock} from '../../domains/hash-lock'
import {TimeLocks} from '../../domains/time-locks'
import {AuctionDetails} from '../../domains/auction-details'
import {ResolverCancellationConfig} from '../../cross-chain-order'
import {Immutables} from '../../domains/immutables'
import {bufferFromHex} from '../../utils/bytes'

describe('SVM Escrow src factory', () => {
    it('should generate create instruction from order', () => {
        const order = SvmCrossChainOrder.new(
            // 1 WETH [solana] -> 1000 USDC [ethereum]
            {
                maker: SolanaAddress.fromBigInt(1n),
                receiver: EvmAddress.fromBigInt(2n),
                srcToken: SolanaAddress.fromBigInt(3n),
                dstToken: EvmAddress.fromBigInt(4n), // address on dst chain
                srcAmount: parseEther('1'),
                minDstAmount: parseUnits('1000', 6)
            },
            {
                srcChainId: NetworkEnum.SOLANA,
                dstChainId: NetworkEnum.ETHEREUM,
                srcSafetyDeposit: 1000n,
                dstSafetyDeposit: 1000n,
                timeLocks: TimeLocks.fromDurations({
                    srcFinalityLock: 10n,
                    srcPrivateWithdrawal: 200n,
                    srcPublicWithdrawal: 100n,
                    srcPrivateCancellation: 100n,
                    dstFinalityLock: 10n,
                    dstPrivateWithdrawal: 100n,
                    dstPublicWithdrawal: 100n
                }),
                hashLock: HashLock.forSingleFill(
                    '0x4a52dc502242a54e1d3a609cb31e0160a504d9a26467fcf9a52b7a79060ef8f1'
                )
            },
            {
                auction: AuctionDetails.noAuction(120n, 1234n)
            },
            {
                allowMultipleFills: false,
                salt: 123n
            }
        )

        const ix = SvmSrcEscrowFactory.DEFAULT.createOrder(order, {
            srcTokenProgramId: SolanaAddress.TOKEN_2022_PROGRAM_ID
        })

        expect(ix).toMatchSnapshot()
    })

    it('should generate create instruction from order with bump bigger than u16', () => {
        const order = SvmCrossChainOrder.new(
            // 1 WETH [solana] -> 1000 USDC [ethereum]
            {
                maker: SolanaAddress.fromBigInt(1n),
                receiver: EvmAddress.fromBigInt(2n),
                srcToken: SolanaAddress.fromBigInt(3n),
                dstToken: EvmAddress.fromBigInt(4n), // address on dst chain
                srcAmount: parseEther('1'),
                minDstAmount: parseUnits('1000', 6)
            },
            {
                srcChainId: NetworkEnum.SOLANA,
                dstChainId: NetworkEnum.ETHEREUM,
                srcSafetyDeposit: 1000n,
                dstSafetyDeposit: 1000n,
                timeLocks: TimeLocks.fromDurations({
                    srcFinalityLock: 10n,
                    srcPrivateWithdrawal: 200n,
                    srcPublicWithdrawal: 100n,
                    srcPrivateCancellation: 100n,
                    dstFinalityLock: 10n,
                    dstPrivateWithdrawal: 100n,
                    dstPublicWithdrawal: 100n
                }),
                hashLock: HashLock.forSingleFill(
                    '0x4a52dc502242a54e1d3a609cb31e0160a504d9a26467fcf9a52b7a79060ef8f1'
                )
            },
            {
                auction: new AuctionDetails({
                    duration: 120n,
                    initialRateBump: 70_000,
                    points: [],
                    startTime: 1234n
                })
            },
            {
                allowMultipleFills: false,
                salt: 123n
            }
        )

        const ix = SvmSrcEscrowFactory.DEFAULT.createOrder(order, {
            srcTokenProgramId: SolanaAddress.TOKEN_2022_PROGRAM_ID
        })

        expect(ix.data.length).toBeGreaterThan(0)
    })

    it('should parse create instruction', async () => {
        const auction = AuctionDetails.noAuction(120n, 1752739636n)

        const order = SvmCrossChainOrder.new(
            // 1 WETH [solana] -> 1000 USDC [ethereum]
            {
                maker: SolanaAddress.fromBigInt(1n),
                receiver: EvmAddress.fromBigInt(2n),
                srcToken: SolanaAddress.fromBigInt(3n),
                dstToken: EvmAddress.fromBigInt(4n), // address on dst chain
                srcAmount: parseEther('1'),
                minDstAmount: parseUnits('1000', 6)
            },
            {
                srcChainId: NetworkEnum.SOLANA,
                dstChainId: NetworkEnum.ETHEREUM,
                srcSafetyDeposit: 1000n,
                dstSafetyDeposit: 2000n,
                timeLocks: TimeLocks.fromDurations({
                    srcFinalityLock: 10n,
                    srcPrivateWithdrawal: 200n,
                    srcPublicWithdrawal: 100n,
                    srcPrivateCancellation: 150n,
                    dstFinalityLock: 20n,
                    dstPrivateWithdrawal: 300n,
                    dstPublicWithdrawal: 400n
                }),
                hashLock: HashLock.forSingleFill(
                    '0x4a52dc502242a54e1d3a609cb31e0160a504d9a26467fcf9a52b7a79060ef8f1'
                )
            },
            {
                auction
            },
            {
                allowMultipleFills: false,
                salt: 0x535n,
                orderExpirationDelay: 24n,
                resolverCancellationConfig:
                    ResolverCancellationConfig.ALMOST_ZERO,
                source: 'sdk'
            }
        )

        const ix = SvmSrcEscrowFactory.DEFAULT.createOrder(order, {
            srcTokenProgramId: SolanaAddress.TOKEN_2022_PROGRAM_ID
        })

        const parsedIx = SvmSrcEscrowFactory.parseCreateInstruction(ix)

        const reCreatedOrder = SvmCrossChainOrder.fromContractOrder(
            parsedIx,
            auction
        )

        expect(order.toJSON()).toEqual(reCreatedOrder.toJSON())
        expect(order.getOrderHash(NetworkEnum.SOLANA)).toEqual(
            reCreatedOrder.getOrderHash(NetworkEnum.SOLANA)
        )
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
            token: SolanaAddress.fromBigInt(200n),
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
        const resolver = SolanaAddress.fromBigInt(400n)

        const ix = SvmSrcEscrowFactory.DEFAULT.withdrawPublic(
            immutables,
            secret,
            resolver,
            {
                tokenProgramId: SolanaAddress.TOKEN_2022_PROGRAM_ID
            }
        )

        expect(ix).toMatchSnapshot()
    })

    it('should parse create escrow instruction', async () => {
        const auction = new AuctionDetails({
            startTime: 1752739636n,
            initialRateBump: 100_000,
            duration: 120n,
            points: [
                {delay: 12, coefficient: 80_000},
                {delay: 24, coefficient: 50_000}
            ]
        })

        const secretHashes = [
            '0x4a52dc502242a54e1d3a609cb31e0160a504d9a26467fcf9a52b7a79060ef8f1',
            '0x1a52dc502242a54e1d3a609cb31e0160a504d9a26467fcf9a52b7a79060ef8f2',
            '0x3a52dc502242a54e1d3a609cb31e0160a504d9a26467fcf9a52b7a79060ef8f4',
            '0x5a52dc502242a54e1d3a609cb31e0160a504d9a26467fcf9a52b7a79060ef8f6'
        ]

        const merkleLeafs =
            HashLock.getMerkleLeavesFromSecretHashes(secretHashes)

        const hashLock = HashLock.forMultipleFills(merkleLeafs)

        const order = SvmCrossChainOrder.new(
            // 1 WETH [solana] -> 1000 USDC [ethereum]
            {
                maker: SolanaAddress.fromBigInt(1n),
                receiver: EvmAddress.fromBigInt(2n),
                srcToken: SolanaAddress.fromBigInt(3n),
                dstToken: EvmAddress.fromBigInt(4n), // address on dst chain
                srcAmount: parseEther('1'),
                minDstAmount: parseUnits('1000', 6)
            },
            {
                srcChainId: NetworkEnum.SOLANA,
                dstChainId: NetworkEnum.ETHEREUM,
                srcSafetyDeposit: 1000n,
                dstSafetyDeposit: 2000n,
                timeLocks: TimeLocks.fromDurations({
                    srcFinalityLock: 10n,
                    srcPrivateWithdrawal: 200n,
                    srcPublicWithdrawal: 100n,
                    srcPrivateCancellation: 150n,
                    dstFinalityLock: 20n,
                    dstPrivateWithdrawal: 300n,
                    dstPublicWithdrawal: 400n
                }),
                hashLock
            },
            {
                auction
            },
            {
                allowMultipleFills: true,
                salt: 0x535n,
                orderExpirationDelay: 24n,
                resolverCancellationConfig:
                    ResolverCancellationConfig.ALMOST_ZERO,
                source: 'sdk'
            }
        )

        const taker = new SolanaAddress(
            'HjwhnenGQ2t24yVcDJ6uhXixY47UzsypsQaFuPZZJh6E'
        )

        const fillAmount = order.makingAmount / 2n

        const ix = SvmSrcEscrowFactory.DEFAULT.createEscrow(
            order.toSrcImmutables(
                NetworkEnum.SOLANA,
                taker,
                fillAmount,
                HashLock.fromString(secretHashes[1])
            ),
            auction,
            {
                tokenProgramId: SolanaAddress.TOKEN_2022_PROGRAM_ID,
                merkleProof: {
                    proof: HashLock.getProof(merkleLeafs, 1),
                    idx: 1,
                    secretHash: bufferFromHex(secretHashes[1])
                }
            }
        )

        const parsedIx = SvmSrcEscrowFactory.parseCreateEscrowInstruction(ix)

        expect(parsedIx.amount).toEqual(fillAmount)
        expect(parsedIx.dutchAuctionData.toJSON()).toEqual(auction.toJSON())
        expect(parsedIx.merkleProof!.index).toEqual(1)
        expect(parsedIx.merkleProof!.hashedSecret).toEqual(secretHashes[1])
        expect(parsedIx.merkleProof!.proof).toEqual([
            '0x7a9cfaa16d89b92cb2e8e22fdb6042ec9439f3c3c8ca8565cbe3cd237f2d9e2c',
            '0x2f4f2437bc342f8ca7ce9889040d05d092a3ce902daa0b51c2b896c9a207dcd9'
        ])
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
                '4519513249946090673914462965909562690094454064409420748554250'
        })

        const secret = randomBytes(32)

        const ix = SvmSrcEscrowFactory.DEFAULT.withdrawPrivate(
            immutables,
            secret,
            {
                tokenProgramId: SolanaAddress.TOKEN_2022_PROGRAM_ID
            }
        )

        const parsed = SvmSrcEscrowFactory.parsePrivateWithdrawInstruction(ix)
        expect(parsed.secret).toEqual('0x' + secret.toString('hex'))
    })

    it('should parse publicWithdraw instruction', async () => {
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
                '4519513249946090673914462965909562690094454064409420748554250'
        })

        const secret = randomBytes(32)

        const ix = SvmSrcEscrowFactory.DEFAULT.withdrawPublic(
            immutables,
            secret,
            immutables.taker,
            {
                tokenProgramId: SolanaAddress.TOKEN_2022_PROGRAM_ID
            }
        )

        const parsed = SvmSrcEscrowFactory.parsePublicWithdrawInstruction(ix)
        expect(parsed.secret).toEqual('0x' + secret.toString('hex'))
    })

    it('should generate cancelPrivate instruction', () => {
        const immutables = Immutables.new({
            orderHash: Buffer.from(
                '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
                'hex'
            ),
            hashLock: HashLock.forSingleFill(
                '0x4a52dc502242a54e1d3a609cb31e0160a504d9a26467fcf9a52b7a79060ef8f1'
            ),
            taker: SolanaAddress.fromBigInt(100n),
            token: SolanaAddress.fromBigInt(200n),
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

        const ix = SvmSrcEscrowFactory.DEFAULT.cancelPrivate(immutables, {
            tokenProgramId: SolanaAddress.TOKEN_2022_PROGRAM_ID
        })

        expect(ix).toMatchSnapshot()
    })

    it('should generate cancelPublic instruction', () => {
        const immutables = Immutables.new({
            orderHash: Buffer.from(
                '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
                'hex'
            ),
            hashLock: HashLock.forSingleFill(
                '0x4a52dc502242a54e1d3a609cb31e0160a504d9a26467fcf9a52b7a79060ef8f1'
            ),
            taker: SolanaAddress.fromBigInt(100n),
            token: SolanaAddress.fromBigInt(200n),
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

        const payer = SolanaAddress.fromBigInt(400n)

        const ix = SvmSrcEscrowFactory.DEFAULT.cancelPublic(immutables, payer, {
            tokenProgramId: SolanaAddress.TOKEN_2022_PROGRAM_ID
        })

        expect(ix).toMatchSnapshot()
    })
})
