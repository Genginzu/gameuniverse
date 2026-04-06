import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CommentService } from '@/lib/services/commentService';

const originalFetch = globalThis.fetch;
beforeEach(() => { globalThis.fetch = vi.fn() as typeof fetch; });
afterEach(() => { globalThis.fetch = originalFetch; });

describe('CommentService', () => {
  it('fetches comments', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ comments: [], total: 0 }) } as Response);
    const result = await CommentService.fetchComments('char1');
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('characterId=char1'));
    expect(result).toEqual({ comments: [], total: 0 });
  });

  it('submits comment', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) } as Response);
    const result = await CommentService.submitComment('char1', { content: 'Nice', rating: 5 } as never);
    expect(result.success).toBe(true);
  });

  it('handles error on update', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Unauthorized' }) } as Response);
    await expect(CommentService.updateComment('char1', { content: 'x' } as never)).rejects.toThrow('Unauthorized');
  });
});
