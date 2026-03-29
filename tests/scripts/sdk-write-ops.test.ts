import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupCliSpies } from '../helpers/cli-spies.js';
import { createMockSdk, createMockHandle } from '../helpers/mock-factories.js';
import { submitAndWait } from '../../scripts/lib/shared.js';

setupCliSpies();

describe('register.ts Agent creation and registration', () => {
  const { sdk, agent } = createMockSdk();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createAgent returns an agent that supports method chaining', () => {
    const created = sdk.createAgent('TranslatorBot', 'Translates text', 'https://img.png');
    expect(sdk.createAgent).toHaveBeenCalledWith('TranslatorBot', 'Translates text', 'https://img.png');
    expect(created).toBe(agent);
  });

  it('registerIPFS returns TransactionHandle with hash and waitMined', async () => {
    const handle = await agent.registerIPFS();
    expect(handle.hash).toBeTruthy();
    const { result } = await handle.waitMined();
    expect(result.agentId).toBe('11155111:42');
    expect(result.agentURI).toContain('ipfs://');
  });

  it('registerHTTP passes URI through to TransactionHandle result', async () => {
    const handle = await agent.registerHTTP('https://metadata.example.com/agent.json');
    expect(agent.registerHTTP).toHaveBeenCalledWith('https://metadata.example.com/agent.json');
    const { result } = await handle.waitMined();
    expect(result.agentURI).toBe('https://metadata.example.com/agent.json');
  });

  it('registerOnChain returns TransactionHandle', async () => {
    const handle = await agent.registerOnChain();
    const { result } = await handle.waitMined();
    expect(result.agentId).toBe('11155111:42');
  });
});

describe('update-agent.ts Agent mutation methods', () => {
  const { agent } = createMockSdk();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updateInfo accepts partial fields', () => {
    agent.updateInfo('NewName', undefined, undefined);
    expect(agent.updateInfo).toHaveBeenCalledWith('NewName', undefined, undefined);
  });

  it('removeEndpoint accepts type+value filter', () => {
    agent.removeEndpoint({ type: 'a2a', value: 'https://old.example.com' });
    expect(agent.removeEndpoint).toHaveBeenCalledWith({ type: 'a2a', value: 'https://old.example.com' });
  });

  it('setTrust accepts all three model flags', () => {
    agent.setTrust(true, true, true);
    expect(agent.setTrust).toHaveBeenCalledWith(true, true, true);
  });
});

describe('feedback.ts SDK methods', () => {
  const { sdk } = createMockSdk();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('giveFeedback accepts decimal values', async () => {
    await sdk.giveFeedback('11155111:42', '99.77', 'quality', 'uptime', '', undefined);
    expect(sdk.giveFeedback).toHaveBeenCalledWith('11155111:42', '99.77', 'quality', 'uptime', '', undefined);
  });

  it('giveFeedback accepts negative values', async () => {
    await sdk.giveFeedback('11155111:42', '-3.2', 'quality', '', '', undefined);
    expect(sdk.giveFeedback).toHaveBeenCalledWith('11155111:42', '-3.2', 'quality', '', '', undefined);
  });

  it('giveFeedback with feedback file', async () => {
    const feedbackFile = { text: 'Great agent', mcpTool: 'tool1' };
    await sdk.giveFeedback('11155111:42', '80', 'quality', '', '', feedbackFile);
    expect(sdk.giveFeedback).toHaveBeenCalledWith('11155111:42', '80', 'quality', '', '', feedbackFile);
  });

  it('appendResponse passes response details through', async () => {
    await sdk.appendResponse('11155111:42', '0xClient', 0, { uri: 'ipfs://Qm...', hash: '0xhash' });
    expect(sdk.appendResponse).toHaveBeenCalledWith('11155111:42', '0xClient', 0, { uri: 'ipfs://Qm...', hash: '0xhash' });
  });
});

describe('transfer.ts SDK method', () => {
  it('transferAgent returns TransactionHandle with from/to in result', async () => {
    const { sdk } = createMockSdk();
    const handle = await sdk.transferAgent('137:5', '0xNewOwner');
    expect(handle.hash).toBeTruthy();
    const { result } = await handle.waitMined();
    expect(result.from).toBe('0xOld');
    expect(result.to).toBe('0xNew');
  });
});

describe('wallet.ts Agent methods', () => {
  const { agent } = createMockSdk();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('setWallet with pre-signed signature', async () => {
    await agent.setWallet('0xWallet', { signature: '0xpresigned' });
    expect(agent.setWallet).toHaveBeenCalledWith('0xWallet', { signature: '0xpresigned' });
  });

  it('setWallet returns undefined when wallet unchanged', async () => {
    agent.setWallet.mockResolvedValueOnce(undefined);
    expect(await agent.setWallet('0xSameWallet')).toBeUndefined();
  });

  it('unsetWallet returns undefined when already unset', async () => {
    agent.unsetWallet.mockResolvedValueOnce(undefined);
    expect(await agent.unsetWallet()).toBeUndefined();
  });
});

describe('submitAndWait helper', () => {
  it('waits for transaction and returns result + txHash', async () => {
    const handle = createMockHandle({ agentId: '11155111:42' }, '0xMyTxHash');
    const { result, txHash } = await submitAndWait(handle as never);
    expect(txHash).toBe('0xMyTxHash');
    expect(result).toEqual({ agentId: '11155111:42' });
    expect(handle.waitMined).toHaveBeenCalledWith({ timeoutMs: 120_000 });
  });

  it('passes custom wait options', async () => {
    const handle = createMockHandle({ agentId: '11155111:42' });
    await submitAndWait(handle as never, { timeoutMs: 180_000, confirmations: 2 } as never);
    expect(handle.waitMined).toHaveBeenCalledWith({ timeoutMs: 180_000, confirmations: 2 });
  });
});
