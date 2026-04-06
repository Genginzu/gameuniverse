import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

const mockFrom = vi.fn();
vi.mock('@/lib/supabase-server', () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));

import { fetchProfileMap, fetchLastMessages, fetchUnreadCounts } from '@/lib/services/discussionQueryHelpers';

function chain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'in', 'eq', 'neq', 'is', 'order']) c[m] = vi.fn().mockReturnValue(c);
  c.then = vi.fn((resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve));
  return c;
}

beforeEach(() => vi.clearAllMocks());

describe('discussionQueryHelpers', () => {
  it('returns profile map', async () => {
    mockFrom.mockReturnValue(chain({ data: [{ id: 'u1', username: 'alice', avatar_url: null }], error: null }));
    const map = await fetchProfileMap(['u1']);
    expect(map.get('u1')?.username).toBe('alice');
  });

  it('returns empty map for empty input', async () => {
    const map = await fetchProfileMap([]);
    expect(map.size).toBe(0);
  });

  it('returns last messages map', async () => {
    mockFrom.mockReturnValue(chain({ data: [{ conversation_id: 'c1', content: 'Hi', sender_id: 'u1', created_at: '2024-01-01' }], error: null }));
    const map = await fetchLastMessages(['c1']);
    expect(map.get('c1')?.content).toBe('Hi');
  });

  it('returns unread counts', async () => {
    mockFrom.mockReturnValue(chain({ data: [{ conversation_id: 'c1' }, { conversation_id: 'c1' }], error: null }));
    const map = await fetchUnreadCounts(['c1'], 'u2');
    expect(map.get('c1')).toBe(2);
  });
});
