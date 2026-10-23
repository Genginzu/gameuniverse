import type { LibraryStatusResponse } from "@/types/library";

/** Predicted library status once the server confirms the add or remove. */
export function libraryStatusUpdater(inLibrary: boolean) {
  return (_current: LibraryStatusResponse | undefined): LibraryStatusResponse => ({ inLibrary });
}
