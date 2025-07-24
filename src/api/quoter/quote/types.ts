import {EvmAddress} from '../../../domains'
import {PresetEnum} from '../types'
import {HashLock} from '../../../domains/hash-lock'
import {Preset} from '../preset'
import {AddressForChain} from '../../../type-utils'
import {SupportedChain} from '../../../chains'
import {ResolverCancellationConfig} from '../../../cross-chain-order/svm'

export type EvmCrossChainOrderParamsData = {
    hashLock: HashLock
    preset?: PresetEnum
    receiver?: AddressForChain<SupportedChain>
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

export type SvmCrossChainOrderParamsData = {
    hashLock: HashLock
    preset?: PresetEnum
    receiver: EvmAddress
    resolverCancellationConfig?: ResolverCancellationConfig
    salt?: bigint
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
