import {UINT_40_MAX} from '@1inch/byte-utils'
import {randBigInt} from '@1inch/fusion-sdk'
import assert from 'assert'
import {
    EvmCrossChainOrderParamsData,
    Presets,
    SvmCrossChainOrderParamsData
} from './types'
import {SvmCrossChainOrder} from '../../../cross-chain-order'
import {EvmAddress, SolanaAddress} from '../../../domains/addresses'
import {TimeLocks} from '../../../domains/time-locks'
import {Cost, PresetEnum, QuoterResponse, TimeLocksRaw} from '../types'
import {Preset} from '../preset'
import {QuoterRequest} from '../quoter.request'
import {EvmCrossChainOrder} from '../../../cross-chain-order/evm'
import {
    EvmChain,
    isEvm,
    isSolana,
    SolanaChain,
    SupportedChain
} from '../../../chains'
import {AuctionWhitelistItem} from '../../../cross-chain-order/evm/types'
import {AddressForChain} from '../../../type-utils'

type Whitelist<SrcChain extends SupportedChain> = SrcChain extends EvmChain
    ? EvmAddress[]
    : []

export class Quote<
    SrcChain extends SupportedChain = SupportedChain,
    DstChain extends SupportedChain = SupportedChain
> {
    // eslint-disable-next-line max-params
    private constructor(
        public readonly params: QuoterRequest<SrcChain, DstChain>,
        public readonly quoteId: string | null,
        public readonly srcTokenAmount: bigint,
        public readonly dstTokenAmount: bigint,
        public readonly presets: Presets,
        public readonly srcEscrowFactory: AddressForChain<SrcChain>,
        public readonly dstEscrowFactory: AddressForChain<DstChain>,
        public readonly timeLocks: TimeLocksRaw,
        public readonly srcSafetyDeposit: bigint,
        public readonly dstSafetyDeposit: bigint,
        public readonly whitelist: Whitelist<SrcChain>,
        public readonly recommendedPreset: PresetEnum,
        public readonly prices: Cost,
        public readonly volume: Cost,
        public readonly slippage: number
    ) {}

    get srcChainId(): SrcChain {
        return this.params.srcChain
    }

    get dstChainId(): DstChain {
        return this.params.dstChain
    }

    static fromEVMQuote(
        request: QuoterRequest<EvmChain>,
        response: QuoterResponse
    ): Quote<EvmChain> {
        const presets = {
            [PresetEnum.fast]: new Preset(response.presets.fast),
            [PresetEnum.medium]: new Preset(response.presets.medium),
            [PresetEnum.slow]: new Preset(response.presets.slow),
            [PresetEnum.custom]: response.presets.custom
                ? new Preset(response.presets.custom)
                : undefined
        }

        const dstEscrowFactory = isEvm(request.dstChain)
            ? EvmAddress.fromString(response.dstEscrowFactory)
            : SolanaAddress.fromString(response.dstEscrowFactory)

        return new Quote<EvmChain>(
            request,
            response.quoteId,
            BigInt(response.srcTokenAmount),
            BigInt(response.dstTokenAmount),
            presets,
            EvmAddress.fromString(response.srcEscrowFactory),
            dstEscrowFactory,
            response.timeLocks,
            BigInt(response.srcSafetyDeposit),
            BigInt(response.dstSafetyDeposit),
            response.whitelist.map((w) => EvmAddress.fromString(w)),
            response.recommendedPreset,
            response.prices,
            response.volume,
            response.autoK
        )
    }

    static fromSolanaQuote(
        request: QuoterRequest<SolanaChain>,
        response: QuoterResponse
    ): Quote<SolanaChain> {
        const presets = {
            [PresetEnum.fast]: new Preset(response.presets.fast),
            [PresetEnum.medium]: new Preset(response.presets.medium),
            [PresetEnum.slow]: new Preset(response.presets.slow),
            [PresetEnum.custom]: response.presets.custom
                ? new Preset(response.presets.custom)
                : undefined
        }

        const dstEscrowFactory = isEvm(request.dstChain)
            ? EvmAddress.fromString(response.dstEscrowFactory)
            : SolanaAddress.fromString(response.dstEscrowFactory)

        return new Quote<SolanaChain>(
            request,
            response.quoteId,
            BigInt(response.srcTokenAmount),
            BigInt(response.dstTokenAmount),
            presets,
            SolanaAddress.fromString(response.srcEscrowFactory),
            dstEscrowFactory,
            response.timeLocks,
            BigInt(response.srcSafetyDeposit),
            BigInt(response.dstSafetyDeposit),
            [],
            response.recommendedPreset,
            response.prices,
            response.volume,
            response.autoK
        )
    }

    public createEvmOrder(
        params: EvmCrossChainOrderParamsData
    ): EvmCrossChainOrder {
        assert(this.isEvmQuote(), 'cannot create non evm order')

        const preset = this.getPreset(params?.preset || this.recommendedPreset)

        const auctionDetails = preset.createAuctionDetails(
            params.delayAuctionStartTimeBy
        )

        const allowPartialFills = preset.allowPartialFills
        const allowMultipleFills = preset.allowMultipleFills
        const isNonceRequired = !allowPartialFills || !allowMultipleFills

        const nonce = isNonceRequired
            ? (params.nonce ?? randBigInt(UINT_40_MAX))
            : params.nonce

        const takerAsset = this.params.dstTokenAddress.isNative()
            ? EvmAddress.NATIVE
            : this.params.dstTokenAddress

        return EvmCrossChainOrder.new(
            this.srcEscrowFactory,
            {
                makerAsset: this.params.srcTokenAddress,
                takerAsset: takerAsset,
                makingAmount: this.srcTokenAmount,
                takingAmount: preset.auctionEndAmount,
                maker: this.params.walletAddress,
                receiver: params.receiver
            },
            {
                hashLock: params.hashLock,
                srcChainId: this.params.srcChain,
                dstChainId: this.params.dstChain,
                srcSafetyDeposit: this.srcSafetyDeposit,
                dstSafetyDeposit: this.dstSafetyDeposit,
                timeLocks: TimeLocks.new({
                    srcWithdrawal: BigInt(this.timeLocks.srcWithdrawal),
                    srcPublicWithdrawal: BigInt(
                        this.timeLocks.srcPublicWithdrawal
                    ),
                    srcCancellation: BigInt(this.timeLocks.srcCancellation),
                    srcPublicCancellation: BigInt(
                        this.timeLocks.srcPublicCancellation
                    ),
                    dstWithdrawal: BigInt(this.timeLocks.dstWithdrawal),
                    dstPublicWithdrawal: BigInt(
                        this.timeLocks.dstPublicWithdrawal
                    ),
                    dstCancellation: BigInt(this.timeLocks.dstCancellation)
                })
            },
            {
                auction: auctionDetails,
                whitelist: this.getWhitelist(
                    auctionDetails.startTime,
                    preset.exclusiveResolver
                )
            },
            {
                nonce,
                permit: params.permit,
                allowPartialFills,
                allowMultipleFills,
                orderExpirationDelay: params?.orderExpirationDelay,
                source: this.params.source,
                enablePermit2: params.isPermit2
            }
        )
    }

    public createSolanaOrder(
        params: SvmCrossChainOrderParamsData
    ): SvmCrossChainOrder {
        assert(this.isSolanaQuote(), 'cannot create non solana order')
        assert(
            this.params.dstTokenAddress instanceof EvmAddress,
            'dstToken must be evm address'
        )

        const preset = this.getPreset(params?.preset || this.recommendedPreset)

        const auctionDetails = preset.createAuctionDetails(
            params.delayAuctionStartTimeBy
        )

        const allowMultipleFills = preset.allowMultipleFills

        return SvmCrossChainOrder.new(
            {
                srcToken: this.params.srcTokenAddress,
                dstToken: this.params.dstTokenAddress,
                srcAmount: this.srcTokenAmount,
                minDstAmount: preset.auctionEndAmount,
                maker: this.params.walletAddress,
                receiver: params.receiver
            },
            {
                hashLock: params.hashLock,
                srcChainId: this.params.srcChain,
                dstChainId: this.params.dstChain,
                srcSafetyDeposit: this.srcSafetyDeposit,
                dstSafetyDeposit: this.dstSafetyDeposit,
                timeLocks: TimeLocks.new({
                    srcWithdrawal: BigInt(this.timeLocks.srcWithdrawal),
                    srcPublicWithdrawal: BigInt(
                        this.timeLocks.srcPublicWithdrawal
                    ),
                    srcCancellation: BigInt(this.timeLocks.srcCancellation),
                    srcPublicCancellation: BigInt(
                        this.timeLocks.srcPublicCancellation
                    ),
                    dstWithdrawal: BigInt(this.timeLocks.dstWithdrawal),
                    dstPublicWithdrawal: BigInt(
                        this.timeLocks.dstPublicWithdrawal
                    ),
                    dstCancellation: BigInt(this.timeLocks.dstCancellation)
                })
            },
            {
                auction: auctionDetails
            },
            {
                allowMultipleFills,
                orderExpirationDelay: params?.orderExpirationDelay,
                source: this.params.source,
                resolverCancellationConfig: params?.resolverCancellationConfig,
                salt: params?.salt
            }
        )
    }

    isEvmQuote(): this is Quote<EvmChain> {
        return isEvm(this.params.srcChain)
    }

    isSolanaQuote(): this is Quote<SolanaChain> {
        return isSolana(this.params.srcChain)
    }

    getPreset(type = this.recommendedPreset): Preset {
        return this.presets[type] as Preset
    }

    private getWhitelist(
        auctionStartTime: bigint,
        exclusiveResolver?: EvmAddress
    ): AuctionWhitelistItem[] {
        if (exclusiveResolver) {
            return this.whitelist.map((resolver) => {
                const isExclusive = resolver.equal(exclusiveResolver)

                return {
                    address: resolver,
                    allowFrom: isExclusive ? 0n : auctionStartTime
                }
            })
        }

        return this.whitelist.map((resolver) => ({
            address: resolver,
            allowFrom: 0n
        }))
    }
}
