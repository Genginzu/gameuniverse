import type { MetadataRoute } from "next";
import { createServerClient } from "@/lib/supabase-server";

const BASE_URL = "https://gameuniverse.gg";
const LOCALES = ["fr", "en"] as const;

type Frequency = MetadataRoute.Sitemap[number]["changeFrequency"];

function entry(
  path: string,
  changeFrequency: Frequency,
  priority: number,
  lastModified?: string | null | undefined
): MetadataRoute.Sitemap[number] {
  return {
    url: `${BASE_URL}/fr${path}`,
    lastModified: lastModified ? new Date(lastModified) : new Date(),
    changeFrequency,
    priority,
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((locale) => [locale, `${BASE_URL}/${locale}${path}`])
      ),
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServerClient();

  const [{ data: games }, { data: rawCharacters }, { data: players }] = await Promise.all([
    supabase.from("games").select("slug, updated_at").eq("is_published", true),
    supabase.from("characters").select("slug, updated_at"),
    supabase.from("profiles").select("id, updated_at").eq("is_public", true),
  ]);

  const characters = (rawCharacters ?? []) as { slug: string; updated_at: string | null }[];

  const staticPages = [
    entry("", "daily", 1.0),
    entry("/games", "daily", 0.9),
    entry("/characters", "daily", 0.8),
    entry("/players", "weekly", 0.7),
    entry("/discussions", "daily", 0.7),
  ];

  const gamePages = (games ?? []).map((g) =>
    entry(`/games/${g.slug}`, "weekly", 0.8, g.updated_at)
  );

  const characterPages = (characters ?? []).map((c) =>
    entry(`/characters/${c.slug}`, "weekly", 0.7, c.updated_at)
  );

  const playerPages = (players ?? []).map((p) =>
    entry(`/players/${p.id}`, "monthly", 0.5, p.updated_at)
  );

  return [...staticPages, ...gamePages, ...characterPages, ...playerPages];
}
