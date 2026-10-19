import { describe, it, expect } from "vitest";
import { buildAffiliateUrl } from "@/lib/affiliate/buildAffiliateUrl";
import type { AffiliateStoreConfig } from "@/types/affiliate";

const RAW = "https://www.amazon.fr/dp/B0TEST?th=1";

function config(overrides: Partial<AffiliateStoreConfig> = {}): AffiliateStoreConfig {
  return {
    affiliateEnabled: true,
    affiliateNetwork: "amazon",
    affiliateTag: "gameuniverse-21",
    affiliateUrlTemplate: null,
    ...overrides,
  };
}

describe("buildAffiliateUrl", () => {
  describe("fallback", () => {
    it("returns the raw url when affiliation is disabled", () => {
      expect(buildAffiliateUrl(config({ affiliateEnabled: false }), RAW, {})).toBe(RAW);
    });

    it("returns the raw url when no tag is configured nor available in env", () => {
      expect(buildAffiliateUrl(config({ affiliateTag: null }), RAW, {})).toBe(RAW);
    });

    it("returns the raw url when the network has no default template", () => {
      const cfg = config({ affiliateNetwork: "impact", affiliateTag: "123" });
      expect(buildAffiliateUrl(cfg, RAW, {})).toBe(RAW);
    });

    it("returns the raw url when the raw url is not http(s)", () => {
      expect(buildAffiliateUrl(config(), "javascript:alert(1)", {})).toBe("javascript:alert(1)");
      expect(buildAffiliateUrl(config(), "not a url", {})).toBe("not a url");
    });

    it("returns the raw url when a wrap template has no {url} placeholder", () => {
      const cfg = config({ affiliateUrlTemplate: "https://network.example/{tag}" });
      expect(buildAffiliateUrl(cfg, RAW, {})).toBe(RAW);
    });

    it("returns the raw url when a wrap template is not https", () => {
      const cfg = config({ affiliateUrlTemplate: "http://network.example/?u={url}" });
      expect(buildAffiliateUrl(cfg, RAW, {})).toBe(RAW);
    });
  });

  describe("amazon (query mode)", () => {
    it("appends the tag with the default template and keeps existing params", () => {
      const url = new URL(buildAffiliateUrl(config(), RAW, {}));
      expect(url.hostname).toBe("www.amazon.fr");
      expect(url.searchParams.get("tag")).toBe("gameuniverse-21");
      expect(url.searchParams.get("th")).toBe("1");
    });

    it("overrides an existing tag param instead of duplicating it", () => {
      const url = new URL(
        buildAffiliateUrl(config(), "https://www.amazon.fr/dp/X?tag=other-21", {})
      );
      expect(url.searchParams.getAll("tag")).toEqual(["gameuniverse-21"]);
    });

    it("falls back to the AMAZON_ASSOCIATES_TAG env variable", () => {
      const url = new URL(
        buildAffiliateUrl(config({ affiliateTag: null }), RAW, { AMAZON_ASSOCIATES_TAG: "env-21" })
      );
      expect(url.searchParams.get("tag")).toBe("env-21");
    });

    it("prefers the store tag over the env variable", () => {
      const url = new URL(buildAffiliateUrl(config(), RAW, { AMAZON_ASSOCIATES_TAG: "env-21" }));
      expect(url.searchParams.get("tag")).toBe("gameuniverse-21");
    });
  });

  describe("custom query template", () => {
    it("supports multiple params and static values", () => {
      const cfg = config({
        affiliateNetwork: "custom",
        affiliateTag: "gu",
        affiliateUrlTemplate: "?ref={tag}&utm_source=gameuniverse",
      });
      const url = new URL(buildAffiliateUrl(cfg, "https://www.fanatical.com/en/game/x", {}));
      expect(url.searchParams.get("ref")).toBe("gu");
      expect(url.searchParams.get("utm_source")).toBe("gameuniverse");
    });

    it("works without a tag when the template has no {tag} placeholder", () => {
      const cfg = config({
        affiliateNetwork: "custom",
        affiliateTag: null,
        affiliateUrlTemplate: "?partner=gameuniverse",
      });
      const url = new URL(buildAffiliateUrl(cfg, "https://store.example.com/game", {}));
      expect(url.searchParams.get("partner")).toBe("gameuniverse");
    });
  });

  describe("impact (wrap mode)", () => {
    const template = "https://humble.pxf.io/c/{tag}/1234/5678?u={url}";

    it("wraps the encoded deep link with the store tag", () => {
      const cfg = config({
        affiliateNetwork: "impact",
        affiliateTag: "42",
        affiliateUrlTemplate: template,
      });
      const raw = "https://www.humblebundle.com/store/game?x=1&y=2";
      const result = buildAffiliateUrl(cfg, raw, {});
      const url = new URL(result);
      expect(url.hostname).toBe("humble.pxf.io");
      expect(url.pathname).toBe("/c/42/1234/5678");
      expect(url.searchParams.get("u")).toBe(raw);
    });

    it("falls back to the IMPACT_SITE_ID env variable", () => {
      const cfg = config({
        affiliateNetwork: "impact",
        affiliateTag: null,
        affiliateUrlTemplate: template,
      });
      const result = buildAffiliateUrl(cfg, "https://www.humblebundle.com/g", {
        IMPACT_SITE_ID: "99",
      });
      expect(new URL(result).pathname).toBe("/c/99/1234/5678");
    });
  });

  describe("other wrap networks", () => {
    it("awin: uses AWIN_PUBLISHER_ID and embeds the encoded url", () => {
      const cfg = config({
        affiliateNetwork: "awin",
        affiliateTag: null,
        affiliateUrlTemplate: "https://www.awin1.com/cread.php?awinmid=1&awinaffid={tag}&ued={url}",
      });
      const raw = "https://www.greenmangaming.com/games/x/";
      const url = new URL(buildAffiliateUrl(cfg, raw, { AWIN_PUBLISHER_ID: "555" }));
      expect(url.searchParams.get("awinaffid")).toBe("555");
      expect(url.searchParams.get("ued")).toBe(raw);
    });

    it("partnerize: uses PARTNERIZE_CAMREF", () => {
      const cfg = config({
        affiliateNetwork: "partnerize",
        affiliateTag: null,
        affiliateUrlTemplate: "https://prf.hn/click/camref:{tag}/destination:{url}",
      });
      const result = buildAffiliateUrl(cfg, "https://www.example.com/g", {
        PARTNERIZE_CAMREF: "abc",
      });
      expect(result).toContain("camref:abc");
      expect(result).toContain(encodeURIComponent("https://www.example.com/g"));
    });

    it("encodes a tag containing special characters", () => {
      const cfg = config({
        affiliateNetwork: "custom",
        affiliateTag: "a/b?c",
        affiliateUrlTemplate: "https://go.example.com/{tag}?to={url}",
      });
      const result = buildAffiliateUrl(cfg, "https://shop.example.com/x", {});
      expect(new URL(result).pathname).toBe(`/${encodeURIComponent("a/b?c")}`);
    });
  });
});
