import { NextResponse } from "next/server";

import { defineRoute } from "@/lib/api/route";
import { removeAdminFranchiseGame } from "@/lib/services/adminFranchiseGames";
import { createRouteHandlerClient } from "@/lib/supabase-server";

/** DELETE /api/admin/franchises/[id]/games/[gameId] — unlinks a game from the franchise. */
export const DELETE = defineRoute({ auth: "admin" }, async ({ params, user }) => {
  const supabase = await createRouteHandlerClient();
  await removeAdminFranchiseGame(supabase, params.id, params.gameId, user.id);
  return NextResponse.json({ success: true });
});
