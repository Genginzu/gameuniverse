import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));
vi.mock('@/lib/services/playerStatsService', () => ({
  computeTotalPlayTime: (times: number[]) => times.reduce((a, b) => a + b, 0),
}));

import { queryAvailableYears, queryYearLibrary } from '@/lib/services/playerStatsYearHelpers';

describe('playerStatsYearHelpers', () => {
  it('returns sorted years', async () => {
    const mockSupabase = { from: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: [{ added_at: '2023-06-01' }, { added_at: '2021-03-01' }, { added_at: '2023-12-01' }], error: null }) };
    const years = await queryAvailableYears(mockSupabase, 'p1');
    expect(years).toEqual([2023, 2021]);
  });

  it('handles empty data', async () => {
    const mockSupabase = { from: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: [], error: null }) };
    const years = await queryAvailableYears(mockSupabase, 'p1');
    expect(years).toEqual([]);
  });

  it('returns year library entries', async () => {
    const mockSupabase = { from: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), lt: vi.fn().mockResolvedValue({ data: [{ play_time_hours: 10 }], error: null }) };
    const result = await queryYearLibrary(mockSupabase, 'p1', 2023, 'fr');
    expect(result).toHaveLength(1);
  });
});
