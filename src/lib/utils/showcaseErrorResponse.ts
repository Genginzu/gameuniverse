import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { ShowcaseError, type ShowcaseErrorCode } from "@/lib/services/homeShowcaseAdminService";

const STATUS_BY_CODE: Record<ShowcaseErrorCode, number> = {
  limit: 422,
  duplicate: 409,
  notFound: 404,
  database: 500,
};

/** Maps a showcase service error to its JSON response (`{ error: code }`). */
export function showcaseErrorResponse(error: unknown, context: string): NextResponse {
  if (error instanceof ShowcaseError) {
    if (error.code === "database") logger.error(`Home showcase ${context} failed`, { error });
    return NextResponse.json({ error: error.code }, { status: STATUS_BY_CODE[error.code] });
  }
  logger.error(`Home showcase ${context} failed`, { error });
  return NextResponse.json({ error: "database" }, { status: 500 });
}
