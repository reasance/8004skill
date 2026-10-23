# Supported Chains

> SDK defaults as of agent0-sdk v1.7.1. Deployments checked against the `erc-8004/erc-8004-contracts` README and verified on-chain (`eth_getCode` on the registry addresses via public RPCs), October 2026.

## Default RPC URLs (v1.7.0+)

Starting with v1.7.0, the SDK ships with built-in default RPC URLs for all full-support chains. This means `rpcUrl` is **optional in `SDKConfig`** when targeting these chains. The skill's scripts still require `--rpc-url` on every call — pass one of the public RPCs below if the user has no preference.

To override the default RPC for any chain (e.g., to use a dedicated provider like Alchemy or Infura), use the `overrideRpcUrls` config option:

```typescript
const sdk = new SDK({
  chainId: 8453,
  // No rpcUrl needed — SDK uses built-in default for Base
  overrideRpcUrls: {
    8453: 'https://base-mainnet.g.alchemy.com/v2/YOUR_KEY',  // Override Base
    1: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',      // Override Mainnet
  },
});
```

`overrideRpcUrls` is a `Record<number, string>` mapping chain IDs to RPC URLs. It applies to the primary chain and to any cross-chain `loadAgent()` calls.

## Cross-Chain `loadAgent()` (v1.7.0+)

The SDK can now load agents from a different chain than the one the SDK is initialized on. For example, an SDK initialized on Base (8453) can load an agent registered on Ethereum Mainnet (1):

```typescript
const sdk = new SDK({ chainId: 8453 });
const agent = await sdk.loadAgent('1:42');  // Loads agent 42 from Ethereum Mainnet
```

The SDK resolves the target chain's RPC URL in this order:
1. `overrideRpcUrls[targetChainId]` if set
2. Built-in default RPC for the target chain (full-support chains only)
3. Error if no RPC is available for the target chain

For deployed-but-not-indexed chains, provide the RPC via `overrideRpcUrls`:

```typescript
const sdk = new SDK({
  chainId: 8453,
  overrideRpcUrls: {
    42161: 'https://arb1.arbitrum.io/rpc',  // Needed for cross-chain load from Arbitrum
  },
});
const agent = await sdk.loadAgent('42161:7');  // Loads agent 7 from Arbitrum
```

## Full SDK Support

These chains have built-in registry addresses, subgraph URLs, and default RPC URLs (v1.7.0+). They work out of the box with the public SDK package — no configuration overrides needed.

| Chain | Chain ID | Type | Notes |
|-------|----------|------|-------|
| Ethereum Mainnet | 1 | Mainnet | Registry + subgraph |
| Ethereum Sepolia | 11155111 | Testnet | Recommended for testing |
| Polygon Mainnet | 137 | Mainnet | Registry + subgraph |
| Base Mainnet | 8453 | Mainnet | Registry + subgraph |
| Base Sepolia | 84532 | Testnet | Registry + subgraph |

## Deployed Chains (Manual Config)

These chains have ERC-8004 contracts deployed (same deterministic CREATE2 addresses) but are **not in the SDK defaults** (no built-in subgraph or RPC). Arbitrum One/Sepolia are proposed as defaults in agent0-ts PR #41, not yet released. To use them, set `SUBGRAPH_URL` to a subgraph instance for that chain. Optionally override registry addresses with `REGISTRY_ADDRESS_IDENTITY` / `REGISTRY_ADDRESS_REPUTATION` if they differ from defaults.

The public SDK defaults include Identity + Reputation addresses only. The Validation Registry is deployed too (see Contract Addresses) but not wired into the SDK.

### Mainnets

| Chain | Chain ID |
|-------|----------|
| Arbitrum One | 42161 |
| Optimism | 10 |
| Avalanche C-Chain | 43114 |
| BSC (BNB Chain) | 56 |
| Monad | 143 |
| Scroll | 534352 |
| Gnosis | 100 |
| Celo | 42220 |
| Taiko | 167000 |
| Linea | 59144 |
| MegaETH | 4326 |
| XLayer | 196 |
| Abstract | 2741 |
| Mantle | 5000 |
| Soneium | 1868 |
| GOAT Network | 2345 |
| Metis | 1088 |
| SKALE Base | 1187947933 |
| Shape | 360 |
| Robinhood Chain | 4663 |
| Billions | 45056 |
| Injective | 1776 |
| 0G | 16661 |

### Testnets

