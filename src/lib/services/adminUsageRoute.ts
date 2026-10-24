import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute, notFound } from "@/lib/api/route";

interface UsageReference {
  table: string;
  column: string;
}

export interface AdminUsageSpec {
  table: string;
  keyColumn: string;
  param: string;
  refColumn?: string;
  references: UsageReference[];
}

export function createAdminUsageRoute(spec: AdminUsageSpec) {
  const refColumn = spec.refColumn ?? "id";

  return defineRoute({ auth: "admin" }, async ({ params }) => {
    const key = params[spec.param];
    const supabase = await createRouteHandlerClient();
    // Several admin tables are missing from the generated Supabase types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: entity, error: lookupError } = await db
      .from(spec.table)
      .select(refColumn)
      .eq(spec.keyColumn, key)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!entity) throw notFound("Not found");

    const counts = await Promise.all(
      spec.references.map(({ table, column }) =>
        db.from(table).select(column, { count: "exact", head: true }).eq(column, entity[refColumn])
      )
    );
    const failed = counts.find((result: { error: unknown }) => result.error);
    if (failed) throw failed.error;

    const usageCount = counts.reduce(
      (total: number, result: { count: number | null }) => total + (result.count ?? 0),
      0
    );
    return NextResponse.json({ usageCount });
  });
}
