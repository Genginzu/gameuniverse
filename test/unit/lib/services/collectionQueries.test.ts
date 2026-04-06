import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

const mockFrom = vi.fn();
vi.mock('@/lib/supabase-server', () => ({
  createServerClient: vi.fn(async () => ({ from: mockFrom })),
}));

import { fetchCollections, fetchCollectionDetail } from '@/lib/services/collectionQueries';

function chain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order']) c[m] = vi.fn().mockReturnValue(c);
  c.single = vi.fn().mockResolvedValue(result);
  c.then = vi.fn((resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve));
  return c;
}

beforeEach(() => vi.clearAllMocks());

describe('collectionQueries', () => {
  it('fetches collection list', async () => {
    mockFrom.mockReturnValue(chain({
      data: [{ id: 'c1', name: 'Col', slug: 'col', description: null, is_public: true, updated_at: '2024-01-01', cover_image_url: null, game_collection_items: [] }],
      error: null,
    }));
    const result = await fetchCollections('p1', 'p1');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Col');
  });

  it('fetches collection detail', async () => {
    const detailChain = chain({
      data: { id: 'c1', user_id: 'p1', name: 'Col', slug: 'col', description: null, is_public: true, cover_image_url: null, created_at: '2024-01-01', updated_at: '2024-01-01', game_collection_items: [] },
      error: null,
    });
    const profileChain = chain({ data: { id: 'p1', username: 'user1', avatar_url: null }, error: null });
    let callCount = 0;
    mockFrom.mockImplementation(() => { callCount++; return callCount === 1 ? detailChain : profileChain; });
    const result = await fetchCollectionDetail('p1', 'col', 'p1', 'fr');
    expect(result?.name).toBe('Col');
    expect(result?.items).toEqual([]);
  });
});
