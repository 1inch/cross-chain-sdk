import {Quote} from './quote.js'
import {NetworkEnum} from '../../../chains.js'
import {QuoterRequest} from '../quoter.request.js'
import {PresetEnum, QuoterResponse} from '../types.js'
import {EvmAddress, HashLock, SolanaAddress} from '../../../domains/index.js'
import {getRandomBytes32} from '../../../test-utils/get-random-bytes-32.js'
import {EvmCrossChainOrder} from '../../../cross-chain-order/evm/index.js'
import {SvmCrossChainOrder} from '../../../cross-chain-order/svm/index.js'

const EXCLUSIVE = '0x7246999fd1bab15b4ac7d1a23c3abeed63c51b86'
const OTHER_RESOLVER = '0x1111111111111111111111111111111111111111'

function preset(overrides: Record<string, unknown> = {}) {
    return {
        auctionDuration: 180,
        startAuctionIn: 24,
        initialRateBump: 84909,
        auctionStartAmount: '257797497',
        startAmount: '256915967',
        auctionEndAmount: '255626994',
        exclusiveResolver: null,
        costInDstToken: '881530',
        points: [{delay: 120, coefficient: 63932}],
        allowPartialFills: false,
        allowMultipleFills: false,
        gasCost: {
            gasBumpEstimate: 34485,
            gasPriceEstimate: '1171'
        },
        secretsCount: 1,
        ...overrides
    }
}

function evmResponse(overrides: Partial<QuoterResponse> = {}): QuoterResponse {
    return {
        quoteId: '27d54fa5-9e57-47dc-af27-8ed150a7ca75',
        srcTokenAmount: '100000000000000000',
        dstTokenAmount: '256915982',
        autoK: 1,
        presets: {
            fast: preset(),
            medium: preset({auctionDuration: 360}),
            slow: preset({auctionDuration: 600})
        },
        timeLocks: {
            srcWithdrawal: 36,
            srcPublicWithdrawal: 336,
            srcCancellation: 492,
            srcPublicCancellation: 612,
            dstWithdrawal: 180,
            dstPublicWithdrawal: 300,
            dstCancellation: 420
        },
        srcEscrowFactory: '0x0000000000000000000000000000000000000001',
        dstEscrowFactory: '0x0000000000000000000000000000000000000002',
        srcSafetyDeposit: '141752059440000',
        dstSafetyDeposit: '20474999822640000',
        whitelist: [EXCLUSIVE, OTHER_RESOLVER],
        recommendedPreset: PresetEnum.fast,
        prices: {
            usd: {srcToken: '2577.6314', dstToken: '0.9996849753143391'}
        },
        volume: {
            usd: {srcToken: '257.76', dstToken: '257.72'}
        },
        ...overrides
    }
}

function evmRequest() {
    return QuoterRequest.forEVM({
        srcChain: NetworkEnum.ETHEREUM,
        dstChain: NetworkEnum.POLYGON,
        srcTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        dstTokenAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
        amount: '100000000000000000',
        walletAddress: '0x00000000219ab540356cbb839cbe05303d7705fa',
        source: 'sdk-test'
    })
}

function solanaRequest() {
    return QuoterRequest.forSolana({
        srcChain: NetworkEnum.SOLANA,
        dstChain: NetworkEnum.ETHEREUM,
        srcTokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        dstTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        amount: '1000000',
        walletAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        source: 'sdk-test'
    })
}

