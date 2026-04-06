import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

const mockInsertChain: any = {};
mockInsertChain.select = vi.fn(() => mockInsertChain);
mockInsertChain.single = vi.fn(() => Promise.resolve({ data: { id: 'evt-1' }, error: null }));
const mockUpdateChain: any = {};
mockUpdateChain.eq = vi.fn(() => Promise.resolve({ error: null }));
const mockSelectChain: any = {};
mockSelectChain.eq = vi.fn(() => mockSelectChain);
mockSelectChain.single = vi.fn(() => Promise.resolve({ data: { id: 'local-g1' }, error: null }));

const mockFrom = vi.fn((table: string) => {
  if (table === 'igdb_webhook_events') return { insert: vi.fn(() => mockInsertChain), update: vi.fn(() => mockUpdateChain) };
  return { select: vi.fn(() => mockSelectChain) };
});

vi.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdmin: vi.fn(() => ({ from: mockFrom })),
}));
vi.mock('@/lib/services/gameImportService', () => ({
  GameImportService: { importFromIGDB: vi.fn(async () => ({ success: true, game: { id: 'g1', slug: 'test' } })) },
}));
vi.mock('@/lib/services/webhookDiffApplier', () => ({
  applyWebhookPayload: vi.fn(async () => ({ appliedFields: ['slug'], skippedFields: [], error: undefined })),
}));

import { processWebhookEvent } from '@/lib/services/igdbWebhookService';

describe('processWebhookEvent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('logs event to DB and returns eventId + status for game update', async () => {
    const result = await processWebhookEvent('games', 'update', { id: 123 });
    expect(result.eventId).toBe('evt-1');
    expect(result.status).toBe('processed');
  });

  it('returns eventId for delete events', async () => {
    const result = await processWebhookEvent('games', 'delete', { id: 456 });
    expect(result.eventId).toBe('evt-1');
    expect(result.status).toBe('processed');
  });

  it('handles character entity type', async () => {
    mockSelectChain.single.mockResolvedValueOnce({ data: { id: 'char-1' }, error: null });
    const result = await processWebhookEvent('characters', 'update', { id: 789 });
    expect(result.eventId).toBe('evt-1');
  });
});
