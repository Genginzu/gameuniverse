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
const mockDeleteChain: any = {};
mockDeleteChain.eq = vi.fn(() => Promise.resolve({ error: null }));

const mockFrom = vi.fn((table: string) => {
  if (table === 'igdb_webhook_events') return { insert: vi.fn(() => mockInsertChain), update: vi.fn(() => mockUpdateChain) };
  return {
    select: vi.fn(() => mockSelectChain),
    delete: vi.fn(() => mockDeleteChain),
  };
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
vi.mock('@/lib/realtime-updates', () => ({
  notifyGameDeleted: vi.fn(async () => {}),
  invalidateGameCache: vi.fn(async () => {}),
}));
vi.mock('@/lib/services/recommendation/cache', () => ({
  invalidateForDeletedGame: vi.fn(() => {}),
}));
vi.mock('@/lib/services/game-import/popularity', () => ({
  fetchAndSavePopularity: vi.fn(async () => {}),
}));

import { processWebhookEvent } from '@/lib/services/igdbWebhookService';

describe('processWebhookEvent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('logs event to DB and returns eventId + status for game update', async () => {
    const result = await processWebhookEvent('games', 'update', { id: 123 });
    expect(result.eventId).toBe('evt-1');
    expect(result.status).toBe('processed');
  });

  it('returns eventId for delete events and deletes the local game', async () => {
    const result = await processWebhookEvent('games', 'delete', { id: 456 });
    expect(result.eventId).toBe('evt-1');
    expect(result.status).toBe('processed');
    // The handler must issue a delete on the `games` table (cascades to related rows)
    expect(mockFrom).toHaveBeenCalledWith('games');
    expect(mockDeleteChain.eq).toHaveBeenCalledWith('id', 'local-g1');
  });

  it('handles character entity type', async () => {
    mockSelectChain.single.mockResolvedValueOnce({ data: { id: 'char-1' }, error: null });
    const result = await processWebhookEvent('characters', 'update', { id: 789 });
    expect(result.eventId).toBe('evt-1');
  });
});
