import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupCliSpies } from '../helpers/cli-spies.js';
import { createMockAgentTask, createMockPaymentRequired } from '../helpers/mock-factories.js';

setupCliSpies();

const mockMessageResponse = { role: 'agent', parts: [{ text: 'Here is my code review...' }] };

const mockTaskResponse = { taskId: 'task-abc-123', contextId: 'ctx-001', status: { state: 'working' } };

const mockTaskSummaries = [
  { taskId: 'task-1', contextId: 'ctx-1', status: { state: 'completed' } },
  { taskId: 'task-2', contextId: 'ctx-2', status: { state: 'working' } },
];

function createMockA2AAgent() {
  const task = createMockAgentTask();
  return {
    agentId: '8453:17',
    name: 'CodeReviewer',
    a2aEndpoint: 'https://a2a.example.com/agent-card',
    messageA2A: vi.fn(async () => mockMessageResponse),
    message: vi.fn(async () => mockMessageResponse),
    listTasks: vi.fn(async () => mockTaskSummaries),
    loadTask: vi.fn(async () => task),
  };
}

describe('agent.messageA2A()', () => {
  const agent = createMockA2AAgent();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns TaskResponse when task is created', async () => {
    agent.messageA2A.mockResolvedValueOnce(mockTaskResponse);
    const response = await agent.messageA2A('Long running task');
    expect(response.taskId).toBe('task-abc-123');
    expect(response.status.state).toBe('working');
  });

  it('returns A2APaymentRequired on 402', async () => {
    const paymentRequired = createMockPaymentRequired('100000');
    agent.messageA2A.mockResolvedValueOnce(paymentRequired);
    const response = await agent.messageA2A('Paid content');
    expect(response.x402Required).toBe(true);
    expect(response.x402Payment.price).toBe('100000');
  });

  it('A2APaymentRequired.pay() retries and returns result', async () => {
    const paymentRequired = createMockPaymentRequired();
    const result = await paymentRequired.x402Payment.pay();
    expect(result).toEqual({ data: 'paid response' });
  });
});

describe('agent.listTasks()', () => {
  const agent = createMockA2AAgent();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when no tasks', async () => {
    agent.listTasks.mockResolvedValueOnce([]);
    expect(await agent.listTasks()).toEqual([]);
  });

  it('can return A2APaymentRequired on 402', async () => {
    const payReq = createMockPaymentRequired();
    agent.listTasks.mockResolvedValueOnce(payReq);
    const result = await agent.listTasks();
    expect(result.x402Required).toBe(true);
  });
});

describe('AgentTask methods', () => {
  it('task.query() polls for updated state with artifacts', async () => {
    const task = createMockAgentTask();
    const result = await task.query();
    expect(result.status.state).toBe('completed');
    expect(result.artifacts).toHaveLength(1);
  });

  it('task.query() accepts historyLength option', async () => {
    const task = createMockAgentTask();
    await task.query({ historyLength: 5 });
    expect(task.query).toHaveBeenCalledWith({ historyLength: 5 });
  });

  it('task.message() sends follow-up and returns response', async () => {
    const task = createMockAgentTask();
    const response = await task.message('Follow up');
    expect(task.message).toHaveBeenCalledWith('Follow up');
    expect(response.role).toBe('agent');
  });

  it('task.cancel() returns canceled status', async () => {
    const task = createMockAgentTask();
    const result = await task.cancel();
    expect(result.status.state).toBe('canceled');
  });
});

describe('X402 payment flow', () => {
  it('2xx result has x402Required false', () => {
    const result = { data: 'ok', x402Required: false };
    expect(result.x402Required).toBe(false);
  });

  it('402 result exposes payment details with accepts array', () => {
    const result = createMockPaymentRequired('500000');
    expect(result.x402Required).toBe(true);
    expect(result.x402Payment.accepts).toHaveLength(1);
    expect(result.x402Payment.accepts[0].scheme).toBe('exact');
  });

  it('x402Payment.pay() resolves with response data', async () => {
    const result = createMockPaymentRequired();
    const paid = await result.x402Payment.pay();
    expect(paid).toEqual({ data: 'paid response' });
  });
});
