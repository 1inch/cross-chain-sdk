import {UINT_40_MAX} from '@1inch/byte-utils'
import {AuctionWhitelistItem, randBigInt} from '@1inch/fusion-sdk'
import assert from 'assert'
import {CrossChainOrderParamsData} from './types'
import {EvmAddress as Address} from '../../../domains/addresses'
import {TimeLocks} from '../../../domains/time-locks'
import {Cost, PresetEnum, QuoterResponse, TimeLocksRaw} from '../types'
import {Preset} from '../preset'
import {QuoterRequest} from '../quoter.request'
import {EvmCrossChainOrder} from '../../../cross-chain-order/evm'
import {isEvm, SupportedChain} from '../../../chains'

export class Quote {
    public readonly quoteId: string | null

    public readonly srcTokenAmount: bigint

    public readonly dstTokenAmount: bigint

    public readonly presets: {
        [PresetEnum.fast]: Preset
        [PresetEnum.slow]: Preset
        [PresetEnum.medium]: Preset
        [PresetEnum.custom]?: Preset
    }

    public readonly srcEscrowFactory: Address

    public readonly dstEscrowFactory: Address

    public readonly timeLocks: TimeLocksRaw

    public readonly srcSafetyDeposit: bigint

    public readonly dstSafetyDeposit: bigint

    public readonly whitelist: Address[]

    public readonly recommendedPreset: PresetEnum

    public readonly prices: Cost

    public readonly volume: Cost

    public readonly slippage: number

    constructor(
        private readonly params: QuoterRequest,
        response: QuoterResponse
    ) {
        this.srcTokenAmount = BigInt(response.srcTokenAmount)
        this.dstTokenAmount = BigInt(response.dstTokenAmount)
        this.presets = {
            [PresetEnum.fast]: new Preset(response.presets.fast),
            [PresetEnum.medium]: new Preset(response.presets.medium),
            [PresetEnum.slow]: new Preset(response.presets.slow),
            [PresetEnum.custom]: response.presets.custom
                ? new Preset(response.presets.custom)
                : undefined
        }
        this.timeLocks = response.timeLocks
        this.srcSafetyDeposit = BigInt(response.srcSafetyDeposit)
        this.dstSafetyDeposit = BigInt(response.dstSafetyDeposit)
        this.prices = response.prices
        this.volume = response.volume
        this.quoteId = response.quoteId
        this.whitelist = response.whitelist.map((a) => Address.fromString(a))
        this.recommendedPreset = response.recommendedPreset
        this.slippage = response.autoK
        this.srcEscrowFactory = Address.fromString(response.srcEscrowFactory)
        this.dstEscrowFactory = Address.fromString(response.dstEscrowFactory)
    }

    get srcChainId(): SupportedChain {
        return this.params.srcChain
    }

    get dstChainId(): SupportedChain {
        return this.params.dstChain
    }

    createOrder(params: CrossChainOrderParamsData): EvmCrossChainOrder {
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
            ? Address.NATIVE
            : this.params.dstTokenAddress

        // todo: build order based on src chain
        assert(isEvm(this.params.srcChain))

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

    getPreset(type = this.recommendedPreset): Preset {
        return this.presets[type] as Preset
    }

    private getWhitelist(
        auctionStartTime: bigint,
        exclusiveResolver?: Address
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
