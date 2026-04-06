import { describe, test, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
vi.mock('@/lib/auth-admin', () => ({ requireAdmin: () => mockRequireAdmin() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

const mockFrom = vi.fn();
vi.mock('@/lib/supabase-server', () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));

function chainMock(data: unknown, error: unknown = null) {
  const chain: any = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve({ data, error }));
  chain.then = (resolve: any) => Promise.resolve({ data, error }).then(resolve);
  return chain;
}

import { GET } from '@/app/api/admin/games/[id]/overrides/route';

const params = { params: Promise.resolve({ id: 'test-id' }) };

describe('GET /api/admin/games/[id]/overrides', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAdmin = vi.fn(); });

  test('returns 403 when not admin', async () => {
    mockRequireAdmin = vi.fn(() => { throw new Error('Admin access required'); });
    const res = await GET(new NextRequest('http://localhost/api/admin/games/test-id/overrides'), params);
    expect(res.status).toBe(403);
  });

  test('returns 200 with overrides', async () => {
    const overrides = [{ id: '1', game_id: 'test-id', field_name: 'translations' }];
    const chain = chainMock(overrides);
    mockFrom.mockReturnValue(chain);

    const res = await GET(new NextRequest('http://localhost/api/admin/games/test-id/overrides'), params);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.overrides).toEqual(overrides);
    expect(mockFrom).toHaveBeenCalledWith('game_field_overrides');
  });
});
