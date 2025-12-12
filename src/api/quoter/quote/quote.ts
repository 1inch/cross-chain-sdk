import {UINT_40_MAX} from '@1inch/byte-utils'
import {randBigInt, Fees, ResolverFee, IntegratorFee} from '@1inch/fusion-sdk'
import {ProxyFactory, Address, Bps} from '@1inch/limit-order-sdk'
import assert from 'assert'
import {
    EvmCrossChainOrderParamsData,
    Presets,
    SvmCrossChainOrderParamsData
} from './types.js'
import {
    EvmCrossChainOrderInfo,
    EvmDetails,
    EvmEscrowParams,
    EvmExtra,
    SvmCrossChainOrder
} from '../../../cross-chain-order/index.js'
import {EvmAddress, SolanaAddress} from '../../../domains/addresses/index.js'
import {TimeLocks} from '../../../domains/time-locks/index.js'
import {
    Cost,
    PresetEnum,
    QuoterResponse,
    TimeLocksRaw,
    ResolverFeeParams,
    IntegratorFeeParams
} from '../types.js'
import {Preset} from '../preset.js'
import {QuoterRequest} from '../quoter.request.js'
import {EvmCrossChainOrder} from '../../../cross-chain-order/evm/index.js'
import {
    EvmChain,
    isEvm,
    isSolana,
    SolanaChain,
    SupportedChain
} from '../../../chains.js'
import {AuctionWhitelistItem} from '../../../cross-chain-order/evm/types.js'
import {AddressForChain} from '../../../type-utils.js'

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
        public readonly slippage: number,
        public readonly nativeOrderFactory?: ProxyFactory,
        public readonly resolverFee?: ResolverFeeParams,
        public readonly integratorFee?: IntegratorFeeParams
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
            response.autoK,
            response.nativeOrderFactoryAddress &&
            response.nativeOrderImplAddress
                ? new ProxyFactory(
                      new Address(response.nativeOrderFactoryAddress),
                      new Address(response.nativeOrderImplAddress)
                  )
                : undefined,
            response?.resolverFee
                ? {
                      receiver: EvmAddress.fromString(
                          response.resolverFee.receiver
                      ),
                      bps: new Bps(BigInt(response.resolverFee.bps)),
                      whitelistDiscount: Bps.fromPercent(
                          response.resolverFee.whitelistDiscountPercent
                      )
                  }
                : undefined,
            response?.integratorFee
                ? {
                      receiver: EvmAddress.fromString(
                          response.integratorFee.receiver
                      ),
                      bps: new Bps(BigInt(response.integratorFee.bps)),
                      share: Bps.fromPercent(
                          response.integratorFee.sharePercent
                      )
                  }
                : undefined
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
            response.autoK,
            undefined // nativeOrderFactory
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

        const takerAsset = this.params.dstTokenAddress.zeroAsNative()

        const orderInfo = {
            makerAsset: this.params.srcTokenAddress,
            takerAsset: takerAsset,
            makingAmount: this.srcTokenAmount,
            takingAmount: preset.auctionEndAmount,
            maker: this.params.walletAddress,
            receiver: params.receiver
        }

        const escrowParams = {
            hashLock: params.hashLock,
            srcChainId: this.params.srcChain,
            dstChainId: this.params.dstChain,
            srcSafetyDeposit: this.srcSafetyDeposit,
            dstSafetyDeposit: this.dstSafetyDeposit,
            timeLocks: TimeLocks.new({
                srcWithdrawal: BigInt(this.timeLocks.srcWithdrawal),
                srcPublicWithdrawal: BigInt(this.timeLocks.srcPublicWithdrawal),
                srcCancellation: BigInt(this.timeLocks.srcCancellation),
                srcPublicCancellation: BigInt(
                    this.timeLocks.srcPublicCancellation
                ),
                dstWithdrawal: BigInt(this.timeLocks.dstWithdrawal),
                dstPublicWithdrawal: BigInt(this.timeLocks.dstPublicWithdrawal),
                dstCancellation: BigInt(this.timeLocks.dstCancellation)
            })
        }

        const details: EvmDetails = {
            auction: auctionDetails,
            whitelist: this.getWhitelist(
                auctionDetails.startTime,
                preset.exclusiveResolver
            ),
            fees: this.buildFees()
        }

        const extra = {
            nonce,
            permit: params.permit,
            allowPartialFills,
            allowMultipleFills,
            orderExpirationDelay: params?.orderExpirationDelay,
            source: this.params.source,
            enablePermit2: params.isPermit2
        }

        return this._createEvmOrder(
            this.srcEscrowFactory,
            orderInfo,
            escrowParams,
            details,
            extra
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

    private _createEvmOrder(
        escrowFactory: EvmAddress,
        orderInfo: EvmCrossChainOrderInfo,
        escrowParams: EvmEscrowParams,
        details: EvmDetails,
        extra?: EvmExtra
    ): EvmCrossChainOrder {
        if (this.params.srcTokenAddress.isNative()) {
            assert(
                this.nativeOrderFactory,
                'expected nativeOrderFactory to be set for order from native asset'
            )

            return EvmCrossChainOrder.fromNative(
                escrowParams.srcChainId,
                this.nativeOrderFactory,
                escrowFactory,
                orderInfo,
                details,
                escrowParams,
                extra
            )
        }

        return EvmCrossChainOrder.new(
            escrowFactory,
            orderInfo,
            escrowParams,
            details,
            extra
        )
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

    private buildFees(): Fees | undefined {
        if (!this.resolverFee && !this.integratorFee) {
            return undefined
        }

        const resolverReceiver = this.resolverFee
            ? new Address(this.resolverFee.receiver.toString())
            : Address.ZERO_ADDRESS

        const resolverFee = this.resolverFee
            ? new ResolverFee(
                  resolverReceiver,
                  this.resolverFee.bps,
                  this.resolverFee.whitelistDiscount
              )
            : ResolverFee.ZERO

        const integratorFee = this.integratorFee
            ? new IntegratorFee(
                  new Address(this.integratorFee.receiver.toString()),
                  resolverReceiver,
                  this.integratorFee.bps,
                  this.integratorFee.share
              )
            : IntegratorFee.ZERO

        if (resolverFee.fee.isZero() && integratorFee.fee.isZero()) {
            return undefined
        }

        return new Fees(resolverFee, integratorFee)
    }
}
