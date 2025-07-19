import {web3} from '@coral-xyz/anchor'
import {SolanaAddress, AddressLike} from '../../domains/addresses'

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID: web3.PublicKey =
    new web3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')

/**
 * Return the associated token account for given params
 *
 * @param walletAddress
 * @param tokenMintAddress
 * @param tokenProgramId
 */
export function getAta(
    walletAddress: AddressLike,
    tokenMintAddress: AddressLike,
    tokenProgramId: AddressLike
): SolanaAddress {
    return SolanaAddress.fromBuffer(
        web3.PublicKey.findProgramAddressSync(
            [
                walletAddress.toBuffer(),
                tokenProgramId.toBuffer(),
                tokenMintAddress.toBuffer()
            ],
            SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
        )[0].toBuffer()
    )
}
