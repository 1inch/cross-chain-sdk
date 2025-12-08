import {GenericContainer, StartedTestContainer} from 'testcontainers'
import {LogWaitStrategy} from 'testcontainers/build/wait-strategies/log-wait-strategy'
import {
    ContractFactory,
    InterfaceAbi,
    JsonRpcProvider,
    parseEther,
    parseUnits,
    Wallet
} from 'ethers'

import {randBigInt} from '@1inch/fusion-sdk'
import EscrowFactory from '../../dist/contracts/EscrowFactory.sol/EscrowFactory.json'
import Resolver from '../../dist/contracts/Resolver.sol/Resolver.json'
import {EvmChain} from '../../src/chains.js'

import {EvmTestWallet} from '../utils/evm-wallet.js'
import {
    ONE_INCH_LIMIT_ORDER_V4,
    USDC_EVM,
    WETH_EVM
} from '../utils/addresses.js'

export type EvmNodeConfig = {
    chainId: EvmChain
    forkUrl?: string
}

export type ReadyEvmFork = {
    chainId: EvmChain
    localNode: StartedTestContainer
    provider: JsonRpcProvider
    addresses: {
        escrowFactory: string
        resolver: string
    }
    maker: EvmTestWallet
    taker: EvmTestWallet
}

// Setup evm fork with escrow factory contract and users with funds
// maker have WETH
// taker have USDC on resolver contract
export async function setupEvm(config: EvmNodeConfig): Promise<ReadyEvmFork> {
    const forkUrl =
        config.forkUrl ?? (process.env.FORK_URL || 'https://eth.llamarpc.com')

    const {localNode, provider} = await startNode(config.chainId, forkUrl)

    const maker = new EvmTestWallet(
        '0x37d5819e14a620d31d0ba9aab2b5154aa000c5519ae602158ddbe6369dca91fb',
        provider
    )

    const taker = new EvmTestWallet(
        '0xebaffe18fd4f341e6ae52d86b6c6d8fc68d8af0fecc8e43add42e1f6d6aa9808',
        provider
    )
    const addresses = await deployContracts(provider, taker)
    await setupBalances(maker, taker, addresses.resolver, provider)

    return {
        chainId: config.chainId,
        addresses,
        localNode,
        provider,
        maker,
        taker
    }
}

