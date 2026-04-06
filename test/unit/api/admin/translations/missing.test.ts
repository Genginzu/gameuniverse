import { describe, test, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
vi.mock('@/lib/auth-admin', () => ({ requireAdmin: () => mockRequireAdmin() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

const mockFrom = vi.fn();
const mockRpc = vi.fn();
vi.mock('@/lib/supabase-server', () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom, rpc: mockRpc })),
}));

vi.mock('@/i18n/routing', () => ({ routing: { locales: ['fr', 'en'] } }));

const mockGetMissing = vi.fn(async () => ({ items: [{ id: 'e1', name: 'Game1' }], totalCount: 1 }));
vi.mock('@/lib/services/translationService', () => ({
  getMissingTranslations: (...args: unknown[]) => mockGetMissing(...args),
}));

vi.mock('@/lib/validations/admin-translation', () => ({
  missingQuerySchema: {
    safeParse: vi.fn(() => ({ success: true, data: { type: 'games', page: 1, limit: 20, search: '' } })),
  },
}));

import { GET } from '../../../../../src/app/api/admin/translations/missing/route';

describe('GET /api/admin/translations/missing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
  });

  test('returns 403 when not admin', async () => {
    mockRequireAdmin = vi.fn(() => { throw new Error('Admin access required'); });
    const req = new NextRequest('http://localhost/api/admin/translations/missing?type=games');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  test('returns 200 with items and pagination', async () => {
    const req = new NextRequest('http://localhost/api/admin/translations/missing?type=games');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items).toHaveLength(1);
    expect(json.pagination.totalCount).toBe(1);
  });
});
