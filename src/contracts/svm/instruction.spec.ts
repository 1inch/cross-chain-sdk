import bs58 from 'bs58'
import {Instruction} from './instruction.js'
import {NodeMessage} from './node-message.js'
import {SolanaAddress} from '../../domains/addresses/index.js'

const PROGRAM = '11111111111111111111111111111111'
const ACCOUNT = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'

describe('Instruction', () => {
    it('parses instructions from a node message', () => {
        const data = Buffer.from([1, 2, 3, 4])
        const msg: NodeMessage = {
            accountKeys: [
                {
                    pubkey: ACCOUNT,
                    signer: true,
                    source: 'transaction',
                    writable: true
                }
            ],
            instructions: [
                {
                    accounts: [ACCOUNT],
                    data: bs58.encode(data),
                    programId: PROGRAM
                }
            ]
        }

        const [ix] = Instruction.fromNode(msg)

        expect(ix.programId.toString()).toBe(PROGRAM)
        expect(ix.accounts[0].pubkey.toString()).toBe(ACCOUNT)
        expect(ix.accounts[0].isSigner).toBe(true)
        expect(ix.accounts[0].isWritable).toBe(true)
        expect(ix.data.equals(data)).toBe(true)

        const json = ix.toJSON()
        expect(json.data).toBe('0x01020304')
        expect(json.programId).toBeInstanceOf(SolanaAddress)
    })

    it('throws when an instruction account is missing from accountKeys', () => {
        const msg: NodeMessage = {
            accountKeys: [],
            instructions: [
                {
                    accounts: [ACCOUNT],
                    data: bs58.encode(Buffer.from([1])),
                    programId: PROGRAM
                }
            ]
        }

        expect(() => Instruction.fromNode(msg)).toThrow(/account not found/)
    })
})
