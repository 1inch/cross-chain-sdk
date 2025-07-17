import {web3} from '@coral-xyz/anchor'
import {AddedAccount, ProgramTestContext} from 'solana-bankrun'
import {ACCOUNT_SIZE, AccountLayout} from '@solana/spl-token'
import {AddressLike} from '../../src/domains/addresses'

export const SYSTEM_PROGRAM_ID = new web3.PublicKey(
    '11111111111111111111111111111111'
)

export function sol(n: number): number {
    return 1_000_000_000 * n
}

export function airdropAccount(
    pk: web3.PublicKey,
    amount: number
): AddedAccount {
    return {
        address: pk,
        info: {
            lamports: amount,
            data: Buffer.alloc(0),
            owner: SYSTEM_PROGRAM_ID,
            executable: false
        }
    }
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function withBalanceChanges(
    ctx: ProgramTestContext,
    fn: () => Promise<unknown>,
    accounts: AddressLike[]
): Promise<bigint[]> {
    const balancesBefore = await Promise.all(
        accounts.map((a) =>
            ctx.banksClient.getAccount(new web3.PublicKey(a.toBuffer()))
        )
    )
    await fn()

    const balancesAfter = await Promise.all(
        accounts.map((a) =>
            ctx.banksClient.getAccount(new web3.PublicKey(a.toBuffer()))
        )
    )

    return balancesAfter.map((af, i) => {
        const be = balancesBefore[i]

        const {amount: amountBefore} = be
            ? AccountLayout.decode(be.data.slice(0, ACCOUNT_SIZE))
            : {amount: 0n}
        const {amount: amountAfter} = af
            ? AccountLayout.decode(af.data.slice(0, ACCOUNT_SIZE))
            : {amount: 0n}

        return amountAfter - amountBefore
    })
}
