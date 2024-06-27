import {FusionOrder, OrderInfoData} from '@1inch/fusion-sdk'
import {EscrowExtension} from './escrow-extension'
import {Extra} from './types'

/**
 * Inner order class, not intended for public usage
 */
export class InnerOrder extends FusionOrder {
    public readonly escrowExtension: EscrowExtension

    public constructor(
        extension: EscrowExtension,
        orderInfo: OrderInfoData,
        extra?: Extra
    ) {
        super(
            extension.address,
            orderInfo,
            extension.auctionDetails,
            extension.postInteractionData,
            {
                ...extra,
                // for now not allowed, will add in future releases
                allowMultipleFills: false,
                allowPartialFills: false
            },
            extension
        )

        this.escrowExtension = extension
    }
}
