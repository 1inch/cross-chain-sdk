import {NetworkEnum} from '@1inch/fusion-sdk'
import {TupleToUnion} from './type-utils'

export const SupportedChains = [
    NetworkEnum.ETHEREUM,
    NetworkEnum.POLYGON,
    NetworkEnum.BINANCE,
    NetworkEnum.OPTIMISM,
    NetworkEnum.ARBITRUM,
    NetworkEnum.AVALANCHE,
    NetworkEnum.GNOSIS,
    NetworkEnum.COINBASE
] as const

type UnsupportedChain = Exclude<
    NetworkEnum,
    TupleToUnion<typeof SupportedChains>
>

export type SupportedChain = Exclude<NetworkEnum, UnsupportedChain>

export const isSupportedChain = (chain: unknown): chain is SupportedChain =>
    SupportedChains.includes(chain as number)
