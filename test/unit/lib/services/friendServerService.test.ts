import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

const mockFrom = vi.fn();
vi.mock('@/lib/supabase-server', () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));

import { FriendServerService } from '@/lib/services/friendServerService';

function selectChain(data: unknown, error: unknown = null, count?: number) {
  const c: any = {};
  c.select = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  c.or = vi.fn(() => c);
  c.order = vi.fn(() => c);
  c.in = vi.fn(() => c);
  c.limit = vi.fn(() => c);
  c.maybeSingle = vi.fn(() => Promise.resolve({ data, error }));
  c.then = (res: any) => Promise.resolve({ data, error, count }).then(res);
  return c;
}

describe('FriendServerService.getFriends', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns friends list with pagination', async () => {
    const friendRows = [{ id: 'f1', receiver_id: 'friend-1', updated_at: '2024-01-01' }];
    const profileRows = [{ id: 'friend-1', username: 'Alice', avatar_url: null }];
    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'friendships') {
        callCount++;
        // First two calls: count queries (sender + receiver)
        if (callCount <= 2) return selectChain(null, null, callCount === 1 ? 1 : 0);
        // Next two: actual data queries (sender + receiver)
        if (callCount === 3) return selectChain(friendRows);
        return selectChain([]);
      }
      if (table === 'profiles') return selectChain(profileRows);
      return selectChain([]);
    });

    const result = await FriendServerService.getFriends('player-1', 1, 20);
    expect(result.friends).toHaveLength(1);
    expect(result.friends[0].displayName).toBe('Alice');
    expect(result.pagination.currentPage).toBe(1);
  });

  it('handles empty results', async () => {
    mockFrom.mockImplementation(() => selectChain([], null, 0));
    const result = await FriendServerService.getFriends('player-1');
    expect(result.friends).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });
});
