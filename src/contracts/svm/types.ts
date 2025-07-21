import {
    AuctionDetails,
    EvmAddress,
    HashLock,
    MerkleLeaf,
    SolanaAddress,
    TimeLocks
} from '../../domains'
import {OrderInfoData} from '../../cross-chain-order/svm/svm-cross-chain-order'
import {SolanaEscrowParams, SolanaExtra} from '../../cross-chain-order'

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

export type ParsedCreateSrcEscrowInstructionData = {
    amount: bigint
    dutchAuctionData: AuctionDetails
    merkleProof: {
        index: number
        proof: MerkleLeaf[]
        hashedSecret: string
    } | null
}

export type ParsedCreateInstructionData = {
    orderInfo: OrderInfoData
    escrowParams: SolanaEscrowParams
    extraDetails: Omit<SolanaExtra, 'orderExpirationDelay'>
    expirationTime: bigint
    dutchAuctionDataHash: string
}

export type ParsedCreateDstEscrowInstructionData = {
    orderHash: string
    hashlock: HashLock
    amount: bigint
    safetyDeposit: bigint
    recipient: EvmAddress
    timelocks: TimeLocks
    srcCancellationTimestamp: number
    assetIsNative: boolean
}
