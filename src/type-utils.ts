import {EvmChain, SolanaChain, SupportedChain} from './chains'
import {EvmAddress, SolanaAddress} from './domains'

export type TupleToUnion<ArrayType> = ArrayType extends readonly unknown[]
    ? ArrayType[number]
    : never

export type AddressForChain<Chain extends SupportedChain> =
    Chain extends EvmChain
        ? EvmAddress
        : Chain extends SolanaChain
          ? SolanaAddress
          : never
