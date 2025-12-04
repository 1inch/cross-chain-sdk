import {FusionOrder, SurplusParams} from '@1inch/fusion-sdk'
import {LimitOrder, ProxyFactory} from '@1inch/limit-order-sdk'
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
            extension.whitelist,
            SurplusParams.NO_FEE,
            extra,
            extension
        )

        this.escrowExtension = extension
    }

    toNativeOrder(
        chainId: number,
        ethOrdersFactory: ProxyFactory,
        extra?: EvmExtra
    ): InnerOrder {
        const limitOrder = LimitOrder.fromNative(
            chainId,
            ethOrdersFactory,
            {
                takerAsset: this.takerAsset,
                makingAmount: this.makingAmount,
                takingAmount: this.takingAmount,
                maker: this.maker,
                salt: this.salt,
                receiver: this.receiver
            },
            this.inner.makerTraits,
            this.escrowExtension.build()
        )

        return new InnerOrder(
            this.escrowExtension,
            {
                makerAsset: new EvmAddress(limitOrder.makerAsset),
                takerAsset: new EvmAddress(limitOrder.takerAsset),
                makingAmount: limitOrder.makingAmount,
                takingAmount: limitOrder.takingAmount,
                maker: new EvmAddress(limitOrder.maker),
                salt: limitOrder.salt >> 160n,
                receiver: new EvmAddress(limitOrder.receiver)
            },
            extra
        )
    }
}
