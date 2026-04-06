import { describe, test, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

vi.mock('@/lib/services/discussionServerService', () => ({
  DiscussionServerService: {
    getMessages: vi.fn(async () => ({ messages: [], hasMore: false })),
    sendMessage: vi.fn(async () => ({ id: 'm1', content: 'hello' })),
  },
}));
vi.mock('@/lib/validations/discussion', () => ({
  sendMessageSchema: { safeParse: vi.fn((d: any) => ({ success: true, data: { content: d.content } })) },
}));

const mockGetUser = vi.fn();
vi.mock('@/lib/supabase-server', () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser }, from: vi.fn() })),
}));

import { GET, POST } from '@/app/api/discussions/[conversationId]/messages/route';

const params = { params: Promise.resolve({ conversationId: 'conv1' }) };

describe('GET /api/discussions/[conversationId]/messages', () => {
  beforeEach(() => vi.clearAllMocks());

  test('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no auth' } });
    const req = new NextRequest('http://localhost/api/discussions/conv1/messages');
    const res = await GET(req, params);
    expect(res.status).toBe(401);
  });

  test('returns 200 with messages', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    const req = new NextRequest('http://localhost/api/discussions/conv1/messages');
    const res = await GET(req, params);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ messages: [], hasMore: false });
  });
});

describe('POST /api/discussions/[conversationId]/messages', () => {
  beforeEach(() => vi.clearAllMocks());

  test('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no auth' } });
    const req = new NextRequest('http://localhost/api/discussions/conv1/messages', {
      method: 'POST', body: JSON.stringify({ content: 'hello' }),
    });
    const res = await POST(req, params);
    expect(res.status).toBe(401);
  });

  test('returns 201 with message', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    const req = new NextRequest('http://localhost/api/discussions/conv1/messages', {
      method: 'POST', body: JSON.stringify({ content: 'hello' }),
    });
    const res = await POST(req, params);
    expect(res.status).toBe(201);
    expect((await res.json()).id).toBe('m1');
  });
});
