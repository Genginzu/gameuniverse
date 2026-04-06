import { describe, test, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
vi.mock('@/lib/auth-admin', () => ({ requireAdmin: () => mockRequireAdmin() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

const mockFrom = vi.fn();
vi.mock('@/lib/supabase-server', () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));

vi.mock('@/lib/services/igdb-character-sync', () => ({
  CHARACTER_TRACKABLE_FIELDS: ['name', 'description'],
  syncCharacterField: vi.fn(async () => ({ success: true, syncedFields: ['name'] })),
  syncAllCharacterFields: vi.fn(async () => ({ success: true, syncedFields: ['name', 'description'] })),
}));

function chainMock(data: unknown, error: unknown = null) {
  const chain: any = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve({ data, error }));
  return chain;
}

import { POST } from '@/app/api/admin/characters/[id]/sync/route';

const params = { params: Promise.resolve({ id: 'test-id' }) };
const makeReq = (body: object) => new NextRequest('http://localhost/api/admin/characters/test-id/sync', {
  method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
});

describe('POST /api/admin/characters/[id]/sync', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAdmin = vi.fn(); });

  test('returns 403 when not admin', async () => {
    mockRequireAdmin = vi.fn(() => { throw new Error('Admin access required'); });
    const res = await POST(makeReq({}), params);
    expect(res.status).toBe(403);
  });

  test('returns 404 when character not found', async () => {
    mockFrom.mockReturnValue(chainMock(null, { message: 'not found' }));
    const res = await POST(makeReq({}), params);
    expect(res.status).toBe(404);
  });

  test('returns 400 when no igdb_id', async () => {
    mockFrom.mockReturnValue(chainMock({ id: 'test-id', igdb_id: null }));
    const res = await POST(makeReq({}), params);
    expect(res.status).toBe(400);
  });

  test('returns 200 with syncedFields', async () => {
    mockFrom.mockReturnValue(chainMock({ id: 'test-id', igdb_id: 123 }));
    const res = await POST(makeReq({}), params);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.syncedFields).toEqual(['name', 'description']);
  });
});
