import type { FavoriteCountResponse, FavoriteStatusResponse } from "@/types/character";

/** Predicted favorite status once the server confirms the toggle. */
export function favoriteStatusUpdater(isFavorite: boolean) {
  return (_current: FavoriteStatusResponse | undefined): FavoriteStatusResponse => ({ isFavorite });
}

/** Predicted public favorite count once the server confirms the toggle. */
export function favoriteCountUpdater(isFavorite: boolean) {
  return (current: FavoriteCountResponse | undefined): FavoriteCountResponse | undefined =>
    current && { count: Math.max(0, current.count + (isFavorite ? 1 : -1)) };
}
