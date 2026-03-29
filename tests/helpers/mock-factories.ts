import { vi } from 'vitest';

export const SEPOLIA_AGENT_ID = '11155111:42';
export const BASE_AGENT_ID = '8453:17';
export const MOCK_WALLET = '0x1234567890abcdef1234567890abcdef12345678';
export const MOCK_OWNER = '0xOwnerAddress1234567890abcdef1234567890';

export function createMockHandle<T>(result: T, hash = '0xabcdef1234567890') {
  return { hash, waitMined: vi.fn(async () => ({ receipt: {}, result })) };
}

export function createMockAgent(overrides: Record<string, unknown> = {}) {
  return {
    agentId: SEPOLIA_AGENT_ID,
    name: 'TestAgent',
    description: 'A test agent',
    image: 'https://example.com/img.png',
    mcpEndpoint: 'https://mcp.example.com',
    a2aEndpoint: undefined as string | undefined,
    ensEndpoint: undefined as string | undefined,
    webEndpoint: undefined as string | undefined,
    emailEndpoint: undefined as string | undefined,
    mcpTools: [{ name: 'tool1' }],
    mcpPrompts: [],
    mcpResources: [],
    a2aSkills: [],
    oasfSkills: [],
    oasfDomains: [],
    walletAddress: MOCK_WALLET,
    getRegistrationFile: vi.fn(() => ({
      active: true,
      x402support: false,
      trustModels: ['reputation'],
      owners: [MOCK_OWNER],
      endpoints: [],
    })),
    getMetadata: vi.fn(() => ({ version: '1.0' })),
    getWallet: vi.fn(async () => MOCK_WALLET),
    // Write methods
    setMCP: vi.fn(async () => undefined),
    setA2A: vi.fn(async () => undefined),
    setENS: vi.fn(() => undefined),
    removeEndpoint: vi.fn(() => undefined),
    removeEndpoints: vi.fn(() => undefined),
    addSkill: vi.fn(() => undefined),
    removeSkill: vi.fn(() => undefined),
    addDomain: vi.fn(() => undefined),
    removeDomain: vi.fn(() => undefined),
    setActive: vi.fn(() => undefined),
    setX402Support: vi.fn(() => undefined),
    setTrust: vi.fn(() => undefined),
    setMetadata: vi.fn(() => undefined),
    delMetadata: vi.fn(() => undefined),
    updateInfo: vi.fn(() => undefined),
    setWallet: vi.fn(async () => createMockHandle({ agentId: SEPOLIA_AGENT_ID })),
    unsetWallet: vi.fn(async () => createMockHandle({ agentId: SEPOLIA_AGENT_ID })),
    registerOnChain: vi.fn(async () => createMockHandle({ agentId: SEPOLIA_AGENT_ID, agentURI: 'data:...' })),
    registerIPFS: vi.fn(async () => createMockHandle({ agentId: SEPOLIA_AGENT_ID, agentURI: 'ipfs://Qm...' })),
    registerHTTP: vi.fn(async (uri: string) => createMockHandle({ agentId: SEPOLIA_AGENT_ID, agentURI: uri })),
    setAgentURI: vi.fn(async () => createMockHandle({ agentId: SEPOLIA_AGENT_ID })),
    transfer: vi.fn(async () => createMockHandle({ txHash: '0xtx', from: '0xOld', to: '0xNew', agentId: SEPOLIA_AGENT_ID })),
    ...overrides,
  };
}

export function createMockSdk(overrides: Record<string, unknown> = {}) {
  const agent = createMockAgent();
  return {
    agent,
    sdk: {
      loadAgent: vi.fn(async () => agent),
      getAgent: vi.fn(async () => ({
        agentId: SEPOLIA_AGENT_ID,
        name: 'TestAgent',
        description: 'A test agent',
        active: true,
        mcpEndpoint: 'https://mcp.example.com',
      })),
      createAgent: vi.fn(() => agent),
      searchAgents: vi.fn(async () => [{ agentId: SEPOLIA_AGENT_ID, name: 'TestAgent', active: true }]),
      getReputationSummary: vi.fn(async () => ({ count: 10, averageValue: 75 })),
      searchFeedback: vi.fn(async () => [
        { agentId: SEPOLIA_AGENT_ID, reviewer: '0xReviewer1', value: 80, tag1: 'quality' },
        { agentId: SEPOLIA_AGENT_ID, reviewer: '0xReviewer2', value: 60, tag1: 'uptime' },
      ]),
      getAgentOwner: vi.fn(async () => MOCK_OWNER),
      isAgentOwner: vi.fn(async () => true),
      giveFeedback: vi.fn(async () => createMockHandle({ agentId: SEPOLIA_AGENT_ID, txHash: '0xfb1' })),
      getFeedback: vi.fn(async () => ({ agentId: SEPOLIA_AGENT_ID, reviewer: '0xClient', value: 80, tag1: 'quality' })),
      revokeFeedback: vi.fn(async () => createMockHandle({ agentId: SEPOLIA_AGENT_ID, txHash: '0xrv1' })),
      appendResponse: vi.fn(async () => createMockHandle({ agentId: SEPOLIA_AGENT_ID, txHash: '0xar1' })),
      prepareFeedbackFile: vi.fn((input: unknown) => input),
      transferAgent: vi.fn(async () => createMockHandle({ txHash: '0xtx1', from: '0xOld', to: '0xNew', agentId: SEPOLIA_AGENT_ID })),
      chainId: vi.fn(async () => 11155111),
      registries: vi.fn(() => ({
        identity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
        reputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
      })),
      identityRegistryAddress: vi.fn(() => '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432'),
      reputationRegistryAddress: vi.fn(() => '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63'),
      validationRegistryAddress: vi.fn(() => '0x0000000000000000000000000000000000000000'),
      getSubgraphClient: vi.fn(() => ({ query: vi.fn() })),
      isReadOnly: true,
      chainClient: { readContract: vi.fn() },
      ipfsClient: undefined,
      subgraphClient: { query: vi.fn() },
      request: vi.fn(async () => ({ data: 'response content', x402Required: false })),
      fetchWithX402: vi.fn(async () => ({ data: 'response content', x402Required: false })),
      ...overrides,
    },
  };
}

export function createMockAgentTask() {
  return {
    taskId: 'task-abc-123',
    contextId: 'ctx-001',
    query: vi.fn(async () => ({
      taskId: 'task-abc-123',
      contextId: 'ctx-001',
      status: { state: 'completed' },
      artifacts: [{ data: 'result' }],
    })),
    message: vi.fn(async () => ({
      role: 'agent',
      parts: [{ text: 'Here is my code review...' }],
    })),
    cancel: vi.fn(async () => ({
      taskId: 'task-abc-123',
      contextId: 'ctx-001',
      status: { state: 'canceled' },
    })),
  };
}

export function createMockPaymentRequired(price = '500000', network = 'base') {
  return {
    x402Required: true as const,
    x402Payment: {
      price,
      token: 'USDC',
      network,
      x402Version: 2,
      resource: 'https://api.example.com/analyze',
      accepts: [
        { price, token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', network: `eip155:8453`, destination: '0xRecipient', scheme: 'exact' },
      ],
      pay: vi.fn(async () => ({ data: 'paid response' })),
    },
  };
}
