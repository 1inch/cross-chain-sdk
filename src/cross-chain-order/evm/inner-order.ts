import {Uint256} from '@1inch/limit-order-sdk'
import {EscrowExtension} from './escrow-extension'
import {FusionOrder} from './fusion-order'
import {Extra, OrderInfoData} from './types'

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
            {
                ...orderInfo,
                receiver:
                    orderInfo.receiver &&
                    new Uint256(orderInfo.receiver.toBigint())
            },
            extension.auctionDetails,
            extension.postInteractionData,
            extra,
            extension
        )

        this.escrowExtension = extension
    }
}
