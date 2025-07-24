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

export type FixedLengthArray<
    T,
    N extends number,
    R extends T[] = []
> = R['length'] extends N ? R : FixedLengthArray<T, N, [T, ...R]>

type NonFunctionPropertyNames<T> = {
    // eslint-disable-next-line @typescript-eslint/ban-types
    [K in keyof T]: T[K] extends Function ? never : K
}[keyof T]

type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>

export type DataFor<T> = NonFunctionProperties<T>