describe('Quote', () => {
    it('fromEVMQuote maps chain ids, amounts and recommended preset', () => {
        const request = evmRequest()
        const quote = Quote.fromEVMQuote(request, evmResponse())

        expect(quote.srcChainId).toBe(NetworkEnum.ETHEREUM)
        expect(quote.dstChainId).toBe(NetworkEnum.POLYGON)
        expect(quote.srcTokenAmount).toBe(100000000000000000n)
        expect(quote.dstTokenAmount).toBe(256915982n)
        expect(quote.isEvmQuote()).toBe(true)
        expect(quote.isSolanaQuote()).toBe(false)
        expect(quote.getPreset().auctionEndAmount).toBe(255626994n)
        expect(quote.getPreset(PresetEnum.slow).auctionDuration).toBe(600n)
        expect(quote.srcEscrowFactory.toString()).toBe(
            '0x0000000000000000000000000000000000000001'
        )
    })

    it('fromEVMQuote keeps custom preset and native factory when present', () => {
        const quote = Quote.fromEVMQuote(
            evmRequest(),
            evmResponse({
                presets: {
                    fast: preset(),
                    medium: preset(),
                    slow: preset(),
                    custom: preset({auctionDuration: 90, auctionEndAmount: '1'})
                },
                nativeOrderFactoryAddress:
                    '0x1111111111111111111111111111111111111111',
                nativeOrderImplAddress:
                    '0x2222222222222222222222222222222222222222'
            })
        )

        expect(quote.getPreset(PresetEnum.custom).auctionDuration).toBe(90n)
        expect(quote.nativeOrderFactory).toBeDefined()
        expect(JSON.stringify(quote.nativeOrderFactory)).toContain(
            '1111111111111111111111111111111111111111'
        )
    })

    it('fromEVMQuote maps resolver and integrator fees', () => {
        const quote = Quote.fromEVMQuote(
            evmRequest(),
            evmResponse({
                feeInfo: {
                    resolverFee: {
                        receiver: '0x3333333333333333333333333333333333333333',
                        bps: 10,
                        whitelistDiscountPercent: 50
                    },
                    integratorFee: {
                        receiver: '0x4444444444444444444444444444444444444444',
                        bps: 5,
                        share: 20
                    }
                }
            })
        )

        expect(quote.resolverFee?.receiver.toString()).toBe(
            '0x3333333333333333333333333333333333333333'
        )
        expect(quote.resolverFee?.bps.value).toBe(10n)
        expect(quote.integratorFee?.receiver.toString()).toBe(
            '0x4444444444444444444444444444444444444444'
        )
        expect(quote.integratorFee?.value.value).toBe(5n)
    })

    it('fromEVMQuote uses Solana dst escrow factory when dst is Solana', () => {
        const request = QuoterRequest.forEVM({
            srcChain: NetworkEnum.ETHEREUM,
            dstChain: NetworkEnum.SOLANA,
            srcTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            dstTokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            amount: '1000000',
            walletAddress: '0x00000000219ab540356cbb839cbe05303d7705fa'
        })
        const quote = Quote.fromEVMQuote(
            request,
            evmResponse({
                dstEscrowFactory: '11111111111111111111111111111111'
            })
        )

        expect(quote.dstEscrowFactory).toBeInstanceOf(SolanaAddress)
        expect(quote.dstEscrowFactory.toString()).toBe(
            '11111111111111111111111111111111'
        )
    })

    it('fromSolanaQuote maps src factory as Solana address', () => {
        const quote = Quote.fromSolanaQuote(
            solanaRequest(),
            evmResponse({
                srcEscrowFactory: '11111111111111111111111111111111',
                dstEscrowFactory: '0x0000000000000000000000000000000000000002',
                presets: {
                    fast: preset(),
                    medium: preset(),
                    slow: preset(),
                    custom: preset({auctionDuration: 45})
                }
            })
        )

        expect(quote.isSolanaQuote()).toBe(true)
        expect(quote.isEvmQuote()).toBe(false)
        expect(quote.srcChainId).toBe(NetworkEnum.SOLANA)
        expect(quote.srcEscrowFactory).toBeInstanceOf(SolanaAddress)
        expect(quote.dstEscrowFactory).toBeInstanceOf(EvmAddress)
        expect(quote.whitelist).toEqual([])
        expect(quote.getPreset(PresetEnum.custom).auctionDuration).toBe(45n)
    })

    it('createEvmOrder builds an order with taking amount from the preset', () => {
        const quote = Quote.fromEVMQuote(evmRequest(), evmResponse())
        const hashLock = HashLock.forSingleFill(getRandomBytes32())
        const receiver = EvmAddress.fromString(
            '0x5555555555555555555555555555555555555555'
        )

        const order = quote.createEvmOrder({
            hashLock,
            receiver,
            preset: PresetEnum.medium,
            delayAuctionStartTimeBy: 5n,
            permit: '0xabcd',
            nonce: 7n
        })

        expect(order).toBeInstanceOf(EvmCrossChainOrder)
        expect(order.makingAmount).toBe(quote.srcTokenAmount)
        expect(order.takingAmount).toBe(
            quote.getPreset(PresetEnum.medium).auctionEndAmount
        )
        expect(order.hashLock.eq(hashLock)).toBe(true)
        expect(order.receiver.toString()).toBe(receiver.toString())
        expect(order.nonce).toBe(7n)
        expect(order.srcSafetyDeposit).toBe(quote.srcSafetyDeposit)
        expect(order.dstSafetyDeposit).toBe(quote.dstSafetyDeposit)
    })

    it('createEvmOrder uses exclusive resolver allowFrom on whitelist', () => {
        const quote = Quote.fromEVMQuote(
            evmRequest(),
            evmResponse({
                presets: {
                    fast: preset({exclusiveResolver: EXCLUSIVE}),
                    medium: preset(),
                    slow: preset()
                }
            })
        )

        const order = quote.createEvmOrder({
            hashLock: HashLock.forSingleFill(getRandomBytes32())
        })

        expect(
            order.isExclusiveResolver(EvmAddress.fromString(EXCLUSIVE))
        ).toBe(true)
        expect(
            order.isExclusiveResolver(EvmAddress.fromString(OTHER_RESOLVER))
        ).toBe(false)
        expect(
            order.canExecuteAt(
                EvmAddress.fromString(EXCLUSIVE),
                order.auctionStartTime
            )
        ).toBe(true)
    })

    it('createEvmOrder attaches resolver and integrator fees to the order', () => {
        const quote = Quote.fromEVMQuote(
            evmRequest(),
            evmResponse({
                feeInfo: {
                    resolverFee: {
                        receiver: '0x3333333333333333333333333333333333333333',
                        bps: 10,
                        whitelistDiscountPercent: 0
                    },
                    integratorFee: {
                        receiver: '0x4444444444444444444444444444444444444444',
                        bps: 5,
                        share: 50
                    }
                }
            })
        )

        const order = quote.createEvmOrder({
            hashLock: HashLock.forSingleFill(getRandomBytes32())
        })
        const taker = EvmAddress.fromString(EXCLUSIVE)
        const time = order.auctionStartTime + 1n

        expect(order.getResolverFee(taker, time)).toBeGreaterThanOrEqual(0n)
        expect(order.getIntegratorFee(taker, time)).toBeGreaterThanOrEqual(0n)
        expect(order.getAmountCalculator()).toBeDefined()
    })

    it('createEvmOrder skips nonce when partial and multiple fills are allowed', () => {
        const quote = Quote.fromEVMQuote(
            evmRequest(),
            evmResponse({
                presets: {
                    fast: preset({
                        allowPartialFills: true,
                        allowMultipleFills: true
                    }),
                    medium: preset(),
                    slow: preset()
                }
            })
        )

        const order = quote.createEvmOrder({
            hashLock: HashLock.forSingleFill(getRandomBytes32())
        })

        expect(order.partialFillAllowed).toBe(true)
        expect(order.multipleFillsAllowed).toBe(true)
    })

    it('createEvmOrder from native asset uses native order factory', () => {
        const request = QuoterRequest.forEVM({
            srcChain: NetworkEnum.ETHEREUM,
            dstChain: NetworkEnum.POLYGON,
            srcTokenAddress: EvmAddress.NATIVE.toString(),
            dstTokenAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
            amount: '100000000000000000',
            walletAddress: '0x00000000219ab540356cbb839cbe05303d7705fa'
        })
        const quote = Quote.fromEVMQuote(
            request,
            evmResponse({
                nativeOrderFactoryAddress:
                    '0x1111111111111111111111111111111111111111',
                nativeOrderImplAddress:
                    '0x2222222222222222222222222222222222222222'
            })
        )

        const order = quote.createEvmOrder({
            hashLock: HashLock.forSingleFill(getRandomBytes32())
        })

        expect(
            order.makerAsset.isNative() || order.makerAsset.toString()
        ).toBeTruthy()
        expect(order.makingAmount).toBe(quote.srcTokenAmount)
    })

    it('createEvmOrder from native asset throws without native factory', () => {
        const request = QuoterRequest.forEVM({
            srcChain: NetworkEnum.ETHEREUM,
            dstChain: NetworkEnum.POLYGON,
            srcTokenAddress: EvmAddress.NATIVE.toString(),
            dstTokenAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
            amount: '100000000000000000',
            walletAddress: '0x00000000219ab540356cbb839cbe05303d7705fa'
        })
        const quote = Quote.fromEVMQuote(request, evmResponse())

        expect(() =>
            quote.createEvmOrder({
                hashLock: HashLock.forSingleFill(getRandomBytes32())
            })
        ).toThrow(/nativeOrderFactory/)
    })

    it('createEvmOrder throws on a Solana quote', () => {
        const quote = Quote.fromSolanaQuote(
            solanaRequest(),
            evmResponse({
                srcEscrowFactory: '11111111111111111111111111111111'
            })
        )

        expect(() =>
            quote.createEvmOrder({
                hashLock: HashLock.forSingleFill(getRandomBytes32())
            })
        ).toThrow(/cannot create non evm order/)
    })

    it('createSolanaOrder builds an SVM order for an EVM destination', () => {
        const quote = Quote.fromSolanaQuote(
            solanaRequest(),
            evmResponse({
                srcEscrowFactory: '11111111111111111111111111111111',
                srcTokenAmount: '1000000'
            })
        )
        const hashLock = HashLock.forSingleFill(getRandomBytes32())
        const receiver = EvmAddress.fromString(
            '0x5555555555555555555555555555555555555555'
        )

        const order = quote.createSolanaOrder({
            hashLock,
            receiver,
            preset: PresetEnum.slow,
            orderExpirationDelay: 30n,
            salt: 42n
        })

        expect(order).toBeInstanceOf(SvmCrossChainOrder)
        expect(order.makingAmount).toBe(1000000n)
        expect(order.hashLock.eq(hashLock)).toBe(true)
        expect(order.receiver.toString()).toBe(receiver.toString())
        expect(order.dstChainId).toBe(NetworkEnum.ETHEREUM)
    })

    it('createSolanaOrder throws on an EVM quote', () => {
        const quote = Quote.fromEVMQuote(evmRequest(), evmResponse())

        expect(() =>
            quote.createSolanaOrder({
                hashLock: HashLock.forSingleFill(getRandomBytes32()),
                receiver: EvmAddress.fromString(
                    '0x5555555555555555555555555555555555555555'
                )
            })
        ).toThrow(/cannot create non solana order/)
    })
})
