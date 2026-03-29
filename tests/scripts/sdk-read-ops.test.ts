import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupCliSpies } from '../helpers/cli-spies.js';
import { createMockSdk, createMockAgent, MOCK_WALLET } from '../helpers/mock-factories.js';
import { buildAgentDetails, submitAndWait } from '../../scripts/lib/shared.js';

setupCliSpies();

describe('SDK read-only method contracts', () => {
  const { sdk, agent } = createMockSdk();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loadAgent resolves with the agent object', async () => {
    const loaded = await sdk.loadAgent('11155111:42');
    expect(sdk.loadAgent).toHaveBeenCalledWith('11155111:42');
    expect(loaded).toBe(agent);
  });

  it('getAgent returns null for non-existent agent', async () => {
    sdk.getAgent.mockResolvedValueOnce(null);
    expect(await sdk.getAgent('11155111:999')).toBeNull();
  });

  it('searchAgents returns empty array when no matches', async () => {
    sdk.searchAgents.mockResolvedValueOnce([]);
    expect(await sdk.searchAgents({ keyword: 'nonexistent' })).toEqual([]);
  });

  it('getReputationSummary accepts optional tag filters', async () => {
    await sdk.getReputationSummary('11155111:42', 'quality', 'uptime');
    expect(sdk.getReputationSummary).toHaveBeenCalledWith('11155111:42', 'quality', 'uptime');
  });

  it('searchFeedback passes filter object through', async () => {
    const filters = { agents: ['11155111:42'], minValue: 50, maxValue: 100 };
    await sdk.searchFeedback(filters);
    expect(sdk.searchFeedback).toHaveBeenCalledWith(filters);
  });

  it('isAgentOwner returns false for non-owner', async () => {
    sdk.isAgentOwner.mockResolvedValueOnce(false);
    expect(await sdk.isAgentOwner('11155111:42', '0xNotOwner000000000000000000000000000000')).toBe(false);
  });

  it('getSubgraphClient returns undefined for unsupported chain', () => {
    sdk.getSubgraphClient.mockReturnValueOnce(undefined);
    expect(sdk.getSubgraphClient(999999)).toBeUndefined();
  });

  it('agent.getWallet handles no wallet gracefully', async () => {
    agent.getWallet.mockResolvedValueOnce(undefined);
    expect(await agent.getWallet()).toBeUndefined();
  });
});

describe('buildAgentDetails with SDK data', () => {
  it('combines agent + regFile into display-ready object', () => {
    const agent = createMockAgent();
    const regFile = agent.getRegistrationFile();
    const result = buildAgentDetails(agent, regFile, { walletAddress: MOCK_WALLET });
    expect(result.agentId).toBe('11155111:42');
    expect(result.name).toBe('TestAgent');
    expect(result.active).toBe(true);
    expect(result.walletAddress).toBe(MOCK_WALLET);
    expect(result.trustModels).toContain('reputation');
  });

  it('sanitizes long agent names and sets _truncated flag', () => {
    const agent = createMockAgent({ name: 'x'.repeat(600) });
    const regFile = agent.getRegistrationFile();
    const result = buildAgentDetails(agent, regFile);
    expect((result.name as string).length).toBe(500);
    expect(result._truncated).toBe(true);
  });
});

describe('submitAndWait with TransactionHandle', () => {
  it('waits for confirmation and returns result + txHash', async () => {
    const { createMockHandle } = await import('../helpers/mock-factories.js');
    const handle = createMockHandle({ agentId: '11155111:42' }, '0xMyTxHash');
    const { result, txHash } = await submitAndWait(handle as never);
    expect(txHash).toBe('0xMyTxHash');
    expect(result).toEqual({ agentId: '11155111:42' });
    expect(handle.waitMined).toHaveBeenCalledWith({ timeoutMs: 120_000 });
  });

  it('passes custom wait options', async () => {
    const { createMockHandle } = await import('../helpers/mock-factories.js');
    const handle = createMockHandle({ agentId: '11155111:42' });
    await submitAndWait(handle as never, { timeoutMs: 180_000, confirmations: 2 } as never);
    expect(handle.waitMined).toHaveBeenCalledWith({ timeoutMs: 180_000, confirmations: 2 });
  });
});
