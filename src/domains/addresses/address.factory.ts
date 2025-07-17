import {AddressLike} from './types'
import {EvmAddress} from './evm-address'
import {SolanaAddress} from './solana-address'
import {isEvm} from '../../chains'

export function createAddress(address: string, chainId: number): AddressLike {
    if (isEvm(chainId)) {
        return EvmAddress.fromUnknown(address)
    }

    return SolanaAddress.fromUnknown(address)
}
