import {BorshCoder, web3} from '@coral-xyz/anchor'
import {Clock, LiteSVM} from 'litesvm'
import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo
} from '@solana/spl-token'
import path from 'path'
import {TestConnection} from './solana-test-connection'

import {NetworkEnum} from '../../src/chains'
import {WhitelistContract} from '../../src/contracts/svm/whitelist'
import {SvmSrcEscrowFactory} from '../../src/contracts/svm/svm-src-escrow-factory'
import {SvmDstEscrowFactory} from '../../src/contracts/svm/svm-dst-escrow-factory'

import {IDL as WhitelistIDL} from '../../src/idl/whitelist'

import {sol, SYSTEM_PROGRAM_ID} from '../utils/solana'
import {getPda, now} from '../../src/utils'
import {SolanaAddress} from '../../src/domains/addresses'

export type SolanaNodeConfig = {
    //
}

export type ReadySolanaNode = {
    chainId: NetworkEnum.SOLANA
    connection: TestConnection
    svm: LiteSVM
    accounts: {
        srcToken: web3.Keypair
        dstToken: web3.Keypair
        maker: web3.Keypair
        resolver: web3.Keypair
        fallbackResolver: web3.Keypair
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
    const fallbackResolver = web3.Keypair.generate()
    const owner = web3.Keypair.generate()

    const svm = await startNode([
        maker.publicKey,
        resolver.publicKey,
        owner.publicKey,
        fallbackResolver.publicKey
    ])
    await initWhitelist(
        svm,
        new web3.PublicKey(WhitelistContract.DEFAULT.programId.toBuffer()),
        owner,
        [resolver.publicKey, fallbackResolver.publicKey]
    )

    await initTokens(svm, owner, [
        {
            mint: srcToken,
            owners: [
                {
                    address: maker.publicKey,
                    amount: sol(100)
                },
                {
                    address: resolver.publicKey,
                    amount: sol(0) // to have ata
                },
                {
                    address: fallbackResolver.publicKey,
                    amount: sol(0) // to have ata
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
        }
    ])

    console.log({
        srcToken: srcToken.publicKey.toBase58(),
        dstToken: dstToken.publicKey.toBase58(),
        maker: maker.publicKey.toBase58(),
        owner: owner.publicKey.toBase58(),
        resolver: resolver.publicKey.toBase58(),
        fallbackResolver: fallbackResolver.publicKey.toBase58()
    })

    return {
        chainId: NetworkEnum.SOLANA,
        accounts: {
            srcToken,
            dstToken,
            maker,
            owner,
            resolver,
            fallbackResolver
        },
        connection: new TestConnection(svm),
        svm: svm
    }
}

async function startNode(fundAccounts: web3.PublicKey[]): Promise<LiteSVM> {
    const whitelistProgramId = new web3.PublicKey(
        WhitelistContract.DEFAULT.programId.toBuffer()
    )
    const srcFactoryProgramId = new web3.PublicKey(
        SvmSrcEscrowFactory.DEFAULT.programId.toBuffer()
    )

    const dstFactoryProgramId = new web3.PublicKey(
        SvmDstEscrowFactory.DEFAULT.programId.toBuffer()
    )

    const svm = new LiteSVM()

    const getPath = (name: string): string =>
        path.join(__dirname, '../fixtures', `${name}.so`)

    svm.addProgramFromFile(whitelistProgramId, getPath('whitelist'))
    svm.addProgramFromFile(
        srcFactoryProgramId,
        getPath('cross_chain_escrow_src')
    )
    svm.addProgramFromFile(
        dstFactoryProgramId,
        getPath('cross_chain_escrow_dst')
    )

    fundAccounts.forEach((a) => {
        svm.airdrop(a, BigInt(sol(100)))
    })

    // setup node time to now()
    const clock = svm.getClock()
    const newClock = new Clock(
        clock.slot,
        clock.epochStartTimestamp,
        clock.epoch,
        clock.leaderScheduleEpoch,
        clock.unixTimestamp + BigInt(now())
    )
    svm.setClock(newClock)

    return svm
}

async function initWhitelist(
    testCtx: LiteSVM,
    programId: web3.PublicKey,
    owner: web3.Keypair,
    resolvers: web3.PublicKey[]
): Promise<void> {
    const whitelistCoder = new BorshCoder(WhitelistIDL)

    // region init
    const initTx = new web3.Transaction({
        feePayer: owner.publicKey,
        recentBlockhash: testCtx.latestBlockhash()
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
    testCtx.sendTransaction(initTx)

    // endregion init
    // region register
    for (const resolver of resolvers) {
        const registerTx = new web3.Transaction({
            feePayer: owner.publicKey,
            recentBlockhash: testCtx.latestBlockhash()
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
            data: whitelistCoder.instruction.encode('register', {
                user: resolver
            }),
            programId: programId
        })

        registerTx.sign(owner)
        testCtx.sendTransaction(registerTx)
    }
    // endregion register
}

async function initTokens(
    testCtx: LiteSVM,
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
