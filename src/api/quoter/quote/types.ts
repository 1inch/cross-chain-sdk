import {Address} from '@1inch/fusion-sdk'
import {PresetEnum} from '../types'
import {HashLock} from '../../../domains/hash-lock'

export type CrossChainOrderParamsData = {
    hashLock: HashLock
    preset?: PresetEnum
    receiver?: Address
    nonce?: bigint
    permit?: string
    isPermit2?: boolean
    takingFeeReceiver?: string
    delayAuctionStartTimeBy?: bigint
    /**
     * Order will expire in `orderExpirationDelay` after auction ends
     * Default 12s
     */
    orderExpirationDelay?: bigint
}
