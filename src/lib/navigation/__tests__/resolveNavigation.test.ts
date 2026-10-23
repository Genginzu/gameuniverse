import { describe, it, expect } from "vitest";

import { resolveNavigation } from "@/lib/navigation";
import type { NavigationInput, NavigationModel, NavLink } from "@/types/navigation";

const translate = (key: string) => `t:${key}`;

function resolve(input: Partial<NavigationInput>): NavigationModel {
  return resolveNavigation({ pathname: "/", isAuthenticated: false, ...input }, translate);
}

function allLinks(model: NavigationModel): NavLink[] {
  return [
    ...model.publicEntries.flatMap((entry) => entry.sections.flatMap((s) => s.links)),
    ...model.spaces.flatMap((space) => [...space.links, ...(space.membership?.links ?? [])]),
    ...model.account,
  ];
}

const groups = {
  isLoading: false,
  items: [{ id: "g1", name: "Speedrunners", slug: "speedrunners", imageUrl: null }],
};
const communities = {
  isLoading: false,
  items: [{ id: "c1", name: "Retro", slug: "retro", imageUrl: "https://img/retro.png" }],
};

describe("resolveNavigation: active space and entry", () => {
  it("derives the active space from the pathname", () => {
    expect(resolve({ pathname: "/collections/my-list" }).activeSpaceKey).toBe("library");
    expect(resolve({ pathname: "/esport/predictions" }).activeSpaceKey).toBe("esport");
    expect(resolve({ pathname: "/posts/tags/gaming" }).activeSpaceKey).toBe("social");
    expect(resolve({ pathname: "/friends" }).activeSpaceKey).toBe("account");
    expect(resolve({ pathname: "/groups/speedrunners" }).activeSpaceKey).toBe("groups");
  });

  it("derives the active public entry from the pathname", () => {
    expect(resolve({ pathname: "/games/zelda" }).activeEntryKey).toBe("games");
    expect(resolve({ pathname: "/trending" }).activeEntryKey).toBe("games");
    expect(resolve({ pathname: "/esport/teams" }).activeEntryKey).toBe("esport");
    expect(resolve({ pathname: "/esport/predictions" }).activeEntryKey).toBeNull();
  });

  it("has neither active space nor entry outside their territories", () => {
    for (const pathname of ["/", "/auth", "/admin/games", "/librarything", "/gamesettings"]) {
      const model = resolve({ pathname });
      expect(model.activeSpaceKey).toBeNull();
      expect(model.activeEntryKey).toBeNull();
    }
  });

  it("flags the active space and entry on the resolved items", () => {
    const model = resolve({ pathname: "/coaching/sessions" });
    expect(model.spaces.filter((s) => s.isActive).map((s) => s.key)).toEqual(["coaching"]);
    expect(model.publicEntries.some((e) => e.isActive)).toBe(false);
  });
});

describe("resolveNavigation: active link", () => {
  it("marks exactly one href active", () => {
    const model = resolve({ pathname: "/collections", isAuthenticated: true });
    const active = allLinks(model).filter((l) => l.isActive);
    expect(active.map((l) => l.href)).toEqual(["/collections"]);
    expect(model.activeHref).toBe("/collections");
  });

  it("activates the create link only when its query is present", () => {
    const plain = resolve({ pathname: "/groups" });
    const create = resolve({ pathname: "/groups", search: "?create=1" });
    expect(plain.activeHref).toBe("/groups");
    expect(create.activeHref).toBe("/groups?create=1");
    const groupsSpace = create.spaces.find((s) => s.key === "groups")!;
    expect(groupsSpace.links.map((l) => [l.href, l.isActive])).toEqual([
      ["/groups", false],
      ["/groups?create=1", true],
    ]);
  });

  it("marks every rendering of the shared library link active", () => {
    const model = resolve({ pathname: "/library", isAuthenticated: true });
    const library = allLinks(model).filter((l) => l.href === "/library");
    expect(library).toHaveLength(2);
    expect(library.every((l) => l.isActive)).toBe(true);
  });

  it("keeps the library home inactive on its sub-pages", () => {
    const model = resolve({ pathname: "/library/backlog", isAuthenticated: true });
    expect(model.activeHref).toBe("/library/backlog");
  });

  it("activates a membership link on its pages and descendants", () => {
    const model = resolve({
      pathname: "/groups/speedrunners/members",
      isAuthenticated: true,
      memberships: { groups },
    });
    expect(model.activeHref).toBe("/groups/speedrunners");
  });

  it("has no active link on unrelated pages", () => {
    const model = resolve({ pathname: "/somewhere/else", isAuthenticated: true });
    expect(model.activeHref).toBeNull();
    expect(allLinks(model).some((l) => l.isActive)).toBe(false);
  });
});

