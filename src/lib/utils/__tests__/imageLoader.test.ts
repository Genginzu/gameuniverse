import { describe, it, expect } from "vitest";
import { getImageStrategy, igdbImageLoader, unsplashImageLoader } from "@/lib/utils/imageLoader";

const IGDB = "https://images.igdb.com/igdb/image/upload";

describe("getImageStrategy", () => {
  it("routes IGDB urls, including protocol-relative ones, to the igdb loader", () => {
    expect(getImageStrategy(`${IGDB}/t_cover_big/co1.jpg`)).toBe("igdb");
    expect(getImageStrategy(`//images.igdb.com/igdb/image/upload/t_thumb/co1.jpg`)).toBe("igdb");
  });

  it("serves IGDB urls without a size preset as-is", () => {
    expect(getImageStrategy("https://images.igdb.com/cover1.jpg")).toBe("passthrough");
  });

  it("routes Unsplash to its own CDN loader", () => {
    expect(getImageStrategy("https://images.unsplash.com/photo-1?ixid=a")).toBe("unsplash");
  });

  it("serves pre-sized CDNs as-is", () => {
    expect(getImageStrategy("https://i.ytimg.com/vi/abc/hqdefault.jpg")).toBe("passthrough");
    expect(getImageStrategy("https://avatars.steamstatic.com/a_full.jpg")).toBe("passthrough");
    expect(getImageStrategy("https://cdn.discordapp.com/avatars/1/a.png")).toBe("passthrough");
  });

  it("keeps the Vercel optimizer for local assets, uploads and unknown hosts", () => {
    expect(getImageStrategy("/assets/no-cover.png")).toBe("optimize");
    expect(getImageStrategy("https://abc.supabase.co/storage/v1/object/public/avatars/a.png")).toBe(
      "optimize"
    );
    expect(getImageStrategy("https://upload.wikimedia.org/a.png")).toBe("optimize");
    expect(getImageStrategy({ src: "/static.png", width: 1, height: 1 })).toBe("optimize");
    expect(getImageStrategy("not a url")).toBe("optimize");
  });
});

describe("igdbImageLoader", () => {
  const cover = `${IGDB}/t_cover_big/co1.jpg`;

  it.each([
    [64, "cover_small", 90],
    [128, "cover_small_2x", 180],
    [256, "cover_big", 264],
    [384, "cover_big_2x", 528],
    [640, "1080p", 810],
    [3840, "1080p", 810],
  ])("picks the smallest cover preset covering %ipx", (width, preset, presetWidth) => {
    expect(igdbImageLoader({ src: cover, width })).toBe(
      `${IGDB}/t_${preset}/co1.jpg?w=${presetWidth}`
    );
  });

  it("never returns the source unchanged, so Next.js sees a width-aware loader", () => {
    const stored = `${IGDB}/t_cover_big_2x/co1.jpg`;
    expect(igdbImageLoader({ src: stored, width: 400 })).not.toBe(stored);
  });

  it("returns one url per preset, whatever the requested width inside it", () => {
    expect(igdbImageLoader({ src: cover, width: 384 })).toBe(
      igdbImageLoader({ src: cover, width: 400 })
    );
  });

  it("keeps the 16:9 media family for screenshots and artworks", () => {
    const art = `${IGDB}/t_1080p/ar1.jpg`;
    expect(igdbImageLoader({ src: art, width: 384 })).toBe(
      `${IGDB}/t_screenshot_med/ar1.jpg?w=569`
    );
    expect(igdbImageLoader({ src: art, width: 828 })).toBe(
      `${IGDB}/t_screenshot_big/ar1.jpg?w=889`
    );
    expect(igdbImageLoader({ src: art, width: 1200 })).toBe(`${IGDB}/t_720p/ar1.jpg?w=1280`);
    expect(igdbImageLoader({ src: art, width: 1920 })).toBe(`${IGDB}/t_1080p/ar1.jpg?w=1920`);
  });

  it("handles retina source presets, logos and thumbs", () => {
    expect(igdbImageLoader({ src: `${IGDB}/t_cover_big_2x/co1.jpg`, width: 96 })).toBe(
      `${IGDB}/t_cover_small_2x/co1.jpg?w=180`
    );
    expect(igdbImageLoader({ src: `${IGDB}/t_logo_med/l1.png`, width: 750 })).toBe(
      `${IGDB}/t_logo_med_2x/l1.png?w=568`
    );
    expect(igdbImageLoader({ src: `${IGDB}/t_thumb/c1.jpg`, width: 48 })).toBe(
      `${IGDB}/t_micro_2x/c1.jpg?w=70`
    );
  });

  it("upgrades protocol-relative urls", () => {
    expect(
      igdbImageLoader({ src: `//images.igdb.com/igdb/image/upload/t_thumb/a.jpg`, width: 16 })
    ).toBe(`${IGDB}/t_micro/a.jpg?w=35`);
  });
});

describe("unsplashImageLoader", () => {
  it("sets width, quality and format while keeping existing params", () => {
    const url = new URL(
      unsplashImageLoader({ src: "https://images.unsplash.com/photo-1?ixid=a", width: 640 })
    );
    expect(url.searchParams.get("ixid")).toBe("a");
    expect(url.searchParams.get("w")).toBe("640");
    expect(url.searchParams.get("q")).toBe("75");
    expect(url.searchParams.get("auto")).toBe("format");
  });
});
