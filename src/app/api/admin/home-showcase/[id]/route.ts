/**
 * Admin API: single home showcase item.
 * PATCH  /api/admin/home-showcase/[id] — update { libraryStatus } (games only)
 * DELETE /api/admin/home-showcase/[id] — remove the item
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { adminGuardResponse } from "@/lib/auth-admin";
import {
  deleteShowcaseItem,
  updateShowcaseItemStatus,
} from "@/lib/services/homeShowcaseAdminService";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { updateShowcaseItemSchema } from "@/lib/validations/home-showcase";
import { showcaseErrorResponse } from "@/lib/utils/showcaseErrorResponse";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function parseId(context: RouteContext): Promise<string | null> {
  const { id } = await context.params;
  return z.uuid().safeParse(id).success ? id : null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const denied = await adminGuardResponse();
  if (denied) return denied;

  const id = await parseId(context);
  const parsed = updateShowcaseItemSchema.safeParse(await request.json().catch(() => null));
  if (!id || !parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  try {
    await updateShowcaseItemStatus(getSupabaseAdmin(), id, parsed.data.libraryStatus);
    return NextResponse.json({ success: true });
  } catch (error) {
    return showcaseErrorResponse(error, "update");
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const denied = await adminGuardResponse();
  if (denied) return denied;

  const id = await parseId(context);
  if (!id) return NextResponse.json({ error: "invalid" }, { status: 400 });

  try {
    await deleteShowcaseItem(getSupabaseAdmin(), id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return showcaseErrorResponse(error, "delete");
  }
}
