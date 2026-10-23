# ERC-8004 Protocol Specification

> Checked against EIP-8004 (status: **Draft**, text last revised 2026-01-25) and agent0-sdk v1.7.1, October 2026. For contract ABI and events, see `erc-8004-contracts.md`. For SDK wrapper methods, see `sdk-api.md`. For data types, see `sdk-types.md`.

## Overview

ERC-8004 defines a standard for registering, discovering, and evaluating AI agents on EVM-compatible blockchains. It consists of three lightweight registries deployed at deterministic addresses across all supported chains.

## The Three Registries

### 1. Identity Registry (ERC-721)

Each agent is an NFT with: **Token ID** (auto-incremented), **Agent URI** (IPFS/HTTP/data: URI pointing to registration file), **On-chain metadata** (key-value pairs, e.g. `agentWallet`).

The agent's full identity (name, description, endpoints, capabilities) lives in the registration file. The NFT is ownership proof. Standard ERC-721 (transferable). Owner can update URI, metadata, wallet. On transfer, `agentWallet` is automatically cleared.

### 2. Reputation Registry

On-chain feedback for agents. Any address can submit feedback containing: Agent ID, a signed fixed-point **value** (`int128`) with **valueDecimals** (`uint8`, 0-18), up to 2 tags, plus an optional endpoint, feedback file URI and file hash. Only `value` and `valueDecimals` are required.

- **Value range**: the protocol does not cap the value to -100..100. The meaning depends on the tag — e.g. `starred` 87/100 → `value 87, decimals 0`; `uptime` 99.77% → `value 9977, decimals 2`; `responseTime` 560ms → `value 560`. The **-100..100 range used by this skill** (`feedback.ts --value`, star mapping 1★=20…5★=100) is a skill convention for quality ratings, not a protocol rule.
- **Storage**: `value`, `valueDecimals`, `tag1`, `tag2` and `isRevoked` are stored on-chain. `endpoint`, `feedbackURI` and `feedbackHash` are only emitted in the `NewFeedback` event. Free-text comments are never on-chain — they live in the off-chain feedback file.
- **Rules**: self-feedback is blocked (the contract reverts if the sender is the owner or an approved operator). Values/tags are immutable after submission — feedback can only be revoked (marked, not deleted). Anyone can append a response (e.g. the agent showing a refund, or an aggregator flagging spam).
- **Agents as clients**: when an agent gives feedback, it SHOULD use its `agentWallet` as the client address.

### 3. Validation Registry

Third-party attestations from designated validators (response 0-100). Deployed on every chain in `chains.md`, but rarely used yet — most interactions rely on Identity + Reputation, and agent0-sdk has no validation wrappers. Enables trust models beyond reputation (TEE attestations, crypto-economic staking, zkML). See `validation-registry.md`.

## Agent Identity

### Agent ID Format

- **Global**: `eip155:{chainId}:{identityRegistryAddress}:{tokenId}`
- **Short**: `{chainId}:{tokenId}` (used by 8004skill and most tools — works because all chains use same deterministic addresses)

### Registration File

Stored on IPFS, HTTP, or fully on-chain as a base64 `data:` URI. Contains: `type` (`https://eips.ethereum.org/EIPS/eip-8004#registration-v1`), name, description, image, `services` (endpoints), `x402Support`, `active`, `registrations` (the on-chain agentId + agentRegistry this file belongs to) and `supportedTrust`. See `agent-schema.md` for the JSON schema.

**Endpoint domain verification (optional)**: an agent can prove it controls an HTTPS endpoint's domain by serving `https://{domain}/.well-known/agent-registration.json` with a `registrations` entry matching its on-chain `agentRegistry` + `agentId`. Not needed when the domain already serves the agent's registration file.

### Endpoint Types

Each entry in `services` has a `name`, an `endpoint` and an optional `version`. The spec's examples:

| Name | Purpose | Endpoint |
|------|---------|----------|
| web | Agent website | URL |
| A2A | Agent-to-Agent protocol | URL to agent card (`/.well-known/agent-card.json`), version e.g. `0.3.0` |
| MCP | Model Context Protocol server | URL, version e.g. `2025-06-18` |
| OASF | Open Agentic Schema Framework | URI to OASF record, optional `skills` / `domains` |
| ENS | Ethereum Name Service | ENS name |
| DID | Decentralized Identifier | DID string |
| email | Contact | Email address |

