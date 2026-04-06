import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DiscussionService } from '@/lib/services/discussionService';

const originalFetch = globalThis.fetch;
beforeEach(() => { globalThis.fetch = vi.fn() as typeof fetch; });
afterEach(() => { globalThis.fetch = originalFetch; });

describe('DiscussionService', () => {
  it('fetches conversations', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ conversations: [] }) } as Response);
    const result = await DiscussionService.fetchConversations();
    expect(result).toEqual({ conversations: [] });
  });

  it('sends message', async () => {
    const msg = { id: 'm1', content: 'Hi', senderId: 'u1', createdAt: '2024-01-01' };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(msg) } as Response);
    const result = await DiscussionService.sendMessage('conv1', 'Hi');
    expect(result.id).toBe('m1');
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('/conv1/messages'), expect.objectContaining({ method: 'POST' }));
  });

  it('handles error on createConversation', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Not friends' }) } as Response);
    await expect(DiscussionService.createConversation('f1')).rejects.toThrow('Not friends');
  });

  it('marks as read', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) } as Response);
    const result = await DiscussionService.markAsRead('conv1');
    expect(result.success).toBe(true);
  });

  it('fetches unread count', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ count: 5 }) } as Response);
    const result = await DiscussionService.fetchUnreadCount();
    expect(result).toEqual({ count: 5 });
  });
});
