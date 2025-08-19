import {
    AuctionDetails,
    HashLock,
    Immutables,
    MerkleLeaf,
    SolanaAddress,
    TimeLocks
} from '../../domains/index.js'
import {OrderInfoData} from '../../cross-chain-order/svm/svm-cross-chain-order.js'
import {SolanaEscrowParams, SolanaExtra} from '../../cross-chain-order/index.js'

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
    taker: SolanaAddress
    token: SolanaAddress
    escrow: SolanaAddress
}

export type ParsedCreateInstructionData = {
    orderInfo: OrderInfoData
    escrowParams: SolanaEscrowParams
    extra: Omit<Required<SolanaExtra>, 'orderExpirationDelay' | 'source'>
    expirationTime: bigint
    dutchAuctionDataHash: string
}

export type ParsedCreateDstEscrowInstructionData = {
    orderHash: string
    hashlock: HashLock
    amount: bigint
    safetyDeposit: bigint
    recipient: SolanaAddress
    timelocks: TimeLocks
    srcCancellationTimestamp: number
    assetIsNative: boolean
    taker: SolanaAddress
    token: SolanaAddress
    escrow: SolanaAddress
}

export type EscrowAddressParams = Pick<
    Immutables<SolanaAddress>,
    'orderHash' | 'hashLock' | 'taker' | 'amount'
>
