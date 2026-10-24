import { describe, it, expect } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { defineRoute } from "@/lib/api/route";
import { useTestRouteEnvironment } from "@/test-helpers/route-environment";

useTestRouteEnvironment({ signedInAs: "user" });

const post = (body: string) =>
  new NextRequest("http://localhost/api/sample", { method: "POST", body });

const echoBody = defineRoute(
  { auth: "required", body: z.object({ name: z.string().min(2) }) },
  ({ body }) => NextResponse.json(body)
);

describe("defineRoute body", () => {
  it("gives the validated body to the handler", async () => {
    const res = await echoBody(post(JSON.stringify({ name: "Zelda", extra: true })));
    expect(await res.json()).toEqual({ name: "Zelda" });
  });

  it("answers 400 validation instead of 500 for malformed JSON", async () => {
    const res = await echoBody(post("{not json"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Invalid JSON body",
      code: "validation",
      details: { reason: "invalid_json" },
    });
  });

  it("answers 400 validation with the schema issues for an invalid body", async () => {
    const res = await echoBody(post(JSON.stringify({ name: "Z" })));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toMatchObject({ error: "Invalid request body", code: "validation" });
    expect(body.details).toEqual([expect.objectContaining({ path: ["name"] })]);
  });

  it("treats an empty body as an empty object when the schema allows it", async () => {
    const PATCH = defineRoute(
      { auth: "required", body: z.object({ name: z.string().optional() }) },
      ({ body }) => NextResponse.json(body)
    );
    expect(await (await PATCH(post(""))).json()).toEqual({});
  });
});

describe("defineRoute query and params", () => {
  const GET = defineRoute(
    {
      auth: "required",
      query: z.object({ page: z.coerce.number().int().min(1).default(1) }),
      params: z.object({ id: z.uuid() }),
    },
    ({ query, params }) => NextResponse.json({ page: query.page, id: params.id })
  );
  const ID = "00000000-0000-4000-8000-000000000001";
  const get = (search: string, id: string) =>
    GET(new NextRequest(`http://localhost/api/sample/${id}${search}`), {
      params: Promise.resolve({ id }),
    });

  it("gives the parsed query and params to the handler", async () => {
    expect(await (await get("?page=3", ID)).json()).toEqual({ page: 3, id: ID });
  });

  it("answers 400 validation for invalid query parameters", async () => {
    const res = await get("?page=0", ID);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Invalid query parameters", code: "validation" });
  });

  it("answers 400 validation for invalid route params", async () => {
    const res = await get("", "not-a-uuid");
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Invalid route parameters", code: "validation" });
  });

  it("passes the raw params when no params schema is declared", async () => {
    const DELETE = defineRoute({ auth: "required" }, ({ params }) => NextResponse.json(params));
    const res = await DELETE(new NextRequest("http://localhost/api/sample/abc"), {
      params: Promise.resolve({ slug: "abc" }),
    });
    expect(await res.json()).toEqual({ slug: "abc" });
  });
});
