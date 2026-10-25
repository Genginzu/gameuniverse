import { describe, it, expect } from "vitest";

import { AUTH_HINT_ATTRIBUTE, AUTH_HINT_SCRIPT, hasAuthCookie } from "@/lib/utils/authHint";

describe("hasAuthCookie", () => {
  it.each([
    ["sb-abcdef-auth-token=base64-xyz", true],
    ["theme=dark; sb-abcdef-auth-token.0=chunk", true],
    ["a=1;sb-local-auth-token=v", true],
    ["", false],
    ["theme=dark", false],
    ["sb-abcdef-auth-token-code-verifier=v", false],
    ["sb-abcdef-auth-token=", false],
    ["xsb-abcdef-auth-token=v", false],
  ])("returns the expected hint for %j", (cookie, expected) => {
    expect(hasAuthCookie(cookie)).toBe(expected);
  });
});

describe("AUTH_HINT_SCRIPT", () => {
  function runScript(cookie: string) {
    const attributes = new Map<string, string>();
    const fakeDocument = {
      cookie,
      documentElement: { setAttribute: (name: string, value: string) => attributes.set(name, value) },
    };
    new Function("document", AUTH_HINT_SCRIPT)(fakeDocument);
    return attributes;
  }

  it("flags the root element when a session cookie exists", () => {
    expect(runScript("sb-ref-auth-token=v").has(AUTH_HINT_ATTRIBUTE)).toBe(true);
  });

  it("leaves the root element untouched without a session cookie", () => {
    expect(runScript("theme=dark").size).toBe(0);
  });
});
