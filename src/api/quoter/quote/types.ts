import {EvmAddress} from '../../../domains/index.js'
import {PresetEnum} from '../types.js'
import {HashLock} from '../../../domains/hash-lock/index.js'
import {Preset} from '../preset.js'
import {AddressForChain} from '../../../type-utils.js'
import {SupportedChain} from '../../../chains.js'
import {ResolverCancellationConfig} from '../../../cross-chain-order/svm/index.js'

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
