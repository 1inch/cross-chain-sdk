import {EvmAddress} from './evm-address'
import {SolanaAddress} from './solana-address'
import {AddressComplement} from './address-complement'
import {isEvm, SupportedChain} from '../../chains'
import {AddressForChain} from '../../type-utils'

export function createAddress<Chain extends SupportedChain>(
    // hex/base56/bigint
    address: string,
    chainId: Chain,
    complement?: AddressComplement
): AddressForChain<Chain> {
    if (isEvm(chainId)) {
        return EvmAddress.fromUnknown(address) as AddressForChain<Chain>
    }

    if (complement) {
        const evm = EvmAddress.fromUnknown(address)

        return SolanaAddress.fromParts([
            complement,
            evm
        ]) as AddressForChain<Chain>
    }

    return SolanaAddress.fromUnknown(address) as AddressForChain<Chain>
}
