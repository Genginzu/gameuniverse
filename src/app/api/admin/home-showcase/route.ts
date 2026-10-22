/**
 * Admin API: home landing showcase (games of the library preview, characters
 * of the characters preview).
 * GET  /api/admin/home-showcase?locale=fr — list items ordered per kind
 * POST /api/admin/home-showcase           — add { kind, entityId, libraryStatus? }
 * PUT  /api/admin/home-showcase           — reorder { kind, ids }
 */

import { NextRequest, NextResponse } from "next/server";

import { adminGuardResponse } from "@/lib/auth-admin";
import {
  addShowcaseItem,
  listShowcaseItems,
  reorderShowcaseItems,
} from "@/lib/services/homeShowcaseAdminService";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { addShowcaseItemSchema, reorderShowcaseSchema } from "@/lib/validations/home-showcase";
import { showcaseErrorResponse } from "@/lib/utils/showcaseErrorResponse";

export async function GET(request: NextRequest) {
  const denied = await adminGuardResponse();
  if (denied) return denied;

  try {
    const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "fr";
    const items = await listShowcaseItems(getSupabaseAdmin(), locale);
    return NextResponse.json({ items });
  } catch (error) {
    return showcaseErrorResponse(error, "list");
  }
}

export async function POST(request: NextRequest) {
  const denied = await adminGuardResponse();
  if (denied) return denied;

  const parsed = addShowcaseItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  try {
    const created = await addShowcaseItem(getSupabaseAdmin(), parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return showcaseErrorResponse(error, "add");
  }
}

export async function PUT(request: NextRequest) {
  const denied = await adminGuardResponse();
  if (denied) return denied;

  const parsed = reorderShowcaseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  try {
    await reorderShowcaseItems(getSupabaseAdmin(), parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return showcaseErrorResponse(error, "reorder");
  }
}
