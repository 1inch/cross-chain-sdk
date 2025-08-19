import {EvmAddress} from './evm-address.js'
import {SolanaAddress} from './solana-address.js'
import {AddressComplement} from './address-complement.js'
import {isEvm, SupportedChain} from '../../chains.js'
import {AddressForChain} from '../../type-utils.js'

export function createAddress<Chain extends SupportedChain>(
    // hex/base58/bigint
    address: string | bigint,
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
