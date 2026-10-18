import { NextResponse, type NextRequest } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { issueOauthState } from "@/lib/services/oauthState";
import { consumeOauthReturn, issueOauthReturn } from "@/lib/services/oauthReturn";
import type { ConnectionOutcome, PlatformConnectionAdapter } from "@/types/platform-connection";
import { connectPlatform } from "./connectPlatform";
import { callbackUrl, fallbackFailureLocation, outcomeLocation } from "./outcomes";

const IMPLICIT_BRIDGE_HTML = `<!doctype html>
<html><head><meta charset="utf-8"><title>itch.io</title></head><body>
<script>
  (function () {
    var params = new URLSearchParams(location.hash.slice(1));
    fetch(location.pathname, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: params.get("access_token"),
        state: params.get("state"),
      }),
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (d) { location.replace(d && d.redirect ? d.redirect : "/"); })
      .catch(function () { location.replace("/"); });
  })();
</script>
Connecting to itch.io...
</body></html>`;

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL!;
}

function toFields(payload: unknown): URLSearchParams {
  const fields = new URLSearchParams();
  if (!payload || typeof payload !== "object") return fields;
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string") fields.set(key, value);
  }
  return fields;
}

async function resolveCallbackLocation(
  adapter: PlatformConnectionAdapter,
  readFields: () => Promise<URLSearchParams>
): Promise<string> {
  const base = baseUrl();
  try {
    const returnTo = await consumeOauthReturn();
    const fields = await readFields();
    const supabase = await createRouteHandlerClient();
    const outcome = await connectPlatform({
      adapter,
      supabase,
      fields,
      redirectUri: callbackUrl(base, adapter.provider),
    });
    return outcomeLocation(base, adapter.provider, outcome, returnTo);
  } catch (error) {
    logger.error("Platform callback crashed", { provider: adapter.provider, error });
    return fallbackFailureLocation(base, adapter.provider);
  }
}

export function createAuthorizeHandler(adapter: PlatformConnectionAdapter) {
  const buildAuthorizeUrl = adapter.buildAuthorizeUrl;
  if (!buildAuthorizeUrl) throw new Error(`${adapter.provider} has no authorize step`);

  return async function GET(request: NextRequest) {
    const base = baseUrl();
    const query = request.nextUrl.searchParams;
    await issueOauthReturn(query.get("returnTo"));
    const state = await issueOauthState(adapter.provider);
    const url = await buildAuthorizeUrl({
      state,
      redirectUri: callbackUrl(base, adapter.provider),
      baseUrl: base,
      query,
    });
    return NextResponse.redirect(url);
  };
}

export function createCallbackHandler(adapter: PlatformConnectionAdapter) {
  return async function GET(request: NextRequest) {
    const location = await resolveCallbackLocation(
      adapter,
      async () => request.nextUrl.searchParams
    );
    return NextResponse.redirect(location);
  };
}

export function createImplicitBridgeHandler() {
  return async function GET() {
    return new NextResponse(IMPLICIT_BRIDGE_HTML, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  };
}

export function createImplicitCallbackHandler(adapter: PlatformConnectionAdapter) {
  return async function POST(request: NextRequest) {
    const redirect = await resolveCallbackLocation(adapter, async () =>
      toFields(await request.json())
    );
    return NextResponse.json({ redirect });
  };
}

function npssoResponse(outcome: ConnectionOutcome) {
  if (outcome.status === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (outcome.status === "linked") {
    return NextResponse.json({
      success: true,
      username: outcome.profile.username,
      accountId: outcome.profile.externalId,
    });
  }
  const error =
    outcome.reason === "no_code"
      ? "NPSSO token is required"
      : (outcome.detail ?? outcome.message ?? "PSN authentication failed");
  return NextResponse.json({ error }, { status: 400 });
}

export function createNpssoHandler(adapter: PlatformConnectionAdapter) {
  return async function POST(request: NextRequest) {
    try {
      const supabase = await createRouteHandlerClient();
      const fields = toFields(await request.json().catch(() => null));
      const outcome = await connectPlatform({ adapter, supabase, fields, redirectUri: "" });
      return npssoResponse(outcome);
    } catch (error) {
      logger.error("PSN auth error", { error });
      const message = error instanceof Error ? error.message : "PSN authentication failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  };
}
