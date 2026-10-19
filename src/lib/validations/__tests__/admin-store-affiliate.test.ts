import { describe, it, expect } from "vitest";
import { adminStoreAffiliateSchema } from "@/lib/validations/admin-store-affiliate";

describe("adminStoreAffiliateSchema", () => {
  it("accepts a disabled store without any configuration", () => {
    const result = adminStoreAffiliateSchema.safeParse({ affiliateEnabled: false });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      affiliateEnabled: false,
      affiliateNetwork: null,
      affiliateTag: null,
      affiliateUrlTemplate: null,
    });
  });

  it("normalises empty strings to null and trims values", () => {
    const result = adminStoreAffiliateSchema.safeParse({
      affiliateEnabled: true,
      affiliateNetwork: "amazon",
      affiliateTag: "  gu-21  ",
      affiliateUrlTemplate: "",
    });
    expect(result.data).toMatchObject({ affiliateTag: "gu-21", affiliateUrlTemplate: null });
  });

  it("accepts query and https wrap templates", () => {
    for (const template of ["?tag={tag}", "https://humble.pxf.io/c/{tag}/1/2?u={url}"]) {
      const result = adminStoreAffiliateSchema.safeParse({
        affiliateEnabled: true,
        affiliateNetwork: "impact",
        affiliateUrlTemplate: template,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects unsafe or malformed templates", () => {
    for (const template of [
      "http://network.example/?u={url}",
      "https://network.example/{tag}",
      "javascript:alert(1)",
      "? spaced {tag}",
    ]) {
      const result = adminStoreAffiliateSchema.safeParse({
        affiliateEnabled: false,
        affiliateUrlTemplate: template,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("invalidTemplate");
    }
  });

  it("requires a network when enabled", () => {
    const result = adminStoreAffiliateSchema.safeParse({ affiliateEnabled: true });
    expect(result.error?.issues.map((i) => i.message)).toContain("networkRequired");
  });

  it("requires a template for non-amazon networks when enabled", () => {
    const result = adminStoreAffiliateSchema.safeParse({
      affiliateEnabled: true,
      affiliateNetwork: "awin",
      affiliateTag: "123",
    });
    expect(result.error?.issues.map((i) => i.message)).toEqual(["templateRequired"]);
  });

  it("rejects unknown networks", () => {
    const result = adminStoreAffiliateSchema.safeParse({
      affiliateEnabled: false,
      affiliateNetwork: "evil",
    });
    expect(result.success).toBe(false);
  });
});
