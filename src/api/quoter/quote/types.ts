import {PresetEnum} from '../types'
import {HashLock} from '../../../domains/hash-lock'
import type {EvmAddress as Address} from '../../../domains/addresses'

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
