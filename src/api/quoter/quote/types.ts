import {PresetEnum} from '../types'
import {HashLock} from '../../../domains/hash-lock'
import type {EvmAddress as Address} from '../../../domains/addresses'
import {Preset} from '../preset'

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

export type Presets = {
    [PresetEnum.fast]: Preset
    [PresetEnum.slow]: Preset
    [PresetEnum.medium]: Preset
    [PresetEnum.custom]?: Preset
}
