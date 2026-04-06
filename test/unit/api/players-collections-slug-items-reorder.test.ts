import { describe, test, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

const { mockReorderItems } = vi.hoisted(() => ({ mockReorderItems: vi.fn() }));
vi.mock('@/lib/services/collectionService', () => ({ reorderItems: mockReorderItems }));
vi.mock('@/lib/validations/collection', () => ({
  reorderCollectionItemsSchema: { safeParse: vi.fn((d: any) => ({ success: true, data: d })) },
}));

const { mockGetUser } = vi.hoisted(() => ({ mockGetUser: vi.fn() }));
vi.mock('@/lib/supabase-server', () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser }, from: vi.fn() })),
}));

import { PATCH } from '@/app/api/players/[id]/collections/[slug]/items/reorder/route';

const params = { params: Promise.resolve({ id: 'user1', slug: 'my-col' }) };
const makeReq = (body: object) => new NextRequest('http://localhost/api/players/user1/collections/my-col/items/reorder', {
  method: 'PATCH', body: JSON.stringify(body),
});

describe('PATCH /api/players/[id]/collections/[slug]/items/reorder', () => {
  beforeEach(() => vi.clearAllMocks());

  test('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no auth' } });
    const res = await PATCH(makeReq({ items: [] }), params);
    expect(res.status).toBe(401);
  });

  test('returns 200 on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user1' } }, error: null });
    mockReorderItems.mockResolvedValue(undefined);
    const res = await PATCH(makeReq({ items: ['g1', 'g2'] }), params);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });
});
