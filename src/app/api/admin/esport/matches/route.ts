import { NextResponse } from "next/server";
import { z } from "zod";
import { defineRoute } from "@/lib/api/route";
import * as adminEsportService from "@/lib/services/adminEsportService";
import type { EsportMatch } from "@/types/esport";

const matchBodySchema = z.looseObject({
  name: z.string().min(1),
  status: z.string().min(1),
  match_type: z.string().min(1),
});

export const GET = defineRoute({ auth: "admin" }, async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const search = searchParams.get("search") || undefined;
  const tournamentId = searchParams.get("tournament_id") || undefined;

  const { matches, total } = await adminEsportService.getMatches(page, limit, search, tournamentId);
  return NextResponse.json({ matches, total, page, totalPages: Math.ceil(total / limit) });
});

export const POST = defineRoute({ auth: "admin", body: matchBodySchema }, async ({ body }) => {
  const match = await adminEsportService.upsertMatch(body as Partial<EsportMatch>);
  return NextResponse.json({ match }, { status: 201 });
});
