import {FusionOrder} from '@1inch/fusion-sdk'
import {EscrowExtension} from './escrow-extension'
import {EvmExtra, OrderInfoData} from './types'

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
}
