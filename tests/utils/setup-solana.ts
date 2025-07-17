import {BorshCoder, web3} from '@coral-xyz/anchor'
import {ProgramTestContext, start} from 'solana-bankrun'
import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo
} from '@solana/spl-token'
import {TestConnection} from './solana-test-connection'

import {NetworkEnum} from '../../src/chains'
import {WhitelistContract} from '../../src/contracts/svm/whitelist'
import {SvmSrcEscrowFactory} from '../../src/contracts/svm/svm-src-escrow-factory'
import {SvmDstEscrowFactory} from '../../src/contracts/svm/svm-dst-escrow-factory'

import {IDL as WhitelistIDL} from '../../src/idl/whitelist'

import {airdropAccount, sol, SYSTEM_PROGRAM_ID} from '../utils/solana'
import {getPda} from '../../src/utils'
import {SolanaAddress} from '../../src/domains/addresses'

export type SolanaNodeConfig = {
    //
}

export type ReadySolanaNode = {
    chainId: NetworkEnum.SOLANA
    connection: TestConnection
    ctx: ProgramTestContext
    accounts: {
        srcToken: web3.Keypair
        dstToken: web3.Keypair
        maker: web3.Keypair
        resolver: web3.Keypair
        owner: web3.Keypair
    }
}

// Setup evm fork with escrow factory contract and users with funds
// maker have WETH
// taker have USDC on resolver contract
export async function setupSolana(
    _config?: SolanaNodeConfig
): Promise<ReadySolanaNode> {
    const srcToken = web3.Keypair.generate()
    const dstToken = web3.Keypair.generate()
    const maker = web3.Keypair.generate()
    const resolver = web3.Keypair.generate()
    const owner = web3.Keypair.generate()

    const programTestCtx = await startNode([
        maker.publicKey,
        resolver.publicKey,
        owner.publicKey
    ])
    await initWhitelist(
        programTestCtx,
        new web3.PublicKey(WhitelistContract.DEFAULT.programId.toBuffer()),
        owner,
        resolver.publicKey
    )

    await initTokens(programTestCtx, owner, [
        {
            mint: srcToken,
            owners: [
                {
                    address: maker.publicKey,
                    amount: sol(100)
                }
            ]
        },
        {
            mint: dstToken,
            owners: [
                {
                    address: resolver.publicKey,
                    amount: sol(100)
                }
            ]
        },
        {
            mint: srcToken,
            owners: [
                {
                    address: resolver.publicKey,
                    amount: sol(0) // to have ata
                }
            ]
        }
    ])

    return {
        chainId: NetworkEnum.SOLANA,
        accounts: {
            srcToken,
            dstToken,
            maker,
            owner,
            resolver
        },
        connection: new TestConnection(programTestCtx),
        ctx: programTestCtx
    }
}

async function startNode(
    fundAccounts: web3.PublicKey[]
): Promise<ProgramTestContext> {
    const whitelistProgramId = new web3.PublicKey(
        WhitelistContract.DEFAULT.programId.toBuffer()
    )
    const srcFactoryProgramId = new web3.PublicKey(
        SvmSrcEscrowFactory.DEFAULT.programId.toBuffer()
    )

    const dstFactoryProgramId = new web3.PublicKey(
        SvmDstEscrowFactory.DEFAULT.programId.toBuffer()
    )
    const programTestCtx = await start(
        [
            {
                name: 'whitelist',
                programId: whitelistProgramId
            },
            {
                name: 'cross_chain_escrow_src',
                programId: srcFactoryProgramId
            },

            {
                name: 'cross_chain_escrow_dst',
                programId: dstFactoryProgramId
            }
        ],
        fundAccounts.map((pk) => airdropAccount(pk, sol(100)))
    )

    return programTestCtx
}

async function initWhitelist(
    testCtx: ProgramTestContext,
    programId: web3.PublicKey,
    owner: web3.Keypair,
    resolver: web3.PublicKey
): Promise<void> {
    const whitelistCoder = new BorshCoder(WhitelistIDL)

    // region init
    const initTx = new web3.Transaction({
        feePayer: owner.publicKey,
        recentBlockhash: testCtx.lastBlockhash
    }).add({
        keys: [
            {pubkey: owner.publicKey, isSigner: true, isWritable: false},
            {
                pubkey: new web3.PublicKey(
                    getPda(SolanaAddress.fromBuffer(programId.toBuffer()), [
                        new TextEncoder().encode('whitelist_state')
                    ]).toBuffer()
                ),
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: SYSTEM_PROGRAM_ID,
                isSigner: false,
                isWritable: false
            }
        ],
        data: whitelistCoder.instruction.encode('initialize', {}),
        programId: programId
    })

    initTx.sign(owner)
    await testCtx.banksClient.processTransaction(initTx)
    // endregion init
    // region register
    const registerTx = new web3.Transaction({
        feePayer: owner.publicKey,
        recentBlockhash: testCtx.lastBlockhash
    }).add({
        keys: [
            {pubkey: owner.publicKey, isSigner: true, isWritable: false},
            {
                pubkey: new web3.PublicKey(
                    getPda(SolanaAddress.fromBuffer(programId.toBuffer()), [
                        new TextEncoder().encode('whitelist_state')
                    ]).toBuffer()
                ),
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: new web3.PublicKey(
                    getPda(SolanaAddress.fromBuffer(programId.toBuffer()), [
                        new TextEncoder().encode('resolver_access'),
                        resolver.toBuffer()
                    ]).toBuffer()
                ),
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: SYSTEM_PROGRAM_ID,
                isSigner: false,
                isWritable: false
            }
        ],
        data: whitelistCoder.instruction.encode('register', {user: resolver}),
        programId: programId
    })

    registerTx.sign(owner)
    await testCtx.banksClient.processTransaction(registerTx)
    // endregion register
}

async function initTokens(
    testCtx: ProgramTestContext,
    owner: web3.Keypair,
    tokens: {
        mint: web3.Keypair
        tokenProgram?: web3.PublicKey
        owners: {address: web3.PublicKey; amount: number}[]
    }[]
): Promise<void> {
    const connection = TestConnection.new(testCtx)

    for (const token of tokens) {
        await createMint(
            connection,
            owner,
            owner.publicKey,
            owner.publicKey,
            9,
            token.mint,
            undefined,
            token.tokenProgram
        )

        for (const user of token.owners) {
            const ata = await getOrCreateAssociatedTokenAccount(
                connection,
                owner,
                token.mint.publicKey,
                user.address,
                false,
                undefined,
                undefined,
                token.tokenProgram
            )

            await mintTo(
                connection,
                owner,
                token.mint.publicKey,
                ata.address,
                owner,
                user.amount,
                undefined,
                undefined,
                token.tokenProgram
            )
        }
    }
}
