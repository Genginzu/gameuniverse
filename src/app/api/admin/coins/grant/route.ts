import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { CoinService } from "@/lib/services/coinService";
import { logger } from "@/lib/logger";

async function requireAdmin() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.rpc("is_admin", { user_id: user.id });
  return data ? user : null;
}

const grantSchema = z.object({
  playerId: z.uuid(),
  amount: z.number().int().refine((value) => value !== 0),
  description: z.string().trim().min(1),
  nonce: z.uuid(),
});

/**
 * Posts an admin grant. Error bodies carry a stable `code` the admin form
 * translates: invalid_request | insufficient_balance | grant_failed.
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = grantSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  try {
    const result = await CoinService.grant({ adminId: admin.id, ...parsed.data });
    if (result.posted) return NextResponse.json({ transaction: result.transaction });
    if (result.reason === "duplicate") return NextResponse.json({ duplicate: true });
    return NextResponse.json({ code: "insufficient_balance" }, { status: 409 });
  } catch (error) {
    logger.error("Admin coin grant failed", { error });
    return NextResponse.json({ code: "grant_failed" }, { status: 500 });
  }
}
