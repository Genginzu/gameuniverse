import { NextResponse } from "next/server";
import { defineRoute, notFound, validationError } from "@/lib/api/route";
import { cancelDeletion, getDeletionStatus } from "@/lib/services/accountDeletionServerService";
import { purgeAccount } from "@/lib/services/accountPurgeService";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validId(params: Record<string, string>): string {
  const { id } = params;
  if (!UUID_REGEX.test(id)) throw validationError(undefined, "Invalid id");
  return id;
}

/** POST /api/admin/account-deletions/[id] — Admin: purge a pending deletion now. */
export const POST = defineRoute({ auth: "admin" }, async ({ params }) => {
  const id = validId(params);

  const status = await getDeletionStatus(id);
  if (!status.pending) throw notFound("No pending deletion");

  const outcome = await purgeAccount(id);
  if (!outcome.ok) return NextResponse.json({ error: "Purge failed" }, { status: 500 });
  return NextResponse.json(outcome);
});

/** DELETE /api/admin/account-deletions/[id] — Admin: cancel a pending deletion. */
export const DELETE = defineRoute({ auth: "admin" }, async ({ params }) => {
  const id = validId(params);

  const cancelled = await cancelDeletion(id);
  if (!cancelled) throw notFound("No pending deletion");
  return NextResponse.json({ cancelled: true });
});
