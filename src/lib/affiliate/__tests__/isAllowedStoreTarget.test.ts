import { describe, it, expect } from "vitest";
import { buildAllowedHosts, isAllowedStoreTarget } from "@/lib/affiliate/isAllowedStoreTarget";

describe("buildAllowedHosts", () => {
  it("normalises store website urls into unique hosts", () => {
    expect(
      buildAllowedHosts([
        "https://www.amazon.fr",
        "https://amazon.fr/",
        "https://store.steampowered.com",
        null,
        "",
        "ftp://files.example.com",
        "not a url",
      ])
    ).toEqual(["amazon.fr", "store.steampowered.com"]);
  });
});

describe("isAllowedStoreTarget (open-redirect guard)", () => {
  const allowed = ["amazon.fr", "store.steampowered.com"];

  it("accepts the exact host and www variant", () => {
    expect(isAllowedStoreTarget("https://amazon.fr/dp/X", allowed)).toBe(true);
    expect(isAllowedStoreTarget("https://www.amazon.fr/dp/X", allowed)).toBe(true);
    expect(isAllowedStoreTarget("https://store.steampowered.com/app/1", allowed)).toBe(true);
  });

  it("accepts subdomains of an allowed host", () => {
    expect(isAllowedStoreTarget("https://smile.amazon.fr/dp/X", allowed)).toBe(true);
  });

  it("rejects hosts outside the allowlist", () => {
    expect(isAllowedStoreTarget("https://evil.com/?q=amazon.fr", allowed)).toBe(false);
    expect(isAllowedStoreTarget("https://steampowered.com/app/1", allowed)).toBe(false);
  });

  it("rejects look-alike suffix hosts", () => {
    expect(isAllowedStoreTarget("https://evilamazon.fr/dp/X", allowed)).toBe(false);
    expect(isAllowedStoreTarget("https://amazon.fr.evil.com/dp/X", allowed)).toBe(false);
  });

  it("rejects credentials tricks", () => {
    expect(isAllowedStoreTarget("https://amazon.fr@evil.com/", allowed)).toBe(false);
    expect(isAllowedStoreTarget("https://user:pass@amazon.fr/", allowed)).toBe(false);
  });

  it("rejects non-http protocols and malformed urls", () => {
    expect(isAllowedStoreTarget("javascript:alert(1)", allowed)).toBe(false);
    expect(isAllowedStoreTarget("//evil.com", allowed)).toBe(false);
    expect(isAllowedStoreTarget("data:text/html,hi", allowed)).toBe(false);
    expect(isAllowedStoreTarget("", allowed)).toBe(false);
  });

  it("rejects everything with an empty allowlist", () => {
    expect(isAllowedStoreTarget("https://amazon.fr/", [])).toBe(false);
  });
});
