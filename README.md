# Cross Chain SDK
Sdk for creating atomic swaps through 1inch

## Resources
- [Dev portal](https://portal.1inch.dev/documentation/apis/swap/fusion-plus/introduction)

## Docs
- [WebSocket](https://github.com/1inch/cross-chain-sdk/tree/master/src/ws-api)
- [v2.0 Migration Guide](./docs/v2-migration-guide.md)

# Installation

`npm install @1inch/cross-chain-sdk`

# Setup
```typescript
const privateKey =  '0x'
const rpc = 'https://ethereum-rpc.publicnode.com'
const authKey = 'auth-key'
const source = 'sdk-tutorial'

const web3 = new Web3(rpc)
const walletAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address

const sdk = new SDK({
    url: 'https://api.1inch.com/fusion-plus',
    authKey,
    blockchainProvider: new PrivateKeyProviderConnector(privateKey, web3) // only required for order creation
})
```

# Order creation
To create order it is required that wallet has enough allowance of `srcTokenAddress`  for `Limit Order Protocol` on source chain
```typescript
// 10 USDT (Polygon) -> BNB (BSC)

// estimate
const quote = await sdk.getQuote({
	amount: '10000000',
	srcChainId: NetworkEnum.POLYGON,
	dstChainId: NetworkEnum.BINANCE,
	enableEstimate: true,
	srcTokenAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', // USDT
	dstTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // BNB
	walletAddress
})

const preset = PresetEnum.fast

// generate secrets
const secrets = Array.from({
	length: quote.presets[preset].secretsCount
}).map(() => '0x' + randomBytes(32).toString('hex'))

const hashLock =
	secrets.length === 1
		? HashLock.forSingleFill(secrets[0])
		: HashLock.forMultipleFills(HashLock.getMerkleLeaves(secrets))

const secretHashes = secrets.map((s) => HashLock.hashSecret(s))

// create order
const {hash, quoteId, order} = await sdk.createOrder(quote, {
	walletAddress,
	hashLock,
	preset,
	source,
	secretHashes
})
console.log({hash}, 'order created')
```

# Order submission
```typescript
// submit order
const _orderInfo = await sdk.submitOrder(
	quote.srcChainId,
	order,
	quoteId,
	secretHashes
)
console.log({hash}, 'order submitted')
```

# Secret submission
Each time when resolver deploys source and destination escrow - user must submit appropriate secret, so resolver can finish swap

```typescript
 // submit secrets for deployed escrows
while (true) {
	const secretsToShare = await sdk.getReadyToAcceptSecretFills(hash)

	if (secretsToShare.fills.length) {
		for (const {idx} of secretsToShare.fills) {
			await sdk.submitSecret(hash, secrets[idx])

			console.log({idx}, 'shared secret')
		}
	}

	// check if order finished
	const {status} = await sdk.getOrderStatus(hash)

	if (
		status === OrderStatus.Executed ||
		status === OrderStatus.Expired ||
		status === OrderStatus.Refunded
	) {
		break
	}

	await sleep(1000)
}

const statusResponse = await sdk.getOrderStatus(hash)

console.log(statusResponse)
```

# Full example
```typescript
import {
    HashLock,
    NetworkEnum,
    OrderStatus,
    PresetEnum,
    PrivateKeyProviderConnector,
    SDK
} from '@1inch/cross-chain-sdk'
import Web3 from 'web3'
import {randomBytes} from 'node:crypto'

const privateKey =  '0x'
const rpc = 'https://ethereum-rpc.publicnode.com'
const authKey = 'auth-key'
const source = 'sdk-tutorial'

const web3 = new Web3(rpc)
const walletAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address

const sdk = new SDK({
    url: 'https://api.1inch.com/fusion-plus',
    authKey,
    blockchainProvider: new PrivateKeyProviderConnector(privateKey, web3) // only required for order creation
})

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main(): Promise<void> {
    // 10 USDT (Polygon) -> BNB (BSC)

    // estimate
    const quote = await sdk.getQuote({
        amount: '10000000',
        srcChainId: NetworkEnum.POLYGON,
        dstChainId: NetworkEnum.BINANCE,
        enableEstimate: true,
        srcTokenAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', // USDT
        dstTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // BNB
        walletAddress
    })

    const preset = PresetEnum.fast

    // generate secrets
    const secrets = Array.from({
        length: quote.presets[preset].secretsCount
    }).map(() => '0x' + randomBytes(32).toString('hex'))

    const hashLock =
        secrets.length === 1
            ? HashLock.forSingleFill(secrets[0])
            : HashLock.forMultipleFills(HashLock.getMerkleLeaves(secrets))

    const secretHashes = secrets.map((s) => HashLock.hashSecret(s))

    // create order
    const {hash, quoteId, order} = await sdk.createOrder(quote, {
        walletAddress,
        hashLock,
        preset,
        source,
        secretHashes
    })
    console.log({hash}, 'order created')

    // submit order
    const _orderInfo = await sdk.submitOrder(
        quote.srcChainId,
        order,
        quoteId,
        secretHashes
    )
    console.log({hash}, 'order submitted')

    // submit secrets for deployed escrows
    while (true) {
        const secretsToShare = await sdk.getReadyToAcceptSecretFills(hash)

        if (secretsToShare.fills.length) {
            for (const {idx} of secretsToShare.fills) {

                // it is responsibility of the client to check whether is safe to share secret (check escrow addresses and so on)
                await sdk.submitSecret(hash, secrets[idx])

                console.log({idx}, 'shared secret')
            }
        }

        // check if order finished
        const {status} = await sdk.getOrderStatus(hash)

        if (
            status === OrderStatus.Executed ||
            status === OrderStatus.Expired ||
            status === OrderStatus.Refunded
        ) {
            break
        }

        await sleep(1000)
    }

    const statusResponse = await sdk.getOrderStatus(hash)

    console.log(statusResponse)
}

main()
```

## Charge integrator fee
To charge fees as an integrator, pass the `integratorFee` field to `sdk.getQuote`. The fee is specified in basis points (1% = 100 bps) and requires a receiver address that will collect the fee.

```diff
const quote = await sdk.getQuote({
    amount: '10000000',
    srcChainId: NetworkEnum.POLYGON,
    dstChainId: NetworkEnum.BINANCE,
    enableEstimate: true,
    srcTokenAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', // USDT
    dstTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // BNB
    walletAddress,
+    integratorFee: {
+        receiver: integratorFeeReceiver, // address to receive the fee
+        value: new Bps(100n) // 1% fee (100 basis points)
+    }
})
```

## Full example Native Asset CrossChain Swap
```typescript
import {
    EvmCrossChainOrder,
    HashLock,
    NetworkEnum,
    OrderStatus,
    PrivateKeyProviderConnector,
    SDK,
    EvmAddress,
    NativeOrdersFactory,
    Address
} from '@1inch/cross-chain-sdk'
import {JsonRpcProvider, Wallet} from 'ethers'
import {randomBytes} from 'node:crypto'
import assert from "node:assert";

const PRIVATE_KEY =  '0x'
const WEB3_NODE_URL = 'https://'
const AUTH_KEY = 'auth-key'

const ethersRpcProvider = new JsonRpcProvider(WEB3_NODE_URL)

const ethersProviderConnector = {
    eth: {
        call(transactionConfig): Promise<string> {
            return ethersRpcProvider.call(transactionConfig)
        }
    },
    extend(): void {}
}

const connector = new PrivateKeyProviderConnector(
    PRIVATE_KEY,
    ethersProviderConnector
)

const wallet = new Wallet(PRIVATE_KEY, ethersRpcProvider)

const sdk = new SDK({
    url: 'https://api.1inch.com/fusion-plus',
    authKey: AUTH_KEY,
    blockchainProvider: connector,
})

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main(): Promise<void> {
    // estimate
    const quote = await sdk.getQuote({
        amount: '400000000000000000',
        srcChainId: NetworkEnum.AVALANCHE,
        dstChainId: NetworkEnum.BINANCE,
        enableEstimate: true,
        srcTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // AVAX
        dstTokenAddress: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // USDC
        walletAddress: wallet.address
    })

    const preset = quote.recommendedPreset

    // generate secrets
    const secrets = Array.from({
        length: quote.presets[preset].secretsCount
    }).map(() => '0x' + randomBytes(32).toString('hex'))

    const hashLock =
        secrets.length === 1
            ? HashLock.forSingleFill(secrets[0])
            : HashLock.forMultipleFills(HashLock.getMerkleLeaves(secrets))

    const secretHashes = secrets.map((s) => HashLock.hashSecret(s))

    // create order
    const {hash, quoteId, order} = sdk.createOrder(quote, {
        walletAddress: wallet.address,
        hashLock,
        preset,
        source: 'sdk-tutorial',
        secretHashes
    })

    assert(order instanceof EvmCrossChainOrder)

    console.log({hash}, 'order created')

    // submit order
    const orderInfo = await sdk.submitNativeOrder(
        quote.srcChainId,
        order,
        EvmAddress.fromString(wallet.address),
        quoteId,
        secretHashes
    )
    console.log({hash}, 'order submitted')

    const factory = NativeOrdersFactory.default(NetworkEnum.AVALANCHE)
    const call = factory.create(new Address(wallet.address), orderInfo.order)

    const txRes = await wallet.sendTransaction({
        to: call.to.toString(),
        data: call.data,
        value: call.value
    })

    console.log({txHash: txRes.hash}, 'transaction broadcasted')

    await wallet.provider.waitForTransaction(txRes.hash, 3)

    // submit secrets for deployed escrows
    while (true) {
        const secretsToShare = await sdk.getReadyToAcceptSecretFills(hash)

        if (secretsToShare.fills.length) {
            for (const {idx} of secretsToShare.fills) {

                // it is responsibility of the client to check whether is safe to share secret (check escrow addresses and so on)
                await sdk.submitSecret(hash, secrets[idx])

                console.log({idx}, 'shared secret')
            }
        }

        // check if order finished
        const {status} = await sdk.getOrderStatus(hash)

        if (
            status === OrderStatus.Executed ||
            status === OrderStatus.Expired ||
            status === OrderStatus.Refunded
        ) {
            break
        }

        await sleep(1000)
    }

    const statusResponse = await sdk.getOrderStatus(hash)

    console.log(statusResponse)
}

main()
```


# Solana
Swaps to/from solana is performed similar to evm to evm swaps, except addresses format, also orders from solana must be published both onchain and to relayer

## Solana -> EVM

This example demonstrates a complete cross-chain swap from Solana to EVM, including:
- Setting up the SDK
- Getting a quote for USDT (Solana) to USDT (Ethereum) swap
- Creating and announcing the order to the relayer
- Publishing the order on-chain using Solana transactions
- Managing secret sharing for escrow deployments
- Monitoring order status until completion

<details>
<summary>Click to expand code example</summary>

```typescript
/* eslint-disable max-depth */
import {
  NetworkEnum,
  SDK,
  SolanaAddress,
  HashLock,
  EvmAddress,
  SvmSrcEscrowFactory,
  OrderStatus
} from '@1inch/cross-chain-sdk'
import { utils, web3 } from '@coral-xyz/anchor'
import assert from 'node:assert'
import { randomBytes } from 'node:crypto'
import { setTimeout } from 'node:timers/promises'

const authKey = process.env.DEV_PORTAL_API_TOKEN
assert(authKey, 'please provide auth key in DEV_PORTAL_API_TOKEN env. You can grab it at https://portal.1inch.dev')

const signerPrivateKey = process.env.SOLANA_PRIVATE_KEY
assert(signerPrivateKey, 'please provide solana private key of the maker wallet in SOLANA_PRIVATE_KEY')
const makerSigner = web3.Keypair.fromSecretKey(utils.bytes.bs58.decode(signerPrivateKey))

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com'
const sdk = new SDK({
  url: 'https://api.1inch.com/fusion-plus',
  authKey
})

const USDT_SOL = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
const USDT_ETHEREUM = '0xdac17f958d2ee523a2206206994597c13d831ec7'

const maker = makerSigner.publicKey.toBase58()
const receiver = '0x962a836519109e162754161000D65d9Dc027Fa0F'

const srcToken = SolanaAddress.fromString(USDT_SOL)
const dstToken = EvmAddress.fromString(USDT_ETHEREUM) // use EvmAddress.NATIVE for native token
const amount = 10_000_000n // 10 USDT

const srcChainId = NetworkEnum.SOLANA
const dstChainId = NetworkEnum.ETHEREUM

async function main(): Promise<void> {
  console.log(
    `creating order from wallet ${maker} for [${srcChainId}] ${amount} ${srcToken} -> ${dstToken} [${dstChainId}]`
  )

  const quote = await sdk.getQuote({
    amount: amount.toString(),
    srcChainId,
    dstChainId,
    srcTokenAddress: srcToken.toString(),
    dstTokenAddress: dstToken.toString(),
    enableEstimate: true,
    walletAddress: maker
  })

  console.log('got quote', quote)

  const preset = quote.getPreset(quote.recommendedPreset)
  assert(quote.quoteId)

  const secrets = Array.from({ length: preset.secretsCount }).map(getSecret)
  const secretHashes = secrets.map(HashLock.hashSecret)
  const leaves = HashLock.getMerkleLeaves(secrets)

  const hashLock = secrets.length > 1 ? HashLock.forMultipleFills(leaves) : HashLock.forSingleFill(secrets[0])

  const order = quote.createSolanaOrder({
    hashLock,
    receiver: EvmAddress.fromString(receiver),
    preset: quote.recommendedPreset
  })
  const orderHash = await sdk.announceOrder(order, quote.quoteId, secretHashes)

  console.log('announced order to relayer', orderHash)

  const ix = SvmSrcEscrowFactory.DEFAULT.createOrder(order, {
    srcTokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID
  })

  const tx = new web3.Transaction().add({
    data: ix.data,
    programId: new web3.PublicKey(ix.programId.toBuffer()),
    keys: ix.accounts.map((a) => ({
      isSigner: a.isSigner,
      isWritable: a.isWritable,
      pubkey: new web3.PublicKey(a.pubkey.toBuffer())
    }))
  })

  const connection = new web3.Connection(SOLANA_RPC)

  const result = await connection.sendTransaction(tx, [makerSigner])

  console.log('submitted order', result)
  await setTimeout(5000) // wait for tx lending

  const alreadyShared = new Set<number>()

  while (true) {
    const readyToAcceptSecretes = await sdk.getReadyToAcceptSecretFills(orderHash)
    const idxes = readyToAcceptSecretes.fills.map((f) => f.idx)

    for (const idx of idxes) {
      if (!alreadyShared.has(idx)) {
        // it is responsibility of the client to check whether is safe to share secret (check escrow addresses and so on)
        await sdk.submitSecret(orderHash, secrets[idx])
        alreadyShared.add(idx)

        console.log('submitted secret', secrets[idx])
      }
    }

    // check if order finished
    const { status } = await sdk.getOrderStatus(orderHash)

    if (status === OrderStatus.Executed || status === OrderStatus.Expired || status === OrderStatus.Refunded) {
      break
    }

    await setTimeout(5000)
  }

  const statusResponse = await sdk.getOrderStatus(orderHash)
  console.log(statusResponse)
}

function getSecret(): string {
  return '0x' + randomBytes(32).toString('hex')
}

main()
```

</details>


## EVM -> Solana

This example demonstrates a complete cross-chain swap from EVM to Solana, including:
- Setting up the SDK
- Getting a quote for USDT (Ethereum) to USDT (Solana) swap
- Creating and submitting the order to the relayer
- Managing secret sharing for escrow deployments
- Monitoring order status until completion

<details>
<summary>Click to expand code example</summary>

```typescript
import {
  NetworkEnum,
  SDK,
  SolanaAddress,
  HashLock,
  EvmAddress,
  PrivateKeyProviderConnector,
  OrderStatus
} from '@1inch/cross-chain-sdk-solana'
import { JsonRpcProvider, TransactionRequest, computeAddress } from 'ethers'
import assert from 'node:assert'
import { randomBytes } from 'node:crypto'
import { setTimeout } from 'node:timers/promises'
import 'dotenv/config'

const authKey = process.env.DEV_PORTAL_API_TOKEN
assert(authKey, 'please provide auth key in DEV_PORTAL_API_TOKEN env. You can grab it at https://portal.1inch.dev')

const signerPrivateKey = process.env.EVM_PRIVATE_KEY
assert(signerPrivateKey, 'please provide evm private key of the maker wallet in EVM_PRIVATE_KEY env')

const NODE_URL = 'https://web3.1inch.io/1'
const ethersRpcProvider = new JsonRpcProvider(NODE_URL)

const ethersProviderConnector = {
  eth: {
    call(transactionConfig: TransactionRequest): Promise<string> {
      return ethersRpcProvider.call(transactionConfig)
    }
  },
  extend(): void {}
}

const connector = new PrivateKeyProviderConnector(signerPrivateKey, ethersProviderConnector)

const sdk = new SDK({
  url: 'https://api.1inch.com/fusion-plus',
  authKey: process.env.DEV_PORTAL_API_TOKEN,
  blockchainProvider: connector
})

const maker = computeAddress(signerPrivateKey)
const receiver = '93FP8NG2JrScb9xzNsJrzAze8gJJtr1TgQWUCHDgP3BW'

const USDT_SOL = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
const USDT_ETHEREUM = '0xdac17f958d2ee523a2206206994597c13d831ec7'
const amount = 10_000_000n // 10 USDT
const srcToken = EvmAddress.fromString(USDT_ETHEREUM)
const dstToken = SolanaAddress.fromString(USDT_SOL) // use SolanaAddress.NATIVE for native token
const srcChainId = NetworkEnum.ETHEREUM
const dstChainId = NetworkEnum.SOLANA

async function main(): Promise<void> {
  const quote = await sdk.getQuote({
    amount: amount.toString(),
    srcChainId,
    dstChainId,
    srcTokenAddress: srcToken.toString(),
    dstTokenAddress: dstToken.toString(),
    enableEstimate: true,
    walletAddress: maker
  })

  const preset = quote.getPreset(quote.recommendedPreset)
  assert(quote.quoteId)
  console.log('got preset', preset)

  const secrets = Array.from({ length: preset.secretsCount }).map(getSecret)
  const secretHashes = secrets.map(HashLock.hashSecret)
  const leaves = HashLock.getMerkleLeaves(secrets)

  const hashLock = secrets.length > 1 ? HashLock.forMultipleFills(leaves) : HashLock.forSingleFill(secrets[0])

  const order = quote.createEvmOrder({
    hashLock,
    receiver: SolanaAddress.fromString(receiver),
    preset: quote.recommendedPreset
  })

  const { orderHash } = await sdk.submitOrder(srcChainId, order, quote.quoteId, secretHashes)

  console.log('submit order to relayer', orderHash)

  const alreadyShared = new Set<number>()

  while (true) {
    const readyToAcceptSecretes = await sdk.getReadyToAcceptSecretFills(orderHash)

    const idxes = readyToAcceptSecretes.fills.map((f) => f.idx)

    for (const idx of idxes) {
      if (!alreadyShared.has(idx)) {
        // it is responsibility of the client to check whether is safe to share secret (check escrow addresses and so on)
        await sdk.submitSecret(orderHash, secrets[idx]).catch((err) => console.error('failed to submit secret', err))
        alreadyShared.add(idx)

        console.log('submitted secret', secrets[idx])
      }
    }

    // check if order finished
    const { status } = await sdk.getOrderStatus(orderHash)

    if (status === OrderStatus.Executed || status === OrderStatus.Expired || status === OrderStatus.Refunded) {
      break
    }

    await setTimeout(5000)
  }

  const statusResponse = await sdk.getOrderStatus(orderHash)
  console.log(statusResponse)
}

function getSecret(): string {
  return '0x' + randomBytes(32).toString('hex')
}

main()
```
</details>
