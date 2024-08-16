import {Address, NetworkEnum} from '@1inch/fusion-sdk'
import {PresetEnum} from '../types'

export type FusionOrderParamsData = {
    srcChainId: NetworkEnum
    dstChainId: NetworkEnum
    preset?: PresetEnum
    receiver?: Address
    nonce?: bigint
    permit?: string
    isPermit2?: boolean
    takingFeeReceiver?: string
    allowPartialFills?: boolean
    allowMultipleFills?: boolean
    delayAuctionStartTimeBy?: bigint
    /**
     * Order will expire in `orderExpirationDelay` after auction ends
     * Default 12s
     */
    orderExpirationDelay?: bigint
}
