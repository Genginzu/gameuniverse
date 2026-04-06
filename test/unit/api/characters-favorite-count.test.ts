import { describe, test, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

vi.mock('@/lib/services/characterFavoriteService', () => ({
  CharacterFavoriteService: { getFavoriteCount: vi.fn(async () => 42) },
}));

const mockFrom = vi.fn();
vi.mock('@/lib/supabase-server', () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: vi.fn() }, from: mockFrom })),
}));

function chainMock(data: unknown, error: unknown = null) {
  const chain: any = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve({ data, error }));
  return chain;
}

import { GET } from '@/app/api/characters/[slug]/favorite/count/route';

describe('GET /api/characters/[slug]/favorite/count', () => {
  beforeEach(() => vi.clearAllMocks());

  test('returns 404 when character not found', async () => {
    mockFrom.mockReturnValue(chainMock(null, { message: 'not found' }));
    const req = new NextRequest('http://localhost/api/characters/unknown/favorite/count');
    const res = await GET(req, { params: Promise.resolve({ slug: 'unknown' }) });
    expect(res.status).toBe(404);
  });

  test('returns 200 with count', async () => {
    mockFrom.mockReturnValue(chainMock({ id: 'c1' }));
    const req = new NextRequest('http://localhost/api/characters/mario/favorite/count');
    const res = await GET(req, { params: Promise.resolve({ slug: 'mario' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.count).toBe(42);
  });
});