| Chain | Chain ID |
|-------|----------|
| Arbitrum Sepolia | 421614 |
| Optimism Sepolia | 11155420 |
| Polygon Amoy | 80002 |
| Avalanche Fuji | 43113 |
| BSC Testnet | 97 |
| Monad Testnet | 10143 |
| Scroll Sepolia | 534351 |
| Celo Sepolia | 11142220 |
| Taiko Hoodi | 167013 |
| MegaETH Testnet | 6343 |
| Linea Sepolia | 59141 |
| XLayer Testnet | 1952 |
| Abstract Sepolia | 11124 |
| Mantle Sepolia | 5003 |
| Soneium Minato | 1946 |
| Metis Sepolia | 59902 |
| Hedera Testnet | 296 |
| SKALE Base Sepolia | 324705682 |
| Arc Testnet | 5042002 |
| Shape Sepolia | 11011 |
| Robinhood Chain Testnet | 46630 |
| Billions Testnet | 6913 |
| Injective Testnet | 1439 |
| 0G Galileo Testnet | 16602 |

Scroll Sepolia (534351) is listed upstream but could not be re-verified in October 2026 (no working public RPC).

**Not deployed** (verified: no bytecode at the registry addresses, October 2026): Hedera Mainnet (295) — only Hedera Testnet has the contracts; Gnosis Chiado (10200); GOAT Testnet3 (48816). Earlier versions of this file listed them by mistake.

## Contract Addresses

All chains use deterministic CREATE2 deployment. Two address sets:

**Mainnet contracts** (chains 1, 137, 8453, 42161, 10, 43114, 56, 143, 534352, 100, 42220, 167000, 59144, 4326, 196, 2741, 5000, 1868, 2345, 1088, 1187947933, 360, 4663, 45056, 1776, 16661):
- Identity Registry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- Reputation Registry: `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`
- Validation Registry: `0x8004Cc8439f36fd5F9F049D9fF86523Df6dAAB58` (not in SDK defaults)

**Testnet contracts** (chains 11155111, 84532, 421614, 11155420, 80002, 43113, 97, 10143, 534351, 11142220, 167013, 6343, 59141, 1952, 11124, 5003, 1946, 59902, 296, 324705682, 5042002, 11011, 46630, 6913, 1439, 16602):
- Identity Registry: `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- Reputation Registry: `0x8004B663056A597Dffe9eCcC1965A193B7388713`
- Validation Registry: `0x8004Cb1BF31DAf7788923b405b754f57acEB4272` (not in SDK defaults)

## Public RPC Endpoints

### Full SDK Support Chains

- **Mainnet (1)**: `https://eth.llamarpc.com`, `https://rpc.ankr.com/eth`
- **Sepolia (11155111)**: `https://rpc.sepolia.org`, `https://ethereum-sepolia-rpc.publicnode.com`
- **Polygon (137)**: `https://polygon-rpc.com`, `https://rpc.ankr.com/polygon`
- **Base (8453)**: `https://mainnet.base.org`, `https://rpc.ankr.com/base`
- **Base Sepolia (84532)**: `https://sepolia.base.org`, `https://rpc.ankr.com/base_sepolia`

### Deployed Chains (commonly used RPCs)

- **Arbitrum (42161)**: `https://arb1.arbitrum.io/rpc`, `https://rpc.ankr.com/arbitrum`
- **Optimism (10)**: `https://mainnet.optimism.io`, `https://rpc.ankr.com/optimism`
- **Avalanche (43114)**: `https://api.avax.network/ext/bc/C/rpc`, `https://rpc.ankr.com/avalanche`
- **BSC (56)**: `https://bsc-dataseed.binance.org`, `https://rpc.ankr.com/bsc`
- **Gnosis (100)**: `https://rpc.gnosischain.com`, `https://rpc.ankr.com/gnosis`
- **Scroll (534352)**: `https://rpc.scroll.io`
- **Celo (42220)**: `https://forno.celo.org`
- **Linea (59144)**: `https://rpc.linea.build`
- **Monad (143)**: use the network RPC from your infra provider or local deployment config
- **MegaETH (4326)**: use the network RPC from your infra provider or local deployment config
- **Mantle (5000)**: `https://rpc.mantle.xyz`
- **Metis (1088)**: `https://andromeda.metis.io/?owner=1088`
- **Robinhood Chain (4663)**: `https://rpc.mainnet.chain.robinhood.com` · testnet (46630): `https://rpc.testnet.chain.robinhood.com/rpc`
- **Injective (1776)**: `https://sentry.evm-rpc.injective.network` · testnet (1439): `https://k8s.testnet.json-rpc.injective.network`
- **0G (16661)**: `https://evmrpc.0g.ai` · Galileo testnet (16602): `https://evmrpc-testnet.0g.ai`
- **Billions (45056)**: `https://billions-rpc.eu-north-2.gateway.fm` (unresponsive in October 2026; contracts confirmed via explorer.billions.network) · testnet (6913): `https://billions-testnet-rpc.eu-north-2.gateway.fm`

For the remaining deployed networks (XLayer, Soneium, GOAT Network, SKALE Base, Shape, Hedera Testnet, and related testnets), use the RPC endpoint from your infra provider or the chain's official docs.
