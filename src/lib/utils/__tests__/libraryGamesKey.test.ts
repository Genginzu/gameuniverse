import { describe, it, expect } from "vitest";
import { buildLibraryGamesKey } from "../libraryGamesKey";

function paramsOf(key: string) {
  const [path, query] = key.split("?");
  return { path, params: new URLSearchParams(query) };
}

describe("buildLibraryGamesKey", () => {
  it("targets /api/games with locale, page, page size and the library flag", () => {
    const { path, params } = paramsOf(buildLibraryGamesKey("fr", 1, "", [], []));
    expect(path).toBe("/api/games");
    expect(Object.fromEntries(params)).toEqual({
      locale: "fr",
      page: "1",
      limit: "20",
      inLibrary: "true",
    });
  });

  it("passes the requested page and locale", () => {
    const { params } = paramsOf(buildLibraryGamesKey("en", 3, "", [], []));
    expect(params.get("locale")).toBe("en");
    expect(params.get("page")).toBe("3");
  });

  it("trims the search term", () => {
    const { params } = paramsOf(buildLibraryGamesKey("fr", 1, "  zelda  ", [], []));
    expect(params.get("search")).toBe("zelda");
  });

  it.each(["", "   "])("omits the search term when it is %j", (search) => {
    const { params } = paramsOf(buildLibraryGamesKey("fr", 1, search, [], []));
    expect(params.has("search")).toBe(false);
  });

  it("joins genre and publisher filters with commas", () => {
    const { params } = paramsOf(buildLibraryGamesKey("fr", 1, "", ["action", "rpg"], ["nintendo"]));
    expect(params.get("genres")).toBe("action,rpg");
    expect(params.get("publishers")).toBe("nintendo");
  });

  it("omits empty filters", () => {
    const { params } = paramsOf(buildLibraryGamesKey("fr", 1, "", [], []));
    expect(params.has("genres")).toBe(false);
    expect(params.has("publishers")).toBe(false);
  });

  it("encodes special characters in the search term", () => {
    const key = buildLibraryGamesKey("fr", 1, "zelda & link", [], []);
    expect(key).toContain("search=zelda+%26+link");
    expect(paramsOf(key).params.get("search")).toBe("zelda & link");
  });
});
