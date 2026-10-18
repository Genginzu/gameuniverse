import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { listAdminStores } from "@/lib/services/adminStoreService";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/stores - List all stores with their affiliate configuration.
 */
export async function GET() {
  try {
    await requireAdmin();
    const supabase = await createRouteHandlerClient();
    const stores = await listAdminStores(supabase);
    return NextResponse.json({ stores });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Error in admin stores GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
