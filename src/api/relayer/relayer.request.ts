import {LimitOrderV4Struct} from '@1inch/fusion-sdk'
import {Jsonify} from 'type-fest'
import {SolanaOrderJSON} from 'cross-chain-order'
import {DataFor} from '../../type-utils'
import {NetworkEnum, SupportedChain} from '../../chains'

export class RelayerRequestEvm {
    public readonly order: LimitOrderV4Struct

    public readonly signature: string

    public readonly quoteId: string

    public readonly extension: string

    public readonly srcChainId: SupportedChain

    public readonly secretHashes?: string[]

    constructor(params: DataFor<RelayerRequestEvm>) {
        this.order = params.order
        this.signature = params.signature
        this.quoteId = params.quoteId
        this.extension = params.extension
        this.srcChainId = params.srcChainId
        this.secretHashes = params.secretHashes
    }

    build(): Jsonify<DataFor<RelayerRequestEvm>> {
        return {
            order: this.order,
            signature: this.signature,
            quoteId: this.quoteId,
            extension: this.extension,
            srcChainId: this.srcChainId,
            secretHashes: this.secretHashes
        }
    }
}

export class RelayerRequestSvm {
    public readonly order: SolanaOrderJSON

    public readonly auctionOrderHash: string

    public readonly quoteId: string

    public readonly secretHashes?: string[]

    constructor(params: Readonly<DataFor<RelayerRequestSvm>>) {
        this.order = params.order
        this.quoteId = params.quoteId
        this.secretHashes = params.secretHashes
        this.auctionOrderHash = params.auctionOrderHash
    }

    build(): Jsonify<DataFor<RelayerRequestEvm>> {
        const auction = this.order.details.auction

        return {
            srcChainId: NetworkEnum.SOLANA,
            dstChainId: this.order.escrowParams.dstChainId,
            auctionData: {
                startTime: Number(auction.startTime),
                duration: Number(auction.duration),
                initialRateBump: Number(auction.initialRateBump),
                pointsAndTimeDeltas: auction.points.map((p) => ({
                    rateBump: Number(p.coefficient),
                    timeDelta: Number(p.delay)
                }))
            },
            secretHashes: this.secretHashes,
            quoteId: this.quoteId,
            order: {
                hashLock: this.order.escrowParams.hashLock,
                amount: this.order.orderInfo.srcAmount,
                srcSafetyDeposit: this.order.escrowParams.srcSafetyDeposit,
                dstSafetyDeposit: this.order.escrowParams.dstSafetyDeposit,
                timeLocks: this.order.escrowParams.timeLocks,
                expirationTime: Number(this.order.extra.orderExpirationDelay),
                assetIsNative: this.order.extra.srcAssetIsNative,
                dstAmount: this.order.orderInfo.minDstAmount,
                dutchAuctionDataHash: '', // Not available in SolanaOrderJSON
                maxCancellationPremium:
                    this.order.extra.resolverCancellationConfig
                        .maxCancellationPremium,
                cancellationAuctionDuration: Number(
                    this.order.extra.resolverCancellationConfig
                        .cancellationAuctionDuration
                ),
                allowMultipleFills: this.order.extra.allowMultipleFills,
                salt: this.order.extra.salt,
                maker: this.order.orderInfo.maker,
                receiver: this.order.orderInfo.receiver,
                srcMint: this.order.orderInfo.srcToken,
                dstMint: this.order.orderInfo.dstToken
            }
        }
    }
}
