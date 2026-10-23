import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";

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

type RouteContext = { params: Promise<Record<string, string>> };

export function createAdminUsageRoute(spec: AdminUsageSpec) {
  const refColumn = spec.refColumn ?? "id";

  return async function GET(_request: NextRequest, { params }: RouteContext) {
    try {
      await requireAdmin();
      const key = (await params)[spec.param];
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
      if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const counts = await Promise.all(
        spec.references.map(({ table, column }) =>
          db
            .from(table)
            .select(column, { count: "exact", head: true })
            .eq(column, entity[refColumn])
        )
      );
      const failed = counts.find((result: { error: unknown }) => result.error);
      if (failed) throw failed.error;

      const usageCount = counts.reduce(
        (total: number, result: { count: number | null }) => total + (result.count ?? 0),
        0
      );
      return NextResponse.json({ usageCount });
    } catch (error) {
      if (error instanceof Error && error.message === "Admin access required") {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
      logger.error(`Error counting ${spec.table} usage`, { error });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
