import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/services/igdbService', () => ({
  IGDBService: {
    buildImageUrl: vi.fn((id: string, size: string) => `https://images.igdb.com/igdb/image/upload/t_${size}/${id}.jpg`),
  },
}));

import { transformIGDBGameData } from '@/lib/services/igdb-sync-fields';
import type { IGDBGame } from '@/types/igdb';

const baseGame: Partial<IGDBGame> = { id: 1, name: 'Test', slug: 'test' };

describe('transformIGDBGameData', () => {
  it('transforms cover URL from cover.image_id', () => {
    const game = { ...baseGame, cover: { id: 10, image_id: 'co1234' } } as IGDBGame;
    const result = transformIGDBGameData(game);
    expect(result.coverUrl).toBe('https://images.igdb.com/igdb/image/upload/t_cover_big/co1234.jpg');
  });

  it('transforms background URL from artworks', () => {
    const game = { ...baseGame, artworks: [{ id: 1, image_id: 'ar5678' }] } as IGDBGame;
    const result = transformIGDBGameData(game);
    expect(result.backgroundUrl).toBe('https://images.igdb.com/igdb/image/upload/t_1080p/ar5678.jpg');
  });

  it('falls back to screenshots for background when no artworks', () => {
    const game = { ...baseGame, screenshots: [{ id: 1, image_id: 'sc9999' }] } as IGDBGame;
    const result = transformIGDBGameData(game);
    expect(result.backgroundUrl).toBe('https://images.igdb.com/igdb/image/upload/t_1080p/sc9999.jpg');
  });

  it('handles missing cover and artworks', () => {
    const result = transformIGDBGameData(baseGame as IGDBGame);
    expect(result.coverUrl).toBeNull();
    expect(result.backgroundUrl).toBeNull();
  });

  it('converts first_release_date to YYYY-MM-DD', () => {
    const game = { ...baseGame, first_release_date: 1705276800 } as IGDBGame;
    const result = transformIGDBGameData(game);
    expect(result.releaseDate).toBe('2024-01-15');
  });

  it('rounds aggregated_rating to metascore', () => {
    const game = { ...baseGame, aggregated_rating: 87.6 } as IGDBGame;
    const result = transformIGDBGameData(game);
    expect(result.metascore).toBe(88);
  });

  it('returns null metascore when no rating', () => {
    const result = transformIGDBGameData(baseGame as IGDBGame);
    expect(result.metascore).toBeNull();
  });
});
