# Cross Chain SDK v2.0 Migration Guide

This guide covers the changes introduced in v2.0.0 and how to migrate from v1.x.

## Overview

v2.0.0 introduces **fee collection support** with integrator and resolver fees, new event decoding utilities, and API versioning.

> **Note:** Fee collection is currently supported for **EVM → EVM** swaps only. Solana swaps do not support fees in this release.

## Breaking Changes

### Fee Parameters

| v1.x                                | v2.x                                               |
|-------------------------------------|----------------------------------------------------|
| `QuoteParams.takingFeeBps?: number` | `QuoteParams.integratorFee?: IntegratorFeeRequest` |
| `OrderParams.fee?: TakingFeeInfo`   | Removed (fees derived from quote)                  |

**Before (v1.x):**
```typescript
const quote = await sdk.getQuote({
    amount: '10000000',
    srcChainId: NetworkEnum.POLYGON,
    dstChainId: NetworkEnum.BINANCE,
    srcTokenAddress: '0x...',
    dstTokenAddress: '0x...',
    walletAddress,
    takingFeeBps: 100 // 1% fee
})
```

**After (v2.x):**
```typescript
import { Bps, EvmAddress } from '@1inch/cross-chain-sdk'

const quote = await sdk.getQuote({
    amount: '10000000',
    srcChainId: NetworkEnum.POLYGON,
    dstChainId: NetworkEnum.BINANCE,
    srcTokenAddress: '0x...',
    dstTokenAddress: '0x...',
    walletAddress,
    integratorFee: {
        receiver: EvmAddress.fromString('0xYourFeeReceiver'),
        value: new Bps(100n) // 1% fee
    }
})

// Fee info is now available in quote response
console.log(quote.integratorFee) // { receiver, value, share }
console.log(quote.resolverFee)   // { receiver, bps, whitelistDiscount }
```

### Removed Types

- `TakingFeeInfo` - use `IntegratorFeeRequest` instead

### Contract Address Changes

All escrow factory and implementation contracts have been updated:

| Contract                       | v1.x Address                                 | v2.x Address                                 |
|--------------------------------|----------------------------------------------|----------------------------------------------|
| ESCROW_FACTORY                 | `0xa7bcb4eac8964306f9e3764f67db6a7af6ddf99a` | `0x03a25b3215a0e5c15cf23ac4d2e5cf86c0ff7efa` |
| ESCROW_ZK_FACTORY              | `0x584aeab186d81dbb52a8a14820c573480c3d4773` | `0xd9085ac07da21bd6eb003a530a524ab054ca8652` |
| ESCROW_SRC_IMPLEMENTATION      | `0xcd70bf33cfe59759851db21c83ea47b6b83bef6a` | `0x30476b0bf2f73f78a75488742920da7ff76c0ca0` |
| ESCROW_ZK_SRC_IMPLEMENTATION   | `0xddc60c7babfc55d8030f51910b157e179f7a41fc` | `0x198cc9a03192d767a29886b6ef626fee38e36959` |
| ESCROW_DST_IMPLEMENTATION      | `0x9c3e06659f1c34f930ce97fcbce6e04ae88e535b` | `0x5cd822f1c70469c36898aa98516a48f4aa04c73a` |
| ESCROW_ZK_DST_IMPLEMENTATION   | `0xdc4ccc2fc2475d0ed3fddd563c44f2bf6a3900c9` | `0x07d3d5e598cc23bfee9884b1e342ddaecd88dead` |

### zkSync Escrow Address Calculation

zkSync now uses the same escrow address calculation logic as other EVM chains.

**v1.x:** zkSync had custom `create2` prefix and bytecode hash for address calculation.

**v2.x:** zkSync uses the standard `EscrowFactory` implementation (same as Ethereum, Polygon, etc.).

If you were manually computing escrow addresses for zkSync, update your code to use the standard calculation method.

## New Features

### Fee Collection

New types for fee handling:
```typescript
type IntegratorFeeRequest = {
    receiver: EvmAddress  // Address to receive fees
    value: Bps            // Fee in basis points (100 = 1%)
}

type IntegratorFeeResponse = {
    receiver: EvmAddress
    value: Bps
    share: Bps  // Integrator's share (rest goes to protocol)
}

type ResolverFeeParams = {
    receiver: EvmAddress
    bps: Bps
    whitelistDiscount: Bps
}
```

### Event Decoding

New event classes for parsing escrow contract events:
```typescript
import {
    SrcEscrowCreatedEvent,
    DstEscrowCreatedEvent,
    EscrowWithdrawalEvent,
    EscrowCancelledEvent,
    FundsRescuedEvent,
    ImmutableFees
} from '@1inch/cross-chain-sdk'

// Decode SrcEscrowCreated event from log data
const event = SrcEscrowCreatedEvent.fromData(log.data)
console.log(event.srcImmutables)
console.log(event.dstImmutablesComplement)
console.log(event.dstImmutablesComplement.fees) // ImmutableFees with fee amounts
```

