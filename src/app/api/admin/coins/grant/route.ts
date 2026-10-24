import { NextResponse } from "next/server";
import { z } from "zod";
import { defineRoute } from "@/lib/api/route";
import { CoinService } from "@/lib/services/coinService";
import { logger } from "@/lib/logger";

const grantSchema = z.object({
  playerId: z.uuid(),
  amount: z.number().int().refine((value) => value !== 0),
  description: z.string().trim().min(1),
  nonce: z.uuid(),
});

/**
 * Posts an admin grant. Error bodies carry a stable `code` the admin form
 * translates: invalid_request | insufficient_balance | grant_failed.
 * The body is validated here, not by defineRoute, to keep `invalid_request`.
 */
export const POST = defineRoute({ auth: "admin" }, async ({ request, user }) => {
  const parsed = grantSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  try {
    const result = await CoinService.grant({ adminId: user.id, ...parsed.data });
    if (result.posted) return NextResponse.json({ transaction: result.transaction });
    if (result.reason === "duplicate") return NextResponse.json({ duplicate: true });
    return NextResponse.json({ code: "insufficient_balance" }, { status: 409 });
  } catch (error) {
    logger.error("Admin coin grant failed", { error });
    return NextResponse.json({ code: "grant_failed" }, { status: 500 });
  }
});
