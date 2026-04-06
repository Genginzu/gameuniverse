import { describe, test, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

const { mockRemoveItem } = vi.hoisted(() => ({ mockRemoveItem: vi.fn() }));
vi.mock('@/lib/services/collectionService', () => ({ removeItem: mockRemoveItem }));

const { mockGetUser } = vi.hoisted(() => ({ mockGetUser: vi.fn() }));
vi.mock('@/lib/supabase-server', () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser }, from: vi.fn() })),
}));

import { DELETE } from '@/app/api/players/[id]/collections/[slug]/items/[gameId]/route';

const params = { params: Promise.resolve({ id: 'user1', slug: 'my-col', gameId: 'g1' }) };

describe('DELETE /api/players/[id]/collections/[slug]/items/[gameId]', () => {
  beforeEach(() => vi.clearAllMocks());

  test('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no auth' } });
    const req = new NextRequest('http://localhost/api/players/user1/collections/my-col/items/g1', { method: 'DELETE' });
    const res = await DELETE(req, params);
    expect(res.status).toBe(401);
  });

  test('returns 204 on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user1' } }, error: null });
    mockRemoveItem.mockResolvedValue(undefined);
    const req = new NextRequest('http://localhost/api/players/user1/collections/my-col/items/g1', { method: 'DELETE' });
    const res = await DELETE(req, params);
    expect(res.status).toBe(204);
  });
});
