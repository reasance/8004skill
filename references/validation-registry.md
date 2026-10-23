# Validation Registry

> Checked against EIP-8004 (Draft), `erc-8004/erc-8004-contracts` `master` and on-chain bytecode, October 2026. The contract is deployed on every chain in `chains.md`, but agent0-sdk v1.7.1 still does not expose validation request/response helpers.

## Purpose

The Validation Registry is the third ERC-8004 on-chain registry, alongside Identity and Reputation. It stores third-party attestations about agents from designated validators (auditors, TEE enclaves, monitoring services).

**Key difference from Reputation**: The Reputation Registry records peer feedback — any address can rate any agent. The Validation Registry records structured attestations from specific validator addresses requested by the agent owner. Reputation is subjective opinion; validation is third-party verification.

## How It Works

1. **Agent owner requests validation**: Calls `validationRequest()` specifying a validator address, agent ID, a request URI (off-chain document describing what to validate), and a request hash.
2. **Validator responds**: The designated validator calls `validationResponse()` with a score (0-100), response URI, response hash, and an optional tag.
3. **Results are queryable**: Anyone can read validation status, per-agent summaries, and filter by validator or tag.

## Contract Functions

### Write Functions

| Function | Caller | Description |
|---|---|---|
| `validationRequest(validatorAddress, agentId, requestURI, requestHash)` | Agent owner or operator | Request validation from a specific validator. Each request hash must be unique. |
| `validationResponse(requestHash, response, responseURI, responseHash, tag)` | Designated validator only | Respond to a validation request. Score is 0-100. Can be updated by calling again (overwrites previous response). |

### Read Functions

| Function | Returns | Description |
|---|---|---|
| `getValidationStatus(requestHash)` | `(validatorAddress, agentId, response, responseHash, tag, lastUpdate)` | Full status of a single validation request. |
| `getSummary(agentId, validatorAddresses[], tag)` | `(count, avgResponse)` | Aggregated validation stats for an agent. Filter by validator addresses (empty = all) and tag (empty = all). |
| `getAgentValidations(agentId)` | `bytes32[]` | All request hashes for an agent. |
| `getValidatorRequests(validatorAddress)` | `bytes32[]` | All request hashes a validator has been asked to handle. |

Like the other registries it also exposes `getIdentityRegistry()` and `getVersion()` (`"2.0.0"`).

> agent0-sdk v1.7.1 bundles an older `VALIDATION_REGISTRY_ABI` whose `getValidationStatus` omits `responseHash` (5 outputs). Decoding the live contract with that ABI gives wrong values — use the 6-output signature above.

## Deployed Addresses

Deterministic (CREATE2) like Identity and Reputation, verified with `eth_getCode` in October 2026 on every chain listed in `chains.md` that answered:

- **Mainnets**: `0x8004Cc8439f36fd5F9F049D9fF86523Df6dAAB58`
- **Testnets**: `0x8004Cb1BF31DAf7788923b405b754f57acEB4272`

These are not in the agent0-sdk defaults (`sdk.validationRegistryAddress()` returns nothing unless overridden) and not yet in the upstream README.

## Data Model

```
ValidationStatus {
  validatorAddress  address    // Who was asked to validate
  agentId           uint256    // Which agent
  response          uint8      // 0-100 score (0 = no response yet)
  responseHash      bytes32    // Hash of off-chain response document
  tag               string     // Category tag (e.g. "uptime", "security-audit")
  lastUpdate        uint256    // Block timestamp of last update
  hasResponse       bool       // Whether validator has responded
}
```

This is the contract's storage struct. `getValidationStatus()` returns the first six fields, not `hasResponse`.

## Current SDK Support

As of v1.7.1, the public `agent0-sdk` package exposes `sdk.validationRegistryAddress()` but does not expose validation request/response/read wrappers on `SDK`. To interact with validation today:

- Call the contract directly via viem/ethers at the addresses above, using the signatures in this file
- In SDK code, pass the address via `registryOverrides` in `SDKConfig` if you need `sdk.validationRegistryAddress()` to return it. The skill's env-based overrides (`REGISTRY_ADDRESS_IDENTITY`, `REGISTRY_ADDRESS_REPUTATION`) do not cover validation
- For queries, the agent0 subgraph schema includes validation entities (`Agent.validations`, `AgentValidationStats`), but the SDK has no search helpers for them — query the subgraph directly or run your own indexer

This is expected to gain first-class SDK wrapper methods in a future release. The 8004skill keeps validation as a reference-only area until those public APIs ship in the package itself.

## Upcoming (not deployed)

Upstream is working on TEE support for this registry (`feat/tee` branch, PR #81 `TEERegistryUpgradeable`): a key registry where approved verifiers add attested enclave keys (Nitro/TDX) and link them to agents (`addVerifier`, `addKey`, `linkKey`, `getKey`, …). The README marks the Validation Registry as "under active update and discussion with the TEE community". Nothing of this is on `master` or deployed as of October 2026.

## Use Cases

- **TEE attestation**: A TEE enclave validates that an agent runs in a secure environment and attests on-chain.
- **Security audits**: An auditor reviews an agent's code/behavior and records a score.
- **Uptime monitoring**: A monitoring service (e.g. watchtower) periodically validates endpoint reachability.
- **Compliance checks**: A regulatory validator attests that an agent meets specific standards.