### API Versioning

Filter orders by API version:
```typescript
import { ApiVersion } from '@1inch/cross-chain-sdk'

// Get only v1.2 orders
const orders = await sdk.getActiveOrders({
    orderVersion: [ApiVersion.V1_2]
})

// Get cancellable orders for specific version
const cancellable = await sdk.getCancellableOrders(
    ChainType.EVM,
    1,
    100,
    [ApiVersion.V1_2]
)

// Filter public actions by version
const actions = await sdk.getReadyToExecutePublicActions({
    orderVersion: [ApiVersion.V1_2]
})
```

## Event Topic Hashes

| Event            | v1.x Topic                                                           | v2.x Topic                                                           |
|------------------|----------------------------------------------------------------------|----------------------------------------------------------------------|
| SrcEscrowCreated | `0x0e534c62f0afd2fa0f0fa71198e8aa2d549f24daf2bb47de0d5486c7ce9288ca` | `0x1140dcf80f027f65ebd1c2e98c33e3ebf7ef025d944a079256037cd55271bf98` |
| DstEscrowCreated | `0xc30e111dcc74fddc2c3a4d98ffb97adec4485c0a687946bf5b22c2a99c7ff96d` | unchanged                                                            |
| EscrowCancelled  | `0x6e3be9294e58d10b9c8053cfd5e09871b67e442fe394d6b0870d336b9df984a9` | unchanged                                                            |
| EscrowWithdrawal | `0xe346f5c97a360db5188bfa5d3ec5f0583abde420c6ba4d08b6cfe61addc17105` | unchanged                                                            |
| FundsRescued     | `0xc4474c2790e13695f6d2b6f1d8e164290b55370f87a542fd7711abe0a1bf40ac` | unchanged                                                            |

**Note:** Only `SrcEscrowCreated` topic changed due to the new `bytes parameters` field in the Immutables struct.

## Immutables ABI Changes

The `Immutables` struct now includes a `parameters` field for fee data:

**v1.x Immutables:**
```solidity
struct Immutables {
    bytes32 orderHash;
    bytes32 hashlock;
    address maker;
    address taker;
    address token;
    uint256 amount;
    uint256 safetyDeposit;
    uint256 timelocks;
}
```

**v2.x Immutables:**
```solidity
struct Immutables {
    bytes32 orderHash;
    bytes32 hashlock;
    address maker;
    address taker;
    address token;
    uint256 amount;
    uint256 safetyDeposit;
    uint256 timelocks;
    bytes parameters;  // NEW: encoded fee parameters
}
```

The `parameters` field encodes the `ImmutableFees` structure (128 bytes when present):
```typescript
type ImmutableFees = {
    resolverFeeAmount: bigint
    integratorFeeAmount: bigint
    resolverFeeRecipient: EvmAddress
    integratorFeeRecipient: EvmAddress
}
```

**Hash Computation:** `Immutables.hash()` now includes `keccak256(parameters)` in the hash computation.

## Migration Steps for v1.1 Services

If your service processes escrow events:

1. **Update event listeners** to handle both topic hashes for `SrcEscrowCreated`:
   ```typescript
   const V1_TOPIC = '0x0e534c62f0afd2fa0f0fa71198e8aa2d549f24daf2bb47de0d5486c7ce9288ca'
   const V1_2_TOPIC = '0x1140dcf80f027f65ebd1c2e98c33e3ebf7ef025d944a079256037cd55271bf98'
   
   // Listen for both
   const topics = [[V1_TOPIC, V1_2_TOPIC]]
   ```

2. **Decode events based on topic:**
   ```typescript
   if (log.topics[0] === V1_2_TOPIC) {
       const event = SrcEscrowCreatedEvent.fromData(log.data)
       // Access fee data via event.dstImmutablesComplement.fees
   }
   ```

3. **Filter orders by version** when querying APIs:
   ```typescript
   // To get only v1.1 orders (legacy)
   const legacyOrders = await sdk.getActiveOrders({
       orderVersion: [ApiVersion.V1_1]
   })
   
   // To get only v1.2 orders (with fees)
   const newOrders = await sdk.getActiveOrders({
       orderVersion: [ApiVersion.V1_2]
   })
   ```

4. **Update escrow address computation** if you compute addresses manually - the immutables hash now includes the parameters field.

5. **Update contract addresses** if you have hardcoded escrow factory or implementation addresses.

## New Exports

```typescript
// Fee-related
export { Bps } from '@1inch/limit-order-sdk'
export { Fees, IntegratorFee, ResolverFee } from '@1inch/fusion-sdk'

// Events
export {
    SrcEscrowCreatedEvent,
    DstEscrowCreatedEvent,
    EscrowCancelledEvent,
    EscrowWithdrawalEvent,
    FundsRescuedEvent
} from './domains/events'

// Fee parameters
export { ImmutableFees } from './domains/immutables-fees'

// API versioning
export { ApiVersion } from './api/orders/types'
```
