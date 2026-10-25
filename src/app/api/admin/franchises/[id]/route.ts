import { NextResponse } from "next/server";

import { conflict, defineRoute, notFound } from "@/lib/api/route";
import {
  deleteAdminFranchise,
  getAdminFranchise,
  saveAdminFranchise,
} from "@/lib/services/adminFranchiseService";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { adminFranchiseFormSchema } from "@/lib/validations/admin-franchise-form";

/** GET /api/admin/franchises/[id] — a franchise with its descriptions. */
export const GET = defineRoute({ auth: "admin" }, async ({ params }) => {
  const supabase = await createRouteHandlerClient();
  const franchise = await getAdminFranchise(supabase, params.id);
  if (!franchise) throw notFound("Franchise not found");
  return NextResponse.json({ franchise });
});

/** PUT /api/admin/franchises/[id] — updates name, slug and descriptions. */
export const PUT = defineRoute(
  { auth: "admin", body: adminFranchiseFormSchema },
  async ({ params, body }) => {
    const supabase = await createRouteHandlerClient();
    if (!(await getAdminFranchise(supabase, params.id))) throw notFound("Franchise not found");
    const franchise = await saveAdminFranchise(supabase, body, params.id);
    if (!franchise) throw conflict("A franchise with this slug already exists");
    return NextResponse.json({ franchise });
  }
);

/** DELETE /api/admin/franchises/[id] — game links and descriptions cascade. */
export const DELETE = defineRoute({ auth: "admin" }, async ({ params }) => {
  const supabase = await createRouteHandlerClient();
  if (!(await getAdminFranchise(supabase, params.id))) throw notFound("Franchise not found");
  await deleteAdminFranchise(supabase, params.id);
  return NextResponse.json({ success: true });
});
