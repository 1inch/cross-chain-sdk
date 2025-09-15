import {
    FusionOrder,
    ProxyFactory,
    Address,
    Details,
    Extra,
    OrderInfoData as FusionOrderInfoData
} from '@1inch/fusion-sdk'
import {EscrowExtension} from './escrow-extension.js'
import {EvmExtra, OrderInfoData} from './types.js'
import {EvmAddress} from '../../domains/index.js'

/**
 * Inner order class, not intended for public usage
 */
export class InnerOrder extends FusionOrder {
    public readonly escrowExtension: EscrowExtension

    public constructor(
        extension: EscrowExtension,
        orderInfo: OrderInfoData,
        extra?: EvmExtra
    ) {
        super(
            extension.address,
            {
                ...orderInfo,
                makerAsset: orderInfo.makerAsset?.inner,
                takerAsset: orderInfo.takerAsset?.inner,
                maker: orderInfo.maker?.inner,
                receiver: orderInfo.receiver?.inner
            },
            extension.auctionDetails,
            extension.postInteractionData,
            extra,
            extension
        )

        this.escrowExtension = extension
    }

    /**
     * Create InnerOrder from native asset
     */
    public static fromNative(
        chainId: number,
        ethOrdersFactory: ProxyFactory,
        settlementExtension: Address,
        orderInfo: Omit<FusionOrderInfoData, 'makerAsset'>,
        details: Details,
        extra?: Extra
    ): InnerOrder {
        const nativeOrder = FusionOrder.fromNative(
            chainId,
            ethOrdersFactory,
            settlementExtension,
            {
                takerAsset: orderInfo.takerAsset,
                makingAmount: orderInfo.makingAmount,
                takingAmount: orderInfo.takingAmount,
                maker: orderInfo.maker,
                salt: orderInfo.salt,
                receiver: orderInfo.receiver
            },
            {
                auction: details.auction,
                whitelist: details.whitelist.map((item) => ({
                    address: item.address,
                    allowFrom: item.allowFrom
                })),
                resolvingStartTime: details.resolvingStartTime
            },
            extra
        )

        const escrowExtension = EscrowExtension.fromExtension(
            nativeOrder.extension
        )

        return new InnerOrder(
            escrowExtension,
            {
                makerAsset: new EvmAddress(nativeOrder.makerAsset),
                takerAsset: new EvmAddress(nativeOrder.takerAsset),
                makingAmount: nativeOrder.makingAmount,
                takingAmount: nativeOrder.takingAmount,
                maker: new EvmAddress(nativeOrder.maker),
                salt: nativeOrder.salt,
                receiver: new EvmAddress(nativeOrder.receiver)
            },
            extra
        )
    }
}
