import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const EDGE_CALLBACK_SECRET_ENV = "EDGE_CALLBACK_SECRET";
export const EDGE_CALLBACK_SECRET_HEADER = "x-edge-callback-secret";

export function secretsMatch(provided: string | null | undefined, expected: string): boolean {
  if (typeof provided !== "string" || expected.length === 0) return false;
  const providedBuffer = Buffer.from(provided, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export interface InternalSecretOptions {
  envVar: string;
  header: string;
}

export function verifyInternalSecret(
  request: Request,
  { envVar, header }: InternalSecretOptions,
): NextResponse | null {
  const expectedSecret = process.env[envVar];
  if (!expectedSecret) {
    logger.error(`${envVar} not configured`);
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  if (!secretsMatch(request.headers.get(header), expectedSecret)) {
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
