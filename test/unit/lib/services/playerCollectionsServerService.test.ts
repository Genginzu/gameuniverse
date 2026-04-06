import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

const mockFrom = vi.fn();
vi.mock('@/lib/supabase-server', () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));

import { PlayerCollectionsServerService } from '@/lib/services/playerCollectionsServerService';

function chain(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'range']) c[m] = vi.fn().mockReturnValue(c);
  c.then = vi.fn((resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve));
  return c;
}

beforeEach(() => vi.clearAllMocks());

describe('PlayerCollectionsServerService', () => {
  it('returns collections with pagination', async () => {
    const countChain = chain({ count: 1, error: null });
    const dataChain = chain({
      data: [{ id: 'c1', name: 'My Col', slug: 'my-col', description: null, is_public: true, updated_at: '2024-01-01', cover_image_url: null, game_collection_items: [] }],
      error: null,
    });
    let callCount = 0;
    mockFrom.mockImplementation(() => { callCount++; return callCount === 1 ? countChain : dataChain; });
    const result = await PlayerCollectionsServerService.fetchPlayerCollections('p1', true);
    expect(result.totalCount).toBe(1);
    expect(result.collections[0].name).toBe('My Col');
  });

  it('filters by visibility for non-owner', async () => {
    const countChain = chain({ count: 0, error: null });
    mockFrom.mockReturnValue(countChain);
    const result = await PlayerCollectionsServerService.fetchPlayerCollections('p1', false);
    expect(result).toEqual({ collections: [], totalCount: 0 });
    expect(countChain.eq).toHaveBeenCalledWith('is_public', true);
  });
});
