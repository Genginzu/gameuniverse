import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute } from "@/lib/api/route";

/**
 * GET /api/admin/games/search?q=...&locale=fr
 * Lightweight game search by title for admin use (autocomplete).
 */
export const GET = defineRoute({ auth: "admin" }, async ({ request }) => {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const locale = searchParams.get("locale") ?? "fr";
    // Allow callers (e.g. the admin link dialog) to request more results.
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "10") || 10, 1), 50);

    if (query.length < 2) {
      return NextResponse.json([]);
    }

    const supabase = await createRouteHandlerClient();
    const term = `%${query}%`;

    // Search in game_translations by title (ilike)
    const { data: matches } = await supabase
      .from("game_translations")
      .select("game_id, title, language_code")
      .ilike("title", term)
      .limit(limit * 4);

    if (!matches || matches.length === 0) {
      return NextResponse.json([]);
    }

    // Deduplicate by game_id, prefer requested locale
    const byGame = new Map<string, { title: string; langCode: string }>();
    for (const m of matches) {
      if (!m.game_id) continue;
      const existing = byGame.get(m.game_id);
      if (!existing || m.language_code === locale) {
        byGame.set(m.game_id, { title: m.title, langCode: m.language_code ?? "" });
      }
    }

    const gameIds = [...byGame.keys()];

    // Fetch game details
    const { data: games } = await supabase
      .from("games")
      .select("id, slug, cover_image_url")
      .in("id", gameIds);

    const results = (games ?? []).map((g) => ({
      id: g.id,
      slug: g.slug,
      title: byGame.get(g.id)?.title ?? g.slug,
      coverImage: g.cover_image_url,
    }));

    // Sort: exact prefix matches first, then alphabetical
    const lowerQuery = query.toLowerCase();
    results.sort((a, b) => {
      const aStarts = a.title.toLowerCase().startsWith(lowerQuery) ? 0 : 1;
      const bStarts = b.title.toLowerCase().startsWith(lowerQuery) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.title.localeCompare(b.title);
    });

    return NextResponse.json(results.slice(0, limit));
  } catch {
    return NextResponse.json([], { status: 200 });
  }
});
