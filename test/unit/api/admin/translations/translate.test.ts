import { describe, test, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
vi.mock('@/lib/auth-admin', () => ({ requireAdmin: () => mockRequireAdmin() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));
const mockRpc = vi.fn(async () => ({ error: null }));
vi.mock('@/lib/supabase-server', () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom, rpc: mockRpc })),
}));

vi.mock('@/lib/services/translationService', () => ({
  getSourceText: vi.fn(async () => ({ sourceLang: 'fr', fields: { title: 'Jeu' } })),
  upsertTranslation: vi.fn(async () => {}),
}));

vi.mock('@/lib/services/aiTranslateService', () => ({
  translateFields: vi.fn(async () => ({ title: 'Translated' })),
}));

vi.mock('@/lib/validations/admin-translation', () => ({
  translateBodySchema: {
    safeParse: vi.fn(() => ({ success: true, data: { entityType: 'games', entityId: 'e1', targetLang: 'en', saveToDb: false } })),
  },
}));

vi.mock('@/types/admin-translations', () => ({ ENTITY_TABLE_MAP: { games: 'games', characters: 'characters' } }));

import { POST } from '../../../../../src/app/api/admin/translations/translate/route';

describe('POST /api/admin/translations/translate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
    mockSingle.mockResolvedValue({ data: { id: 'e1' }, error: null });
  });

  test('returns 403 when not admin', async () => {
    mockRequireAdmin = vi.fn(() => { throw new Error('Admin access required'); });
    const req = new NextRequest('http://localhost/api/admin/translations/translate', { method: 'POST', body: '{}' });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  test('returns 200 with translatedFields', async () => {
    const req = new NextRequest('http://localhost/api/admin/translations/translate', { method: 'POST', body: '{}' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.translatedFields).toEqual({ title: 'Translated' });
    expect(json.saved).toBe(false);
  });
});
