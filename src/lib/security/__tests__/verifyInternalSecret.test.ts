import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import {
  secretsMatch,
  verifyEdgeCallbackSecret,
  verifyInternalSecret,
  EDGE_CALLBACK_SECRET_HEADER,
} from "@/lib/security/verifyInternalSecret";

function requestWith(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/internal/test", { method: "POST", headers });
}

describe("secretsMatch", () => {
  it("accepts identical secrets", () => {
    expect(secretsMatch("s3cret-value", "s3cret-value")).toBe(true);
  });

  it("rejects different secrets of equal length", () => {
    expect(secretsMatch("s3cret-valuX", "s3cret-value")).toBe(false);
  });

  it("rejects secrets of different length", () => {
    expect(secretsMatch("short", "s3cret-value")).toBe(false);
  });

  it("rejects missing provided secret or empty expected secret", () => {
    expect(secretsMatch(null, "s3cret-value")).toBe(false);
    expect(secretsMatch(undefined, "s3cret-value")).toBe(false);
    expect(secretsMatch("", "")).toBe(false);
  });
});

describe("verifyInternalSecret", () => {
  beforeEach(() => {
    process.env.TEST_INTERNAL_SECRET = "expected-secret";
  });

  afterEach(() => {
    delete process.env.TEST_INTERNAL_SECRET;
  });

  const options = { envVar: "TEST_INTERNAL_SECRET", header: "x-test-secret" };

  it("returns null when the header matches", () => {
    expect(verifyInternalSecret(requestWith({ "x-test-secret": "expected-secret" }), options)).toBeNull();
  });

  it("returns 401 when the header is missing or wrong", () => {
    expect(verifyInternalSecret(requestWith(), options)?.status).toBe(401);
    expect(verifyInternalSecret(requestWith({ "x-test-secret": "nope" }), options)?.status).toBe(401);
  });

  it("returns 500 when the env var is not configured", () => {
    delete process.env.TEST_INTERNAL_SECRET;
    expect(verifyInternalSecret(requestWith({ "x-test-secret": "x" }), options)?.status).toBe(500);
  });
});

describe("verifyEdgeCallbackSecret", () => {
  afterEach(() => {
    delete process.env.EDGE_CALLBACK_SECRET;
  });

  it("reads EDGE_CALLBACK_SECRET and the edge callback header", () => {
    process.env.EDGE_CALLBACK_SECRET = "edge-secret";
    expect(verifyEdgeCallbackSecret(requestWith({ [EDGE_CALLBACK_SECRET_HEADER]: "edge-secret" }))).toBeNull();
    expect(verifyEdgeCallbackSecret(requestWith({ [EDGE_CALLBACK_SECRET_HEADER]: "other" }))?.status).toBe(401);
  });
});
