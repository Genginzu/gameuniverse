import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import type { LinkedPlatform, GamingPlatform } from "@/types/linked-platforms";

const API_URL = "/api/profile/linked-platforms";

export function useLinkedPlatforms() {
  const { data, error, isLoading, mutate } = useSWR<LinkedPlatform[]>(API_URL, fetcher);

  /** Save a manual (pseudo) platform */
  const savePlatform = async (platform: GamingPlatform, platformUsername: string) => {
    const res = await fetch(API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, platformUsername }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const err = new Error(data.error || "Failed to save platform") as Error & { code?: string };
      if (data.code) err.code = data.code;
      throw err;
    }
    await mutate();
  };

  /** Connect PSN via NPSSO token */
  const connectPsn = async (npsso: string) => {
    const res = await fetch("/api/auth/psn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ npsso }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "PSN authentication failed");
    }
    await mutate();
  };

  const syncLibrary = async (
    platform: "steam" | "xbox"
  ): Promise<{
    total: number;
    matched: number;
    upserted: number;
    unmatched: number;
    imported?: number;
    privateProfile?: boolean;
  }> => {
    const res = await fetch(`/api/profile/${platform}/sync-library`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `${platform} sync failed`);
    }
    const result = await res.json();
    // Refresh the linked platforms query so lastSyncedAt updates in the UI.
    await mutate();
    return result;
  };

  const setVisibility = async (platform: GamingPlatform, isPublic: boolean) => {
    const res = await fetch(API_URL, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, isPublic }),
    });
    if (!res.ok) throw new Error("Failed to update visibility");
    await mutate();
  };

  const removePlatform = async (platform: GamingPlatform) => {
    const res = await fetch(API_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    if (!res.ok) throw new Error("Failed to delete platform");
    await mutate();
  };

  return {
    platforms: data ?? [],
    isLoading,
    error,
    savePlatform,
    connectPsn,
    syncLibrary,
    setVisibility,
    removePlatform,
    refresh: mutate,
  };
}
