# Cross Chain SDK
Sdk for creating atomic swaps through 1inch

## Resources
- [Dev portal](https://portal.1inch.dev/documentation/apis/swap/fusion-plus/introduction)

## Docs
- [WebSocket](https://github.com/1inch/cross-chain-sdk/tree/master/src/ws-api)

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
    url: 'https://api.1inch.dev/fusion-plus',  
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

# Whole script
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
    url: 'https://api.1inch.dev/fusion-plus',  
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