describe("resolveNavigation: visibility by auth", () => {
  it("exposes all public entries and spaces to anonymous visitors", () => {
    const model = resolve({ isAuthenticated: false });
    expect(model.publicEntries.map((e) => e.key)).toEqual([
      "games",
      "characters",
      "players",
      "esport",
    ]);
    expect(model.spaces.map((s) => s.key)).toEqual([
      "social",
      "groups",
      "communities",
      "library",
      "esport",
      "coaching",
      "account",
    ]);
  });

  it("hides account links and memberships from anonymous visitors", () => {
    const model = resolve({ isAuthenticated: false, memberships: { groups, communities } });
    expect(model.account).toEqual([]);
    expect(model.spaces.every((s) => s.membership === null)).toBe(true);
  });

  it("gives signed-in members their account links", () => {
    const model = resolve({ isAuthenticated: true });
    expect(model.account.map((l) => [l.key, l.href])).toEqual([
      ["profile", "/profile"],
      ["library", "/library"],
      ["settings", "/settings"],
    ]);
  });

  it("lists membership links under the groups and communities spaces", () => {
    const model = resolve({ isAuthenticated: true, memberships: { groups, communities } });
    const groupsSpace = model.spaces.find((s) => s.key === "groups")!;
    const communitiesSpace = model.spaces.find((s) => s.key === "communities")!;
    expect(groupsSpace.membership).toEqual({
      isLoading: false,
      links: [
        {
          key: "speedrunners",
          href: "/groups/speedrunners",
          label: "Speedrunners",
          icon: "lucide:users",
          imageUrl: null,
          isActive: false,
        },
      ],
    });
    expect(communitiesSpace.membership?.links[0]).toMatchObject({
      href: "/communities/retro",
      imageUrl: "https://img/retro.png",
    });
  });

  it("reports loading memberships and hides empty ones", () => {
    const model = resolve({
      isAuthenticated: true,
      memberships: {
        groups: { isLoading: true, items: [] },
        communities: { isLoading: false, items: [] },
      },
    });
    expect(model.spaces.find((s) => s.key === "groups")!.membership).toEqual({
      isLoading: true,
      links: [],
    });
    expect(model.spaces.find((s) => s.key === "communities")!.membership).toBeNull();
  });
});

describe("resolveNavigation: labels and badges", () => {
  it("resolves every label through the translator", () => {
    const model = resolve({ isAuthenticated: true });
    const games = model.publicEntries[0];
    expect(games.label).toBe("t:megaMenu.entries.games");
    expect(games.sections[0].title).toBe("t:megaMenu.sections.games.explore");
    expect(games.sections[0].links[1].label).toBe("t:megaMenu.links.games.trending");
    const library = model.spaces.find((s) => s.key === "library")!;
    expect(library.label).toBe("t:spaces.library");
    expect(library.links[0].label).toBe("t:links.library.myLibrary");
    expect(model.account[0].label).toBe("t:links.account.profile");
  });

  it("attaches live-count badges to notifications and friends", () => {
    const account = resolve({}).spaces.find((s) => s.key === "account")!;
    const badges = Object.fromEntries(account.links.map((l) => [l.href, l.badge]));
    expect(badges["/notifications"]).toBe("unreadNotifications");
    expect(badges["/friends"]).toBe("pendingFriends");
    expect(badges["/coins"]).toBeUndefined();
  });
});
