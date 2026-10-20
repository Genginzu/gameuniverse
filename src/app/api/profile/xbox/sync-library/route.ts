import { createSyncLibraryHandler } from "@/lib/services/library-sync/syncLibraryRoute";

export const maxDuration = 60;

export const POST = createSyncLibraryHandler("xbox");
