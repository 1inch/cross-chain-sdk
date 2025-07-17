import {Clock, ProgramTestContext} from 'solana-bankrun'
import {web3} from '@coral-xyz/anchor'

import bs58 from 'bs58'
import assert from 'assert'

import {Buffer} from 'buffer'
import {sleep} from './solana'

export class TestConnection {
    constructor(private readonly testCtx: ProgramTestContext) {}

    static new(testCtx: ProgramTestContext): web3.Connection {
        return new TestConnection(testCtx) as unknown as web3.Connection
    }

    async getMinimumBalanceForRentExemption(mintLen: number): Promise<number> {
        const rent = await this.testCtx.banksClient.getRent()

        return Number(rent.minimumBalance(BigInt(mintLen)))
    }

    async sendTransaction(
        transaction: web3.Transaction,
        signers: Array<web3.Signer>
    ): Promise<web3.TransactionSignature> {
        transaction.recentBlockhash = this.testCtx.lastBlockhash
        transaction.sign(...signers)

        await this.testCtx.banksClient.sendTransaction(transaction)

        assert(transaction.signature)

        await sleep(100) // IDK, for some reason the bank client can't find tx without this sleep

        return bs58.encode(transaction.signature) as web3.TransactionSignature
    }

    async confirmTransaction(
        hash: web3.TransactionSignature
    ): Promise<web3.RpcResponseAndContext<web3.SignatureResult>> {
        let i = 10
        while (i--) {
            const status =
                await this.testCtx.banksClient.getTransactionStatus(hash)

            if (status) {
                return {
                    context: {slot: Number(status.slot)},
                    value: {err: status.err}
                }
            }

            await sleep(1000)
        }

        throw new Error(`transaction not confirmed: ${hash}`)
    }

    async getAccountInfo(
        publicKey: web3.PublicKey
    ): Promise<web3.AccountInfo<Buffer> | null> {
        const acc = await this.testCtx.banksClient.getAccount(publicKey)

        return acc ? {...acc, data: Buffer.from(acc.data)} : null
    }

    async getClock(): Promise<Clock> {
        return this.testCtx.banksClient.getClock()
    }
}
