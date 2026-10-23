import { describe, it, expect } from "vitest";

import { resolveActiveHref } from "@/lib/navigation";

describe("resolveActiveHref", () => {
  it("returns null without a pathname", () => {
    expect(resolveActiveHref([{ href: "/games" }], { pathname: null })).toBeNull();
  });

  it("matches exact links on the same pathname only", () => {
    const links = [{ href: "/library" }, { href: "/library/backlog" }];
    expect(resolveActiveHref(links, { pathname: "/library" })).toBe("/library");
    expect(resolveActiveHref(links, { pathname: "/library/backlog" })).toBe("/library/backlog");
    expect(resolveActiveHref(links, { pathname: "/library/other" })).toBeNull();
  });

  it("lets a link with a query win only when every query param is present", () => {
    const links = [{ href: "/groups" }, { href: "/groups?create=1" }];
    expect(resolveActiveHref(links, { pathname: "/groups" })).toBe("/groups");
    expect(resolveActiveHref(links, { pathname: "/groups", search: "?create=1" })).toBe(
      "/groups?create=1"
    );
    expect(resolveActiveHref(links, { pathname: "/groups", search: "create=1&x=2" })).toBe(
      "/groups?create=1"
    );
    expect(resolveActiveHref(links, { pathname: "/groups", search: "?create=0" })).toBe("/groups");
  });

  it("picks the longest prefix so only one admin link is active", () => {
    const links = [
      { href: "/admin/achievements", match: "prefix" as const },
      { href: "/admin/achievements/players", match: "prefix" as const },
    ];
    expect(resolveActiveHref(links, { pathname: "/admin/achievements/players" })).toBe(
      "/admin/achievements/players"
    );
    expect(resolveActiveHref(links, { pathname: "/admin/achievements/42/edit" })).toBe(
      "/admin/achievements"
    );
  });

  it("does not treat a shared string start as a path prefix", () => {
    const links = [{ href: "/games", match: "prefix" as const }];
    expect(resolveActiveHref(links, { pathname: "/gamesettings" })).toBeNull();
    expect(resolveActiveHref(links, { pathname: "/games/zelda" })).toBe("/games");
  });

  it("prefers an exact match over a prefix match", () => {
    const links = [{ href: "/groups", match: "prefix" as const }, { href: "/groups/new" }];
    expect(resolveActiveHref(links, { pathname: "/groups/new" })).toBe("/groups/new");
  });
});