The list is open — agents may add other entries (e.g. wallet addresses on other chains). The payment wallet itself is the on-chain `agentWallet`, not a registration-file field.

### Trust Models

Agents declare them in `supportedTrust`: `reputation`, `crypto-economic`, `tee-attestation`. The field is optional — if absent or empty, the agent uses ERC-8004 for discovery only, not trust. See `trust-boundaries.md`.

## Deterministic Deployment

All contracts deployed via CREATE2 with `hash(0xFF, deployer, salt, initCodeHash)`. Same deployer + salt + bytecode = identical addresses on every chain. No address lookup needed — hardcoded in SDK. See `chains.md` for addresses.

## Agent Lifecycle

1. **Register**: Mint agent NFT with registration file
2. **Configure**: Set endpoints, capabilities, OASF, wallet, trust models
3. **Discover**: Search via subgraph or semantic search
4. **Interact**: Connect via MCP/A2A endpoints
5. **Rate**: Submit on-chain feedback
6. **Update**: Modify metadata, endpoints, status
7. **Transfer**: Transfer NFT to new address (irreversible)

## Subgraph Indexing

Protocol uses The Graph for efficient querying. Not all chains have indexing — see `chains.md`. Subgraph has eventual consistency (seconds to minutes lag after writes). On-chain state is always authoritative.

## Glossary

| Term | Definition |
|---|---|
| A2A | Agent-to-Agent protocol via agent cards at `/.well-known/agent-card.json` (older agents may still serve `/.well-known/agent.json`) |
| Agent Card | JSON describing A2A agent capabilities/skills |
| Agent ID | `{chainId}:{tokenId}`. Full: `eip155:{chainId}:{registryAddress}:{tokenId}` |
| Agent URI | Pointer to registration file (IPFS, HTTP, or `data:` URI) |
| Agent Wallet | Reserved `agentWallet` metadata: payment address, set to the owner at registration, changed via EIP-712 (EOA) / ERC-1271 (contract wallet) signature, cleared on transfer |
| CREATE2 | Deterministic deployment — same addresses across all chains |
| EIP-712 | Typed structured data signing for wallet binding |
| ERC-721 | NFT standard. Agent identities are ERC-721 NFTs |
| ERC-8004 | Standard: three on-chain registries for AI agent economy |
| Feedback | On-chain signal: `value` + `valueDecimals`, up to 2 tags; endpoint/file URI emitted in the event; text only in the off-chain file |
| Feedback File | IPFS document enriching feedback (text, proof of payment, MCP/A2A/OASF fields) |
| IPFS | Decentralized storage for registration/feedback files |
| MCP | Model Context Protocol — primary endpoint type |
| OASF | Open Agentic Schema Framework — skills/domains taxonomy (agntcy/oasf) |
| Registration File | JSON profile (`type` registration-v1): services, x402Support, active, registrations, supportedTrust |
| Reputation Summary | Aggregated: count + averageValue (scale depends on the tag; the skill's trust labels assume -100..100 quality ratings) |
| Subgraph | The Graph indexer — eventual consistency |
| Trust Label | Derived label based on reputation count/averageValue |
| Trust Model | `reputation`, `crypto-economic`, or `tee-attestation` |
| Validation Registry | Third registry for validator attestations (limited SDK support) |
| WalletConnect | Protocol v2 for remote signing — agent never holds keys |
| X402 | HTTP 402 payment protocol for agent endpoints (stablecoin payments on the network the endpoint requests, e.g. USDC on Base) |

## Further Reading

- [Registration Best Practices](https://github.com/erc-8004/best-practices/blob/main/Registration.md)
- [Reputation Best Practices](https://github.com/erc-8004/best-practices/blob/main/Reputation.md)
- [ERC-8004 Spec](https://github.com/erc-8004/best-practices/blob/main/src/ERC8004SPEC.md)
- [OASF Taxonomy](https://github.com/agntcy/oasf)
