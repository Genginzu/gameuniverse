import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

import { resolveGameIdFilters } from '@/lib/services/gameFilterResolvers';

function createMockSupabase(finalData: unknown[] | null) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const self = new Proxy(chain, { get: (target, prop) => {
    if (typeof prop !== 'string') return undefined;
    if (!target[prop]) target[prop] = vi.fn().mockReturnValue(self);
    return target[prop];
  }});
  // The chain eventually resolves when awaited
  (self as Record<string, unknown>)[Symbol.toPrimitive] = undefined;
  // Make the proxy thenable so await resolves it
  chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
    resolve({ data: finalData, error: null });
  });
  return self as never;
}

describe('gameFilterResolvers', () => {
  it('returns null when no filters', async () => {
    const sb = createMockSupabase(null);
    const result = await resolveGameIdFilters(sb, { search: '', genres: [], platforms: [] });
    expect(result).toEqual({ gameIds: null, error: null });
  });

  it('returns game IDs for search', async () => {
    const sb = createMockSupabase([{ game_id: 'g1' }, { game_id: 'g2' }]);
    const result = await resolveGameIdFilters(sb, { search: 'zelda', genres: [], platforms: [] });
    expect(result.gameIds).toEqual(['g1', 'g2']);
  });

  it('returns empty for no matches', async () => {
    const sb = createMockSupabase([]);
    const result = await resolveGameIdFilters(sb, { search: 'nonexistent', genres: [], platforms: [] });
    expect(result).toEqual({ gameIds: [], error: null });
  });
});
