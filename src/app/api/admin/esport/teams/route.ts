import { NextResponse } from "next/server";
import { z } from "zod";
import { defineRoute } from "@/lib/api/route";
import * as adminEsportService from "@/lib/services/adminEsportService";
import type { EsportTeam } from "@/types/esport";

const teamBodySchema = z.looseObject({
  name: z.string().min(1),
  slug: z.string().min(1),
});

export const GET = defineRoute({ auth: "admin" }, async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const search = searchParams.get("search") || undefined;

  const { teams, total } = await adminEsportService.getTeams(page, limit, search);
  return NextResponse.json({ teams, total, page, totalPages: Math.ceil(total / limit) });
});

export const POST = defineRoute({ auth: "admin", body: teamBodySchema }, async ({ body }) => {
  const team = await adminEsportService.upsertTeam(body as Partial<EsportTeam>);
  return NextResponse.json({ team }, { status: 201 });
});
