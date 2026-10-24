import { NextResponse } from "next/server";
import { z } from "zod";
import { defineRoute } from "@/lib/api/route";
import * as adminEsportService from "@/lib/services/adminEsportService";
import type { EsportTournament } from "@/types/esport";

const tournamentBodySchema = z.looseObject({
  name: z.string().min(1),
  slug: z.string().min(1),
});

export const GET = defineRoute({ auth: "admin" }, async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const search = searchParams.get("search") || undefined;

  const { tournaments, total } = await adminEsportService.getTournaments(page, limit, search);
  return NextResponse.json({ tournaments, total, page, totalPages: Math.ceil(total / limit) });
});

export const POST = defineRoute({ auth: "admin", body: tournamentBodySchema }, async ({ body }) => {
  const tournament = await adminEsportService.upsertTournament(body as Partial<EsportTournament>);
  return NextResponse.json({ tournament }, { status: 201 });
});
