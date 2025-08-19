import bs58 from 'bs58'
import {add0x} from '@1inch/byte-utils'
import {Buffer} from 'buffer'
import {NodeMessage} from './node-message.js'
import {SolanaAddress} from '../../domains/addresses/index.js'

export class Instruction {
    constructor(
        /**
         * Program Id to execute
         */
        public readonly programId: SolanaAddress,
        public readonly accounts: Array<AccountMeta>,

        /**
         * Program input
         */
        public readonly data: Buffer
    ) {}

    static fromNode(msg: NodeMessage): Instruction[] {
        return msg.instructions.map((ix) => {
            return new Instruction(
                new SolanaAddress(ix.programId),
                ix.accounts.map((pubkey) => {
                    const account = msg.accountKeys.find(
                        (x) => x.pubkey === pubkey
                    )

                    if (!account) {
                        throw new Error('account not found')
                    }

                    return {
                        isWritable: account.writable,
                        isSigner: account.signer,
                        pubkey: new SolanaAddress(account.pubkey)
                    }
                }),
                Buffer.from(bs58.decode(ix.data))
            )
        })
    }

    public toJSON(): {
        programId: SolanaAddress
        accounts: AccountMeta[]
        data: string
    } {
        return {
            accounts: this.accounts,
            data: add0x(this.data.toString('hex')),
            programId: this.programId
        }
    }
}

export type AccountMeta = {
    /** An account's public key */
    pubkey: SolanaAddress
    /** True if an instruction requires a transaction signature matching `pubkey` */
    isSigner: boolean
    /** True if the `pubkey` can be loaded as a read-write account. */
    isWritable: boolean
}
