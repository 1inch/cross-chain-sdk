import {parseEther, parseUnits} from 'ethers'
import {SvmSrcEscrowFactory} from './svm-src-escrow-factory'
import {NetworkEnum} from '../../chains'
import {SvmCrossChainOrder} from '../../cross-chain-order/svm/svm-cross-chain-order'
import {EvmAddress, SolanaAddress} from '../../domains/addresses'
import {HashLock} from '../../domains/hash-lock'
import {TimeLocks} from '../../domains/time-locks'
import {AuctionDetails} from '../../domains/auction-details'
import {ResolverCancellationConfig} from '../../cross-chain-order'
import {Immutables} from '../../domains/immutables'

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

        const parsedIx = await SvmSrcEscrowFactory.parseCreateInstruction(ix)

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
                // {delay: 12, coefficient: 80_000},
                // {delay: 24, coefficient: 50_000}
            ]
        })

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

        const taker = new SolanaAddress(
            'HjwhnenGQ2t24yVcDJ6uhXixY47UzsypsQaFuPZZJh6E'
        )

        const ix = SvmSrcEscrowFactory.DEFAULT.createEscrow(
            order.toSrcImmutables(
                NetworkEnum.SOLANA,
                taker,
                order.makingAmount
            ),
            auction,
            {
                tokenProgramId: SolanaAddress.TOKEN_2022_PROGRAM_ID
            }
        )

        const parsedIx =
            await SvmSrcEscrowFactory.parseDeploySrcEscrowInstruction(ix)

        console.log(
            JSON.stringify(
                parsedIx,
                (_, value) =>
                    typeof value === 'bigint' ? value.toString() : value,
                2
            )
        )
    })
})
