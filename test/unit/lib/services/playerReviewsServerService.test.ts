import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

const mockFrom = vi.fn();
vi.mock('@/lib/supabase-server', () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));

import { PlayerReviewsServerService } from '@/lib/services/playerReviewsServerService';

function chain(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'range']) c[m] = vi.fn().mockReturnValue(c);
  c.then = vi.fn((resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve));
  return c;
}

beforeEach(() => vi.clearAllMocks());

describe('PlayerReviewsServerService', () => {
  it('returns reviews with pagination', async () => {
    const countChain = chain({ count: 1, error: null });
    const dataChain = chain({
      data: [{ id: 'r1', user_id: 'p1', game_id: 'g1', rating: 15, content: 'Great', positive_points: [], negative_points: [], created_at: '2024-01-01', updated_at: '2024-01-01', games: { slug: 'game-1', cover_image_url: null, game_translations: [{ title: 'Game 1' }] } }],
      error: null,
    });
    let callCount = 0;
    mockFrom.mockImplementation(() => { callCount++; return callCount === 1 ? countChain : dataChain; });
    const result = await PlayerReviewsServerService.fetchPlayerReviews('p1', 'fr');
    expect(result.totalCount).toBe(1);
    expect(result.reviews[0].gameName).toBe('Game 1');
  });

  it('returns empty for no reviews', async () => {
    mockFrom.mockReturnValue(chain({ count: 0, error: null }));
    const result = await PlayerReviewsServerService.fetchPlayerReviews('p1', 'fr');
    expect(result).toEqual({ reviews: [], totalCount: 0 });
  });

  it('computes stats correctly', async () => {
    mockFrom.mockReturnValue(chain({ data: [{ rating: 5 }, { rating: 15 }], error: null }));
    const stats = await PlayerReviewsServerService.fetchPlayerReviewsStats('p1');
    expect(stats.totalCount).toBe(2);
    expect(stats.averageRating).toBe(10);
    expect(stats.distribution).toHaveLength(4);
  });
});
