import {Clock, FailedTransactionMetadata, LiteSVM} from 'litesvm'
import {web3} from '@coral-xyz/anchor'

import bs58 from 'bs58'

import {Buffer} from 'buffer'

export class TestConnection {
    constructor(private readonly testCtx: LiteSVM) {}

    static new(testCtx: LiteSVM): web3.Connection {
        return new TestConnection(testCtx) as unknown as web3.Connection
    }

    async getMinimumBalanceForRentExemption(mintLen: number): Promise<number> {
        const rent = this.testCtx.getRent()

        return Number(rent.minimumBalance(BigInt(mintLen)))
    }

    async sendTransaction(
        transaction: web3.Transaction,
        signers: Array<web3.Signer>
    ): Promise<web3.TransactionSignature> {
        transaction.recentBlockhash = this.testCtx.latestBlockhash()
        transaction.sign(...signers)

        const result = this.testCtx.sendTransaction(transaction)

        if (result instanceof FailedTransactionMetadata) {
            const logs = result.meta().logs()

            const msg = `tx failed: ${bs58.encode(result.meta().signature())}}`

            // eslint-disable-next-line no-console
            console.error(result.toString())
            // eslint-disable-next-line no-console
            console.log(msg, '\n', logs.join('\n'))

            throw new Error(msg)
        }

        return bs58.encode(result.signature()) as web3.TransactionSignature
    }

    async confirmTransaction(
        hash: web3.TransactionSignature
    ): Promise<web3.RpcResponseAndContext<web3.SignatureResult>> {
        const status = this.testCtx.getTransaction(bs58.decode(hash))

        if (status) {
            return {
                context: {slot: 0},
                value: {
                    err:
                        status instanceof FailedTransactionMetadata
                            ? status.err()
                            : null
                }
            }
        }

        throw new Error(`transaction not confirmed: ${hash}`)
    }

    async getAccountInfo(
        publicKey: web3.PublicKey
    ): Promise<web3.AccountInfo<Buffer> | null> {
        const acc = this.testCtx.getAccount(publicKey)

        return acc ? {...acc, data: Buffer.from(acc.data)} : null
    }

    async getClock(): Promise<Clock> {
        return this.testCtx.getClock()
    }
}
