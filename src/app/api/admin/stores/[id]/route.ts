import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { adminStoreAffiliateSchema } from "@/lib/validations/admin-store-affiliate";
import { updateStoreAffiliate } from "@/lib/services/adminStoreService";
import { logger } from "@/lib/logger";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * PUT /api/admin/stores/[id] - Update the affiliate configuration of a store.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid store id" }, { status: 400 });

    const body = await request.json().catch(() => null);
    const validation = adminStoreAffiliateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validation.error.issues },
        { status: 400 }
      );
    }

    const supabase = await createRouteHandlerClient();
    const store = await updateStoreAffiliate(supabase, id, validation.data);
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    return NextResponse.json({ store });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    logger.error("Error in admin store PUT", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
