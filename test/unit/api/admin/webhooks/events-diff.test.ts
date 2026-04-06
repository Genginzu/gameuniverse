import { describe, test, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

let mockRequireAdmin: ReturnType<typeof vi.fn>;
vi.mock('@/lib/auth-admin', () => ({ requireAdmin: () => mockRequireAdmin() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));
vi.mock('@/lib/services/webhook-diff-helpers', () => ({
  igdbCoverUrl: vi.fn((id: string) => `https://cover/${id}`),
  igdb1080pUrl: vi.fn((id: string) => `https://1080p/${id}`),
  unixToDate: vi.fn(() => '2024-01-01'),
  normalizeDate: vi.fn((d: string) => d),
  sorted: vi.fn((arr: string[]) => [...arr].sort()),
  fetchLocalGenres: vi.fn(async () => []),
  fetchLocalPlatforms: vi.fn(async () => []),
  fetchLocalCompanies: vi.fn(async () => []),
  fetchLocalScreenshots: vi.fn(async () => []),
  fetchLocalArtworks: vi.fn(async () => []),
  fetchLocalVideos: vi.fn(async () => []),
  fetchLocalSimilarGamesCount: vi.fn(async () => 0),
}));

const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));
vi.mock('@/lib/supabase-server', () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));

import { GET } from '@/app/api/admin/webhooks/events/[eventId]/diff/route';

describe('GET /api/admin/webhooks/events/[eventId]/diff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin = vi.fn();
  });

  test('returns 403 when not admin', async () => {
    mockRequireAdmin = vi.fn(() => { throw new Error('Admin access required'); });
    const req = new NextRequest('http://localhost/api/admin/webhooks/events/evt1/diff');
    const res = await GET(req, { params: Promise.resolve({ eventId: 'evt1' }) });
    expect(res.status).toBe(403);
  });

  test('returns 404 when event not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });
    const req = new NextRequest('http://localhost/api/admin/webhooks/events/evt1/diff');
    const res = await GET(req, { params: Promise.resolve({ eventId: 'evt1' }) });
    expect(res.status).toBe(404);
  });

  test('returns 200 with diff result', async () => {
    // First call: event, second call: game, third call: overrides
    let callCount = 0;
    mockSingle.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) return { data: { id: 'evt1', event_type: 'update', game_id: 'g1', igdb_id: 100, payload: { name: 'Test' } }, error: null };
      if (callCount === 2) return { data: { id: 'g1', slug: 'test', game_translations: [{ title: 'Test', description: null, language_code: 'en' }] }, error: null };
      return { data: [], error: null };
    });
    // Override the third from() call for overrides (returns select with no single)
    const mockOverrideSelect = vi.fn(() => ({ eq: vi.fn(() => ({ data: [], error: null })) }));
    let fromCallCount = 0;
    mockFrom.mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount <= 2) return { select: mockSelect };
      return { select: mockOverrideSelect };
    });

    const req = new NextRequest('http://localhost/api/admin/webhooks/events/evt1/diff');
    const res = await GET(req, { params: Promise.resolve({ eventId: 'evt1' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.eventId).toBe('evt1');
    expect(json.fields).toBeDefined();
  });
});
