/**
 * Contract representation of Immutables
 */
export type ImmutablesData = {
    orderHash: string
    hashlock: string
    maker: string
    taker: string
    token: string
    amount: string
    safetyDeposit: string
    timelocks: string
    parameters: string
}

/**
 * Contract representation of DstImmutablesComplement
 */
export type DstImmutablesComplementData = {
    maker: string
    amount: string
    token: string
    safetyDeposit: string
    chainId: string
    parameters: string
}
