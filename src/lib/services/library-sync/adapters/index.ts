import type { LibrarySyncAdapter, SyncablePlatform } from "@/types/library-sync";
import { playstationAdapter } from "./playstation";
import { steamAdapter } from "./steam";
import { xboxAdapter } from "./xbox";

const ADAPTERS: Record<SyncablePlatform, LibrarySyncAdapter> = {
  steam: steamAdapter,
  xbox: xboxAdapter,
  playstation: playstationAdapter,
};

export function getLibraryAdapter(platform: SyncablePlatform): LibrarySyncAdapter {
  return ADAPTERS[platform];
}
