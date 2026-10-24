/**
 * Admin API: home landing showcase (games of the library preview, characters
 * of the characters preview).
 * GET  /api/admin/home-showcase?locale=fr — list items ordered per kind
 * POST /api/admin/home-showcase           — add { kind, entityId, libraryStatus? }
 * PUT  /api/admin/home-showcase           — reorder { kind, ids }
 */

import { NextResponse } from "next/server";

import { defineRoute } from "@/lib/api/route";
import {
  addShowcaseItem,
  listShowcaseItems,
  reorderShowcaseItems,
} from "@/lib/services/homeShowcaseAdminService";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { addShowcaseItemSchema, reorderShowcaseSchema } from "@/lib/validations/home-showcase";
import { showcaseErrorResponse } from "@/lib/utils/showcaseErrorResponse";

export const GET = defineRoute({ auth: "admin" }, async ({ request }) => {
  try {
    const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "fr";
    const items = await listShowcaseItems(getSupabaseAdmin(), locale);
    return NextResponse.json({ items });
  } catch (error) {
    return showcaseErrorResponse(error, "list");
  }
});

export const POST = defineRoute({ auth: "admin", body: addShowcaseItemSchema }, async ({ body }) => {
  try {
    const created = await addShowcaseItem(getSupabaseAdmin(), body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return showcaseErrorResponse(error, "add");
  }
});

export const PUT = defineRoute({ auth: "admin", body: reorderShowcaseSchema }, async ({ body }) => {
  try {
    await reorderShowcaseItems(getSupabaseAdmin(), body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return showcaseErrorResponse(error, "reorder");
  }
});
