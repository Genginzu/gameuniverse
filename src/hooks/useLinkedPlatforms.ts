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
    if (!res.ok) throw new Error("Failed to save platform");
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
    removePlatform,
    refresh: mutate,
  };
}
