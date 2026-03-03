import {BorshCoder, web3} from '@coral-xyz/anchor'
import {Clock, LiteSVM} from 'litesvm'
import path from 'path'
import {Buffer} from 'buffer'
import {TestConnection} from './solana-test-connection.js'

import {NetworkEnum} from '../../src/chains.js'

import {IDL as WhitelistIDL} from '../../src/idl/whitelist.js'
import {IDL as SrcEscrowIDL} from '../../src/idl/cross-chain-escrow-src.js'
import {IDL as DstEscrowIDL} from '../../src/idl/cross-chain-escrow-dst.js'

import {sol, SYSTEM_PROGRAM_ID} from '../utils/solana.js'
import {getPda, now, getAta} from '../../src/utils/index.js'
import {SolanaAddress} from '../../src/domains/addresses/index.js'

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
    await initWhitelist(svm, new web3.PublicKey(WhitelistIDL.address), owner, [
        resolver.publicKey,
        fallbackResolver.publicKey
    ])

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
    const whitelistProgramId = new web3.PublicKey(WhitelistIDL.address)
    const srcFactoryProgramId = new web3.PublicKey(SrcEscrowIDL.address)
    const dstFactoryProgramId = new web3.PublicKey(DstEscrowIDL.address)

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

async function initTokenOwner(
    testCtx: LiteSVM,
    connection: web3.Connection,
    owner: web3.Keypair,
    mintPublicKey: web3.PublicKey,
    programId: web3.PublicKey,
    associatedTokenProgramId: web3.PublicKey,
    user: {address: web3.PublicKey; amount: number}
): Promise<void> {
    // Get or create associated token account
    const ataAddress = getAta(
        SolanaAddress.fromPublicKey(user.address),
        SolanaAddress.fromPublicKey(mintPublicKey),
        SolanaAddress.fromPublicKey(programId)
    )

    const ataPubkey = new web3.PublicKey(ataAddress.toBuffer())

    // Check if ATA exists
    const ataInfo = await connection.getAccountInfo(ataPubkey)

    if (!ataInfo) {
        // Create associated token account instruction
        // Instruction discriminator: 0 (Create)
        const createAtaData = Buffer.alloc(0)

        const createAtaIx = new web3.TransactionInstruction({
            keys: [
                {
                    pubkey: owner.publicKey,
                    isSigner: true,
                    isWritable: true
                },
                {
                    pubkey: ataPubkey,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: user.address,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: mintPublicKey,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: SYSTEM_PROGRAM_ID,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: programId,
                    isSigner: false,
                    isWritable: false
                }
            ],
            programId: associatedTokenProgramId,
            data: createAtaData
        })

        const createAtaTx = new web3.Transaction({
            feePayer: owner.publicKey,
            recentBlockhash: testCtx.latestBlockhash()
        }).add(createAtaIx)

        createAtaTx.sign(owner)
        await connection.sendTransaction(createAtaTx, [owner])
    }

    // Mint tokens if amount > 0
    if (user.amount > 0) {
        // MintTo instruction
        // Instruction discriminator: 7 (MintTo)
        // Data: amount (8 bytes, little-endian)
        const mintToData = Buffer.alloc(9)
        mintToData.writeUInt8(7, 0) // MintTo instruction
        const amountBuffer = Buffer.allocUnsafe(8)
        amountBuffer.writeBigUInt64LE(BigInt(user.amount), 0)
        amountBuffer.copy(mintToData, 1)

        const mintToIx = new web3.TransactionInstruction({
            keys: [
                {
                    pubkey: mintPublicKey,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: ataPubkey,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: owner.publicKey,
                    isSigner: true,
                    isWritable: false
                }
            ],
            programId: programId,
            data: mintToData
        })

        const mintToTx = new web3.Transaction({
            feePayer: owner.publicKey,
            recentBlockhash: testCtx.latestBlockhash()
        }).add(mintToIx)

        mintToTx.sign(owner)
        await connection.sendTransaction(mintToTx, [owner])
    }
}

async function createMint(
    testCtx: LiteSVM,
    connection: web3.Connection,
    owner: web3.Keypair,
    mint: web3.Keypair,
    programId: web3.PublicKey,
    rentSysvar: web3.PublicKey,
    rent: number
): Promise<void> {
    // SPL Token mint account size is 82 bytes
    const MINT_SIZE = 82

    // Create mint account
    const createMintAccountIx = web3.SystemProgram.createAccount({
        fromPubkey: owner.publicKey,
        newAccountPubkey: mint.publicKey,
        space: MINT_SIZE,
        lamports: rent,
        programId: programId
    })

    // Initialize mint instruction
    // SPL Token program uses bincode serialization for the enum variant:
    // TokenInstruction::InitializeMint { decimals, mint_authority, freeze_authority }
    // Format: [variant: u8, decimals: u8, mint_authority: [u8; 32], freeze_authority_option: u8, freeze_authority: [u8; 32] if Some]
    const initMintData = Buffer.alloc(67)
    let offset = 0
    initMintData.writeUInt8(0, offset++) // InitializeMint variant (0)
    initMintData.writeUInt8(9, offset++) // decimals
    owner.publicKey.toBuffer().copy(initMintData, offset) // mint_authority (32 bytes)
    offset += 32
    initMintData.writeUInt8(1, offset++) // freeze_authority option flag (1 = Some)
    owner.publicKey.toBuffer().copy(initMintData, offset) // freeze_authority pubkey (32 bytes)

    const initMintIx = new web3.TransactionInstruction({
        keys: [
            {
                pubkey: mint.publicKey,
                isSigner: true,
                isWritable: true
            },
            {pubkey: rentSysvar, isSigner: false, isWritable: false}
        ],
        programId: programId,
        data: initMintData
    })

    const createMintTx = new web3.Transaction({
        feePayer: owner.publicKey,
        recentBlockhash: testCtx.latestBlockhash()
    })
        .add(createMintAccountIx)
        .add(initMintIx)

    createMintTx.sign(owner, mint)
    await connection.sendTransaction(createMintTx, [owner, mint])
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
    const defaultTokenProgramId = new web3.PublicKey(
        SolanaAddress.TOKEN_PROGRAM_ID.toBuffer()
    )
    const associatedTokenProgramId = new web3.PublicKey(
        SolanaAddress.ASSOCIATED_TOKEN_PROGRAM_ID.toBuffer()
    )
    const rentSysvar = new web3.PublicKey(
        SolanaAddress.SYSVAR_RENT_ID.toBuffer()
    )

    // SPL Token mint account size is 82 bytes
    const MINT_SIZE = 82
    const rent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE)

    for (const token of tokens) {
        const programId = token.tokenProgram || defaultTokenProgramId

        await createMint(
            testCtx,
            connection,
            owner,
            token.mint,
            programId,
            rentSysvar,
            rent
        )

        for (const user of token.owners) {
            await initTokenOwner(
                testCtx,
                connection,
                owner,
                token.mint.publicKey,
                programId,
                associatedTokenProgramId,
                user
            )
        }
    }
}
