import { NextResponse } from "next/server";
import { z } from "zod";

import { defineRoute, notFound } from "@/lib/api/route";
import { getAdminFranchise } from "@/lib/services/adminFranchiseService";
import { addAdminFranchiseGame, listAdminFranchiseGames } from "@/lib/services/adminFranchiseGames";
import { GameImportService } from "@/lib/services/gameImportService";
import { createRouteHandlerClient } from "@/lib/supabase-server";

const querySchema = z.object({ locale: z.string().default("fr") });
/** A local game id, or an IGDB id imported first when the game is not in the catalogue. */
const bodySchema = z.union([
  z.object({ gameId: z.string().uuid() }),
  z.object({ igdbId: z.number().int().positive() }),
]);

async function resolveLocalGameId(body: z.infer<typeof bodySchema>): Promise<string | null> {
  if ("gameId" in body) return body.gameId;
  const result =
    (await GameImportService.findExistingGameByIgdbId(body.igdbId)) ??
    (await GameImportService.importFromIGDB(body.igdbId));
  return result.success ? (result.game?.id ?? null) : null;
}

/** GET /api/admin/franchises/[id]/games — games of the franchise, by release date. */
export const GET = defineRoute({ auth: "admin", query: querySchema }, async ({ params, query }) => {
  const supabase = await createRouteHandlerClient();
  if (!(await getAdminFranchise(supabase, params.id))) throw notFound("Franchise not found");
  return NextResponse.json({
    games: await listAdminFranchiseGames(supabase, params.id, query.locale),
  });
});

/**
 * POST /api/admin/franchises/[id]/games `{ gameId }` or `{ igdbId }` — links a
 * game to the franchise, importing it from IGDB first when needed.
 */
export const POST = defineRoute(
  { auth: "admin", body: bodySchema },
  async ({ params, body, user }) => {
    const supabase = await createRouteHandlerClient();
    if (!(await getAdminFranchise(supabase, params.id))) throw notFound("Franchise not found");
    const gameId = await resolveLocalGameId(body);
    if (!gameId)
      return NextResponse.json({ error: "Failed to import game from IGDB" }, { status: 502 });
    await addAdminFranchiseGame(supabase, params.id, gameId, user.id);
    return NextResponse.json({ success: true, gameId }, { status: 201 });
  }
);
