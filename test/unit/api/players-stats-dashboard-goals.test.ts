import { describe, test, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));
vi.mock('@/lib/utils/statsFormatters', () => ({ validatePlayerId: vi.fn(() => true) }));

const { mockUntypedTable } = vi.hoisted(() => ({ mockUntypedTable: vi.fn() }));
vi.mock('@/lib/utils/untypedTable', () => ({ untypedTable: mockUntypedTable }));

const { mockGetUser } = vi.hoisted(() => ({ mockGetUser: vi.fn() }));
vi.mock('@/lib/supabase-server', () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser }, from: vi.fn() })),
}));

function chainMock(data: unknown, error: unknown = null) {
  const chain: any = {};
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve({ data, error }));
  return chain;
}

import { POST } from '@/app/api/players/[id]/stats/dashboard/goals/route';

const params = { params: Promise.resolve({ id: 'user1' }) };

describe('POST /api/players/[id]/stats/dashboard/goals', () => {
  beforeEach(() => vi.clearAllMocks());

  test('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest('http://localhost/api/players/user1/stats/dashboard/goals', {
      method: 'POST', body: JSON.stringify({ goal_type: 'games_to_complete', target_value: 10 }),
    });
    const res = await POST(req, params);
    expect(res.status).toBe(401);
  });

  test('returns 403 when not owner', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'other' } } });
    const req = new NextRequest('http://localhost/api/players/user1/stats/dashboard/goals', {
      method: 'POST', body: JSON.stringify({ goal_type: 'games_to_complete', target_value: 10 }),
    });
    const res = await POST(req, params);
    expect(res.status).toBe(403);
  });

  test('returns 201 on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user1' } } });
    const goal = { id: 'goal1', goal_type: 'games_to_complete', target_value: 10 };
    mockUntypedTable.mockReturnValue(chainMock(goal));
    const req = new NextRequest('http://localhost/api/players/user1/stats/dashboard/goals', {
      method: 'POST', body: JSON.stringify({ goal_type: 'games_to_complete', target_value: 10 }),
    });
    const res = await POST(req, params);
    expect(res.status).toBe(201);
    expect((await res.json()).id).toBe('goal1');
  });
});
