/**
 * Admin API: single home showcase item.
 * PATCH  /api/admin/home-showcase/[id] — update { libraryStatus } (games only)
 * DELETE /api/admin/home-showcase/[id] — remove the item
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { defineRoute } from "@/lib/api/route";
import {
  deleteShowcaseItem,
  updateShowcaseItemStatus,
} from "@/lib/services/homeShowcaseAdminService";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { updateShowcaseItemSchema } from "@/lib/validations/home-showcase";
import { showcaseErrorResponse } from "@/lib/utils/showcaseErrorResponse";

const paramsSchema = z.object({ id: z.uuid() });

export const PATCH = defineRoute(
  { auth: "admin", params: paramsSchema, body: updateShowcaseItemSchema },
  async ({ params, body }) => {
    try {
      await updateShowcaseItemStatus(getSupabaseAdmin(), params.id, body.libraryStatus);
      return NextResponse.json({ success: true });
    } catch (error) {
      return showcaseErrorResponse(error, "update");
    }
  }
);

export const DELETE = defineRoute({ auth: "admin", params: paramsSchema }, async ({ params }) => {
  try {
    await deleteShowcaseItem(getSupabaseAdmin(), params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return showcaseErrorResponse(error, "delete");
  }
});
