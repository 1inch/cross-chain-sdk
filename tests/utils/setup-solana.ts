import {web3} from '@coral-xyz/anchor'
import {ProgramTestContext, start} from 'solana-bankrun'
import {TestConnection} from './solana-test-connection'

import {NetworkEnum} from '../../src/chains'
import {WhitelistContract} from '../../src/contracts/svm/whitelist'
import {SvmSrcEscrowFactory} from '../../src/contracts/svm/svm-src-escrow-factory'
import {SvmDstEscrowFactory} from '../../src/contracts/svm/svm-dst-escrow-factory'

import {airdropAccount, sol} from '../utils/solana'

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
        [
            airdropAccount(maker.publicKey, sol(100)),
            airdropAccount(resolver.publicKey, sol(100)),
            airdropAccount(owner.publicKey, sol(100))
        ]
    )

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
