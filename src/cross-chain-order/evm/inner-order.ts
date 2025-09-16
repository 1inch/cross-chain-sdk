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
    public static fromNativeOrder(
        chainId: number,
        ethOrdersFactory: ProxyFactory,
        settlementExtension: Address,
        orderInfo: Omit<FusionOrderInfoData, 'makerAsset'>,
        details: Details,
        extension: EscrowExtension,
        extra?: Extra
    ): InnerOrder {
        const nativeOrder = InnerOrder.fromNative(
            chainId,
            ethOrdersFactory,
            settlementExtension,
            {
                takerAsset: orderInfo.takerAsset,
                makingAmount: orderInfo.makingAmount,
                takingAmount: orderInfo.takingAmount,
                maker: orderInfo.maker,
                // salt: orderInfo.salt, // todo: fix salt issue too big
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
            {...extra, optimizeReceiverAddress: false}
        )

        return new InnerOrder(
            extension,
            {
                makerAsset: new EvmAddress(nativeOrder.makerAsset),
                takerAsset: new EvmAddress(nativeOrder.takerAsset),
                makingAmount: nativeOrder.makingAmount,
                takingAmount: nativeOrder.takingAmount,
                maker: new EvmAddress(nativeOrder.maker),
                // salt: nativeOrder.salt, // todo: fix salt issue too big
                receiver: new EvmAddress(nativeOrder.receiver)
            },
            {...extra, optimizeReceiverAddress: false}
        )
    }
}
