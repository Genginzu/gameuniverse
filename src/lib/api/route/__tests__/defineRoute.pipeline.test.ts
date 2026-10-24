import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const { logError } = vi.hoisted(() => ({ logError: vi.fn() }));
vi.mock("@/lib/logger", () => ({
  logger: { error: logError, warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { conflict, defineRoute, notFound } from "@/lib/api/route";
import { useTestRouteEnvironment } from "@/test-helpers/route-environment";

const routeEnv = useTestRouteEnvironment({ signedInAs: "user" });

const post = (body = "{not json") =>
  new NextRequest("http://localhost/api/sample", { method: "POST", body });

const fullRoute = (auth: "required" | "admin" = "required") =>
  defineRoute(
    { auth, writesContent: true, rateLimit: "post", body: z.object({ text: z.string() }) },
    () => NextResponse.json({ ok: true })
  );

beforeEach(() => logError.mockReset());

describe("defineRoute step order", () => {
  it("refuses a non-admin before charging the rate limit", async () => {
    expect((await fullRoute("admin")(post())).status).toBe(403);
    expect(routeEnv.rateLimitHits).toEqual([]);
  });

  it("refuses a suspended account before charging the rate limit or reading the body", async () => {
    routeEnv.suspend();
    const res = await fullRoute()(post());

    expect(await res.json()).toMatchObject({ code: "suspended" });
    expect(routeEnv.rateLimitHits).toEqual([]);
  });

  it("charges the rate limit before reading the body, so malformed spam is counted", async () => {
    routeEnv.exceedRateLimit();
    expect((await fullRoute()(post())).status).toBe(429);
    expect(routeEnv.rateLimitHits).toEqual(["post:user:user-1"]);
  });
});

describe("defineRoute errors", () => {
  it("turns a RouteError thrown by the handler into its response without logging", async () => {
    const GET = defineRoute({ auth: "required" }, () => {
      throw notFound("Genre not found");
    });
    const PUT = defineRoute({ auth: "required" }, () => {
      throw conflict("Slug already exists");
    });

    const missing = await GET(post());
    const duplicate = await PUT(post());

    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: "Genre not found", code: "not_found" });
    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toEqual({ error: "Slug already exists", code: "conflict" });
    expect(logError).not.toHaveBeenCalled();
  });

  it("keeps the extra fields a conflict carries next to error and code", async () => {
    const DELETE = defineRoute({ auth: "required" }, () => {
      throw conflict("Genre in use", { type: "IN_USE", usageCount: 3, code: "ignored" });
    });

    const res = await DELETE(post());

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "Genre in use",
      code: "conflict",
      type: "IN_USE",
      usageCount: 3,
    });
  });

  it("answers 500 internal and logs once for an unexpected error", async () => {
    const GET = defineRoute({ auth: "required" }, () => {
      throw new Error("db exploded");
    });

    const res = await GET(new NextRequest("http://localhost/api/sample"));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal server error", code: "internal" });
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError.mock.calls[0][1]).toMatchObject({ method: "GET", path: "/api/sample" });
  });
});
