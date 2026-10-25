import { NextResponse } from "next/server";

import { conflict, defineRoute } from "@/lib/api/route";
import { listAdminFranchises, saveAdminFranchise } from "@/lib/services/adminFranchiseService";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import {
  adminFranchiseFormSchema,
  franchiseQuerySchema,
} from "@/lib/validations/admin-franchise-form";

/** GET /api/admin/franchises — paginated franchises with their game count. */
export const GET = defineRoute(
  { auth: "admin", query: franchiseQuerySchema },
  async ({ query }) => {
    const supabase = await createRouteHandlerClient();
    const { franchises, totalCount } = await listAdminFranchises(supabase, query);
    const totalPages = Math.ceil(totalCount / query.limit);
    return NextResponse.json({
      franchises,
      pagination: {
        currentPage: query.page,
        totalPages,
        totalCount,
        limit: query.limit,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    });
  }
);

/** POST /api/admin/franchises — creates a franchise without IGDB id. */
export const POST = defineRoute(
  { auth: "admin", body: adminFranchiseFormSchema },
  async ({ body }) => {
    const supabase = await createRouteHandlerClient();
    const franchise = await saveAdminFranchise(supabase, body);
    if (!franchise) throw conflict("A franchise with this slug already exists");
    return NextResponse.json({ franchise }, { status: 201 });
  }
);
