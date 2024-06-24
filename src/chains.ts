import {NetworkEnum} from '@1inch/fusion-sdk'
import {TupleToUnion} from './type-utils'

export const SupportedChains = [
    NetworkEnum.ETHEREUM,
    NetworkEnum.POLYGON,
    NetworkEnum.OPTIMISM,
    NetworkEnum.BINANCE,
    NetworkEnum.ARBITRUM,
    NetworkEnum.AVALANCHE,
    NetworkEnum.GNOSIS,
    NetworkEnum.FANTOM
] as const

type UnsupportedChain = Exclude<
    NetworkEnum,
    TupleToUnion<typeof SupportedChains>
>

export type SupportedChain = Exclude<NetworkEnum, UnsupportedChain>
