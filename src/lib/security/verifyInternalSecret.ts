import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { safeEqual } from "@/lib/utils/safeEqual";

export const EDGE_CALLBACK_SECRET_ENV = "EDGE_CALLBACK_SECRET";
export const EDGE_CALLBACK_SECRET_HEADER = "x-edge-callback-secret";

export interface InternalSecretOptions {
  envVar: string;
  header: string;
}

export function verifyInternalSecret(
  request: Request,
  { envVar, header }: InternalSecretOptions
): NextResponse | null {
  const expectedSecret = process.env[envVar];
  if (!expectedSecret) {
    logger.error(`${envVar} not configured`);
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  if (!safeEqual(request.headers.get(header), expectedSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function verifyEdgeCallbackSecret(request: Request): NextResponse | null {
  return verifyInternalSecret(request, {
    envVar: EDGE_CALLBACK_SECRET_ENV,
    header: EDGE_CALLBACK_SECRET_HEADER,
  });
}
