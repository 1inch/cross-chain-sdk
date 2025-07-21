import {SolanaAddress} from '../../domains'

export type CreateOrderAccounts = {
    creator: SolanaAddress
    mint: SolanaAddress
    creatorAta: SolanaAddress
    order: SolanaAddress
    orderAta: SolanaAddress
    associatedTokenProgram: SolanaAddress
    tokenProgram: SolanaAddress
    rent: SolanaAddress
    systemProgram: SolanaAddress
}
