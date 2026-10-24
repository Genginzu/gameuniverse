import { describe, it, expect } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { defineRoute } from "@/lib/api/route";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

const routeEnv = useTestRouteEnvironment();

const request = (init?: { method?: string; body?: string }) =>
  new NextRequest("http://localhost/api/sample", init);

const ok = () => NextResponse.json({ ok: true });

describe("defineRoute authentication", () => {
  it("rejects a signed-out caller on a route that requires auth with 401", async () => {
    const GET = defineRoute({ auth: "required" }, ok);

    const res = await GET(request());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Authentication required", code: "unauthorized" });
  });

  it("gives the signed-in user to the handler", async () => {
    const signedIn = routeEnv.signIn("user");
    const GET = defineRoute({ auth: "required" }, ({ user }) => NextResponse.json({ id: user.id }));

    expect(await (await GET(request())).json()).toEqual({ id: signedIn.id });
  });

  it("lets a signed-out caller reach an optional-auth handler with a null user", async () => {
    const GET = defineRoute({ auth: "optional" }, ({ user }) =>
      NextResponse.json({ user: user ?? "anonymous" })
    );

    expect(await (await GET(request())).json()).toEqual({ user: "anonymous" });
  });
});

describe("defineRoute admin guard", () => {
  const POST = defineRoute({ auth: "admin" }, ({ user }) => NextResponse.json({ id: user.id }));

  it("answers 401, not 403, to a signed-out caller", async () => {
    expect((await POST(request({ method: "POST" }))).status).toBe(401);
  });

  it("answers 403 to a signed-in non-admin", async () => {
    routeEnv.signIn("contributor");
    const res = await POST(request({ method: "POST" }));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Admin access required", code: "forbidden" });
  });

  it("ignores a role the user wrote into their own user_metadata", async () => {
    routeEnv.signIn(testUser("user", { user_metadata: { role: "admin" } }));
    expect((await POST(request({ method: "POST" }))).status).toBe(403);
  });

  it("lets an admin through with their user", async () => {
    const admin = routeEnv.signIn("admin");
    expect(await (await POST(request({ method: "POST" }))).json()).toEqual({ id: admin.id });
  });
});

describe("defineRoute suspension", () => {
  it("refuses content writes from a suspended account with 403 suspended", async () => {
    routeEnv.signIn("user");
    routeEnv.suspend("2026-12-01T00:00:00Z");
    const POST = defineRoute({ auth: "required", writesContent: true }, ok);

    const res = await POST(request({ method: "POST" }));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: "Account suspended",
      code: "suspended",
      suspendedUntil: "2026-12-01T00:00:00Z",
    });
  });

  it("lets a suspended account use routes that do not write content", async () => {
    routeEnv.signIn("user");
    routeEnv.suspend();
    const POST = defineRoute({ auth: "required" }, ok);

    expect((await POST(request({ method: "POST" }))).status).toBe(200);
  });
});

describe("defineRoute rate limit", () => {
  it("answers 429 with Retry-After when the caller is over the limit", async () => {
    routeEnv.signIn("user");
    routeEnv.exceedRateLimit(42);
    const POST = defineRoute({ auth: "required", rateLimit: "comment" }, ok);

    const res = await POST(request({ method: "POST" }));

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("42");
    expect(await res.json()).toEqual({
      error: "Too many requests",
      code: "rate_limited",
      retryAfter: 42,
    });
  });

  it("charges a signed-in caller by user id and an anonymous one by IP", async () => {
    const POST = defineRoute({ auth: "optional", rateLimit: "view" }, ok);
    routeEnv.signIn(testUser("user", { id: "u-42" }));
    await POST(request({ method: "POST" }));
    routeEnv.signOut();
    await POST(
      new NextRequest("http://localhost/api/sample", {
        method: "POST",
        headers: { "x-forwarded-for": "203.0.113.7" },
      })
    );

    expect(routeEnv.rateLimitHits).toEqual(["view:user:u-42", "view:ip:203.0.113.7"]);
  });
});
