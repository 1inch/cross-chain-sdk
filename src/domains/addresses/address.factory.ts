import {AddressLike} from './types'
import {EvmAddress} from './evm-address'
import {SolanaAddress} from './solana-address'
import {AddressComplement} from './address-complement'
import {isEvm} from '../../chains'

export function createAddress(
    // hex/base56/bigint
    address: string,
    chainId: number,
    complement?: AddressComplement
): AddressLike {
    if (isEvm(chainId)) {
        return EvmAddress.fromUnknown(address)
    }

    if (complement) {
        // todo handle complement
    }

    return SolanaAddress.fromUnknown(address)
}
