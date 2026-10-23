# ERC-8004 Data Structures

> Checked against EIP-8004 (Draft, last revised 2026-01-25) and agent0-sdk v1.7.1 (`utils/registration-json.js`, `core/feedback-manager.js`), October 2026.

## Agent Registration File (IPFS / HTTP / on-chain data URI)

This is the JSON the `agentURI` resolves to — what the SDK publishes via `registerIPFS()`, `registerHTTP()` and `registerOnChain()`, and what other ERC-8004 tools read.

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "My Agent",
  "description": "An AI agent that does X",
  "image": "ipfs://Qm... or https://...",
  "services": [
    { "name": "MCP", "endpoint": "https://mcp.example.com/", "version": "2025-06-18" },
    { "name": "A2A", "endpoint": "https://agent.example.com/.well-known/agent-card.json", "version": "0.3.0" },
    { "name": "OASF", "endpoint": "ipfs://{cid}", "version": "0.8", "skills": [], "domains": [] },
    { "name": "ENS", "endpoint": "myagent.eth", "version": "v1" }
  ],
  "x402Support": false,
  "active": true,
  "registrations": [
    { "agentId": 42, "agentRegistry": "eip155:11155111:0x8004A818BFB912233c491871b3d84c89A494BD9e" }
  ],
  "supportedTrust": ["reputation", "crypto-economic", "tee-attestation"]
}
```

- `type`, `name`, `description`, `image`: keep ERC-721 apps compatible.
- `services`: open list of `{ name, endpoint, version? }`. Spec examples: `web`, `A2A`, `MCP`, `OASF`, `ENS`, `DID`, `email`. Extra keys (capabilities, OASF skills/domains) are allowed.
- `registrations`: SHOULD contain at least one entry; both fields are mandatory per entry. The SDK fills it once the agent has an ID.
- `supportedTrust`: optional — if absent or empty, the agent uses ERC-8004 for discovery only.
- The SDK may also write `updatedAt` and a `metadata` bag. These are not spec fields; readers should ignore what they don't know.

### SDK internal model (not the published format)

`agent.getRegistrationFile()` returns the SDK's normalized `RegistrationFile`, which differs from the published JSON. The SDK converts between them (`buildErc8004RegistrationJson`) and accepts both `services` and the legacy `endpoints` key when reading.

| Published JSON (spec) | SDK `RegistrationFile` |
|---|---|
| `services[].name` / `.endpoint` | `endpoints[].type` / `.value` (extra keys under `.meta`) |
| `supportedTrust` | `trustModels` |
| `x402Support` | `x402support` |
| `registrations[]` | `agentId` (`chainId:tokenId`) |
| — | `owners`, `operators` (read from chain, never published) |

`Agent.registerOnChain()` publishes the same logical registration JSON as a `data:application/json;base64,...` `agentURI`. `SDK.loadAgent()` in v1.6.0+ can decode those ERC-8004 data URIs directly.

## Agent Summary / Feedback / Reputation Summary

See `AgentSummary`, `Feedback`, and `getReputationSummary()` types in `sdk-types.md`.

## Feedback File (off-chain enrichment, uploaded to IPFS)

Optional. Only written when the feedback carries off-chain fields and an IPFS provider is configured; its URI and keccak hash go into `giveFeedback()`.

**Spec MUST fields** (the SDK always writes them): `agentRegistry` (`eip155:{chainId}:{identityRegistry}`), `agentId`, `clientAddress` (`eip155:{chainId}:{address}`), `createdAt` (ISO 8601), `value`, `valueDecimals`. Optional mirrors of on-chain data: `tag1`, `tag2`, `endpoint`.

**Enrichment fields** — the spec example nests them, the SDK writes them flat (as passed in `FeedbackFileInput`):

| Spec example (nested) | SDK / skill CLI (flat) |
|---|---|
| `mcp.tool` / `mcp.prompt` / `mcp.resource` | `mcpTool` / `mcpPrompt` / `mcpResource` (`--mcp-tool`, `--mcp-prompt`, `--mcp-resource`) |
| `a2a.skills` / `a2a.contextId` / `a2a.taskId` | `a2aSkills` / `a2aContextId` / `a2aTaskId` (`--a2a-skills`, `--a2a-context-id`, `--a2a-task-id`) |
| `oasf.skills` / `oasf.domains` | `oasfSkills` / `oasfDomains` (`--oasf-skills`, `--oasf-domains`) |
| `proofOfPayment { fromAddress, toAddress, chainId, txHash }` | `proofOfPayment` (same object, `--proof-of-payment-json`) |
| — (any extra field is allowed) | `text` (`--text`) |

Both shapes are valid — the spec only fixes the MUST fields. When reading feedback files written by other tools, expect either shape.

## On-Chain Metadata

Key-value pairs on the Identity Registry (not in registration file). Values are `bytes` (hex-encoded). Reserved key: `agentWallet` — it cannot be set via `setMetadata()` or `register()`. The registry sets it to the owner's address at registration (emitting a `MetadataSet` event), it changes only via `setAgentWallet` with a signature from the new wallet, and it is cleared when the agent is transferred.

## Agent Wallet (EIP-712)

Requires a signature from the new wallet: EIP-712 typed data for EOAs, ERC-1271 for smart contract wallets. Domain: `{ name: "ERC8004IdentityRegistry", version: "1", chainId, verifyingContract }`. Type: `AgentWalletSet { agentId: uint256, newWallet: address, owner: address, deadline: uint256 }`. Deadline within 300s of chain time.
