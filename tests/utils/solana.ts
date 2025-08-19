import {web3} from '@coral-xyz/anchor'

export const SYSTEM_PROGRAM_ID = new web3.PublicKey(
    '11111111111111111111111111111111'
)

export function sol(n: number): number {
    return 1_000_000_000 * n
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
