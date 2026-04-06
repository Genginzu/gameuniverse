import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));
vi.mock('@/lib/utils/postContentParser', () => ({ extractTags: () => [], extractMentions: () => [] }));

const mockFrom = vi.fn();
vi.mock('@/lib/supabase-server', () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));

import { PlayerPostsServerService } from '@/lib/services/playerPostsServerService';

function chain(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'range', 'ilike', 'insert', 'delete']) c[m] = vi.fn().mockReturnValue(c);
  c.single = vi.fn().mockResolvedValue(result);
  c.then = vi.fn((resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve));
  return c;
}

beforeEach(() => vi.clearAllMocks());

describe('PlayerPostsServerService', () => {
  it('fetches posts', async () => {
    const countChain = chain({ count: 1, error: null });
    const dataChain = chain({
      data: [{ id: 'p1', player_id: 'u1', content: 'Hello', image_url: null, created_at: '2024-01-01', updated_at: '2024-01-01', post_tags: [], post_mentions: [] }],
      error: null,
    });
    let callCount = 0;
    mockFrom.mockImplementation(() => { callCount++; return callCount === 1 ? countChain : dataChain; });
    const result = await PlayerPostsServerService.fetchPosts('u1');
    expect(result.totalCount).toBe(1);
    expect(result.posts[0].content).toBe('Hello');
  });

  it('creates post', async () => {
    const insertChain = chain({
      data: { id: 'p1', player_id: 'u1', content: 'New', image_url: null, created_at: '2024-01-01', updated_at: '2024-01-01', post_tags: [], post_mentions: [] },
      error: null,
    });
    mockFrom.mockReturnValue(insertChain);
    const post = await PlayerPostsServerService.createPost('u1', 'New');
    expect(post.id).toBe('p1');
  });

  it('deletes post', async () => {
    mockFrom.mockReturnValue(chain({ error: null }));
    await expect(PlayerPostsServerService.deletePost('p1')).resolves.toBeUndefined();
  });
});
