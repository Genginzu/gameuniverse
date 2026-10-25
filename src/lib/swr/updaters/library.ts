import type { LibraryStatus, LibraryStatusResponse } from "@/types/library";

/**
 * Predicted library status once the server confirms the add or remove.
 * An added game takes the requested status, or the server default "owned".
 */
export function libraryStatusUpdater(inLibrary: boolean, status?: LibraryStatus) {
  return (_current: LibraryStatusResponse | undefined): LibraryStatusResponse =>
    inLibrary ? { inLibrary, status: status ?? "owned" } : { inLibrary };
}

/** Predicted library status once the server confirms a status change. */
export function libraryStatusChangeUpdater(status: LibraryStatus) {
  return (_current: LibraryStatusResponse | undefined): LibraryStatusResponse => ({
    inLibrary: true,
    status,
  });
}