// Available Accounts
// ==================
// (0) 0x8b83C50040c743E99bD47F4327BFcf7913c505B4 (10000.000000000000000000 ETH) maker
// (1) 0x1d83cc9b3Fe9Ee21c45282Bef1BEd27Dfa689EA2 (10000.000000000000000000 ETH) taker
// (2) 0x07a4D77190De10f0D8bDEbBDCdc73853AE4cCdf6 (10000.000000000000000000 ETH)
// (3) 0x8b6Ffe431Cec18FED09b7CaFF804888EeF39D009 (10000.000000000000000000 ETH)
// (4) 0x2bf8553fbCd3580EaBfbF29F6D3AF2a412f38EC1 (10000.000000000000000000 ETH)
// (5) 0xB91be682Dd4fbF00aeE9Cc2FDBe765f1D0eA65AA (10000.000000000000000000 ETH)
// (6) 0xBDF48b349798BdD3C220F4c9FEf7c29C9201E50A (10000.000000000000000000 ETH)
// (7) 0xCBb5815C183295348E1C6603c28d0660E31Dda17 (10000.000000000000000000 ETH)
// (8) 0xfF989B7F90E304033f692C9b6613a70458D3Df22 (10000.000000000000000000 ETH)
// (9) 0xCCEEB333F0a8D9C064Ca32779D8544aaC0201c68 (10000.000000000000000000 ETH) deployer
//
// Private Keys
// ==================
// (0) 0x37d5819e14a620d31d0ba9aab2b5154aa000c5519ae602158ddbe6369dca91fb
// (1) 0xebaffe18fd4f341e6ae52d86b6c6d8fc68d8af0fecc8e43add42e1f6d6aa9808
// (2) 0x2d6e2a0548113d7af8c7dd74be13aff61e0c71ea529c6e5270cdfe5f477587c1
// (3) 0xf8577fae1ab233268121f4fba4f00e3792130bf516b5a94a425f5d468d0cf29e
// (4) 0x83190e27ec70886b3a9f4692fa157a79b061dee35c471efea84ce1837257b114
// (5) 0x5b3a831f58aa3965ba0a70b8ed71c3b386544a3a3141f855997f81b8eed7f372
// (6) 0x437ebdcdb8ca10cd263bd21b4da1fada08032474e676d2043d854322b125c226
// (7) 0x7ce41c59ce82cb25399e64a1fe7f68a2239a7a8470abf4dd0e027417dd61e430
// (8) 0x64892fbe089cc18dc545a44f233c4b58e6b1279f0a6659367ba1df6cec4ae477
// (9) 0x3667482b9520ea17999acd812ad3db1ff29c12c006e756cdcb5fd6cc5d5a9b01
async function startNode(
    chainId: EvmChain,
    forkUrl: string
): Promise<{
    localNode: StartedTestContainer
    provider: JsonRpcProvider
}> {
    const innerPort = 8545
    const anvil = await new GenericContainer(
        'ghcr.io/foundry-rs/foundry:v1.2.3'
    )
        .withExposedPorts(innerPort)
        .withCommand([
            `anvil -f ${forkUrl} --chain-id ${chainId} --mnemonic 'hat hat horse border print cancel subway heavy copy alert eternal mask' --host 0.0.0.0`
        ])
        .withWaitStrategy(new LogWaitStrategy('Listening on 0.0.0.0:8545', 1))
        .withName(`anvil_cross_chain_tests_${chainId}_${randBigInt(100n)}`)
        .start()

    const url = `http://127.0.0.1:${anvil.getMappedPort(innerPort)}`

    return {
        localNode: anvil,
        provider: new JsonRpcProvider(url, chainId, {
            cacheTimeout: -1,
            staticNetwork: true
        })
    }
}

async function deployContracts(
    provider: JsonRpcProvider,
    taker: EvmTestWallet
): Promise<{
    escrowFactory: string
    resolver: string
}> {
    const deployer = new Wallet(
        '0x3667482b9520ea17999acd812ad3db1ff29c12c006e756cdcb5fd6cc5d5a9b01',
        provider
    )

    const escrowFactory = await deploy(
        EscrowFactory,
        [
            ONE_INCH_LIMIT_ORDER_V4,
            '0xacce550000159e70908c0499a1119d04e7039c28', // access token
            deployer.address, // owner
            100000n, // src rescue delay
            100000n // dst rescue delay
        ],
        deployer
    )

    const resolver = await deploy(
        Resolver,
        [escrowFactory, ONE_INCH_LIMIT_ORDER_V4, await taker.getAddress()],
        deployer
    )

    return {
        escrowFactory,
        resolver
    }
}

async function setupBalances(
    maker: EvmTestWallet,
    taker: EvmTestWallet,
    resolver: string,
    provider: JsonRpcProvider
): Promise<void> {
    const USDC_DONOR = await EvmTestWallet.fromAddress(
        '0xEe7aE85f2Fe2239E27D9c1E23fFFe168D63b4055',
        provider
    )

    // maker have WETH
    await maker.transfer(WETH_EVM, parseEther('5'))
    await maker.unlimitedApprove(WETH_EVM, ONE_INCH_LIMIT_ORDER_V4)

    // Taker have USDC on resolver
    await USDC_DONOR.transferToken(USDC_EVM, resolver, parseUnits('100000', 6))
}

async function deploy(
    json: {abi: InterfaceAbi; bytecode: {object: string}},
    params: unknown[],
    deployer: Wallet
): Promise<string> {
    const factory = new ContractFactory(
        json.abi,
        json.bytecode.object,
        deployer
    )

    const deployed = await factory.deploy(...params, {gasLimit: 10_000_000n})
    await deployed.waitForDeployment()

    return deployed.getAddress()
}
