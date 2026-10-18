"use client";

import useSWR from "swr";

import { fetcher } from "@/lib/swr/fetcher";
import { esportGameOptionsUrl, type EsportGameOptionsSource } from "@/lib/listing/resources/esport";

export function useEsportGameOptions(source: EsportGameOptionsSource): string[] {
  const { data } = useSWR<{ games: string[] }>(esportGameOptionsUrl(source), fetcher, {
    revalidateOnFocus: false,
  });
  return data?.games ?? [];
}
