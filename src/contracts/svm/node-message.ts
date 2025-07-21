export type NodeMessage = {
    accountKeys: {
        pubkey: string
        signer: boolean
        source: 'transaction' | 'lookupTable'
        writable: boolean
    }[]
    instructions: {
        accounts: string[]
        data: string // base58 encoded
        programId: string
    }[]
    addressTableLookups?: {
        accountKey: string
        writableIndexes: number[]
        readonlyIndexes: number[]
    }[]
}
