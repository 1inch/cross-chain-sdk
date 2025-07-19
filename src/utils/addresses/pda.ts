import {web3} from '@coral-xyz/anchor'
import {AddressLike, SolanaAddress} from '../../domains/addresses'

export function getPda(
    programId: AddressLike,
    seeds: Uint8Array[]
): SolanaAddress {
    return SolanaAddress.fromBuffer(
        web3.PublicKey.findProgramAddressSync(
            seeds,
            new web3.PublicKey(programId.toBuffer())
        )[0].toBuffer()
    )
}
