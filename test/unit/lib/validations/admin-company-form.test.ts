import { describe, it, expect } from "bun:test";
import {
  adminCompanyFormSchema,
  companyQuerySchema,
  type CompanyFormData,
} from "../../../../src/lib/validations/admin-company-form";

const validForm: CompanyFormData = {
  name: "CD Projekt Red",
  slug: "cd-projekt-red",
  company_type: "developer",
};

describe("adminCompanyFormSchema", () => {
  describe("slug field", () => {
    it("accepts a valid slug", () => {
      expect(adminCompanyFormSchema.safeParse(validForm).success).toBe(true);
    });

    it("rejects slug with special characters (underscore)", () => {
      const result = adminCompanyFormSchema.safeParse({ ...validForm, slug: "cd_projekt" });
      expect(result.success).toBe(false);
    });

    it("rejects slug with spaces", () => {
      const result = adminCompanyFormSchema.safeParse({ ...validForm, slug: "cd projekt" });
      expect(result.success).toBe(false);
    });

    it("rejects slug starting with a number", () => {
      const result = adminCompanyFormSchema.safeParse({ ...validForm, slug: "2k-games" });
      expect(result.success).toBe(false);
    });

    it("rejects slug ending with a hyphen", () => {
      const result = adminCompanyFormSchema.safeParse({ ...validForm, slug: "ubisoft-" });
      expect(result.success).toBe(false);
    });

    it("rejects empty slug", () => {
      const result = adminCompanyFormSchema.safeParse({ ...validForm, slug: "" });
      expect(result.success).toBe(false);
    });

    it("accepts 2-character slug", () => {
      const result = adminCompanyFormSchema.safeParse({ ...validForm, slug: "ea" });
      expect(result.success).toBe(true);
    });

    it("accepts 100-character slug", () => {
      const slug = "a" + "b".repeat(98) + "c";
      const result = adminCompanyFormSchema.safeParse({ ...validForm, slug });
      expect(result.success).toBe(true);
    });

    it("rejects slug longer than 100 characters", () => {
      const slug = "a" + "b".repeat(100);
      const result = adminCompanyFormSchema.safeParse({ ...validForm, slug });
      expect(result.success).toBe(false);
    });
  });

  describe("name field", () => {
    it("rejects empty name", () => {
      const result = adminCompanyFormSchema.safeParse({ ...validForm, name: "" });
      expect(result.success).toBe(false);
    });

    it("accepts name of 255 characters", () => {
      const result = adminCompanyFormSchema.safeParse({ ...validForm, name: "a".repeat(255) });
      expect(result.success).toBe(true);
    });

    it("rejects name longer than 255 characters", () => {
      const result = adminCompanyFormSchema.safeParse({ ...validForm, name: "a".repeat(256) });
      expect(result.success).toBe(false);
    });
  });

  describe("company_type field", () => {
    it("accepts developer", () => {
      expect(
        adminCompanyFormSchema.safeParse({ ...validForm, company_type: "developer" }).success
      ).toBe(true);
    });

    it("accepts publisher", () => {
      expect(
        adminCompanyFormSchema.safeParse({ ...validForm, company_type: "publisher" }).success
      ).toBe(true);
    });

    it("accepts both", () => {
      expect(adminCompanyFormSchema.safeParse({ ...validForm, company_type: "both" }).success).toBe(
        true
      );
    });

    it("rejects unknown type", () => {
      expect(
        adminCompanyFormSchema.safeParse({ ...validForm, company_type: "studio" }).success
      ).toBe(false);
    });
  });

  describe("website_url field", () => {
    it("accepts a valid URL", () => {
      const result = adminCompanyFormSchema.safeParse({
        ...validForm,
        website_url: "https://cdprojektred.com",
      });
      expect(result.success).toBe(true);
    });

    it("rejects an invalid URL", () => {
      const result = adminCompanyFormSchema.safeParse({ ...validForm, website_url: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("accepts empty string (optional)", () => {
      const result = adminCompanyFormSchema.safeParse({ ...validForm, website_url: "" });
      expect(result.success).toBe(true);
    });

    it("accepts undefined (optional)", () => {
      const result = adminCompanyFormSchema.safeParse({ ...validForm, website_url: undefined });
      expect(result.success).toBe(true);
    });
  });

  describe("founded_year field", () => {
    it("accepts 1800", () => {
      expect(adminCompanyFormSchema.safeParse({ ...validForm, founded_year: 1800 }).success).toBe(
        true
      );
    });

    it("accepts current year", () => {
      expect(
        adminCompanyFormSchema.safeParse({ ...validForm, founded_year: new Date().getFullYear() })
          .success
      ).toBe(true);
    });

    it("rejects 1799", () => {
      expect(adminCompanyFormSchema.safeParse({ ...validForm, founded_year: 1799 }).success).toBe(
        false
      );
    });

    it("rejects next year", () => {
      expect(
        adminCompanyFormSchema.safeParse({
          ...validForm,
          founded_year: new Date().getFullYear() + 1,
        }).success
      ).toBe(false);
    });

    it("accepts empty string (optional)", () => {
      expect(adminCompanyFormSchema.safeParse({ ...validForm, founded_year: "" }).success).toBe(
        true
      );
    });
  });

  describe("headquarters field", () => {
    it("accepts 255 characters", () => {
      expect(
        adminCompanyFormSchema.safeParse({ ...validForm, headquarters: "a".repeat(255) }).success
      ).toBe(true);
    });

    it("rejects more than 255 characters", () => {
      expect(
        adminCompanyFormSchema.safeParse({ ...validForm, headquarters: "a".repeat(256) }).success
      ).toBe(false);
    });
  });

  describe("error messages", () => {
    it("returns descriptive error for short slug", () => {
      const result = adminCompanyFormSchema.safeParse({ ...validForm, slug: "a" });
      expect(result.success).toBe(false);
      if (!result.success) {
        const slugErrors = result.error.issues.filter((i) => i.path[0] === "slug");
        expect(slugErrors.some((e) => e.message.includes("2 caractères"))).toBe(true);
      }
    });

    it("returns descriptive error for invalid URL", () => {
      const result = adminCompanyFormSchema.safeParse({ ...validForm, website_url: "bad" });
      expect(result.success).toBe(false);
      if (!result.success) {
        const urlErrors = result.error.issues.filter((i) => i.path[0] === "website_url");
        expect(urlErrors.some((e) => e.message.includes("URL invalide"))).toBe(true);
      }
    });
  });
});

describe("companyQuerySchema", () => {
  it("accepts valid query params", () => {
    const result = companyQuerySchema.safeParse({
      page: 1,
      limit: 20,
      search: "ubisoft",
      sort_by: "name",
      sort_order: "asc",
    });
    expect(result.success).toBe(true);
  });

  it("applies defaults for missing params", () => {
    const result = companyQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sort_by).toBe("name");
      expect(result.data.sort_order).toBe("asc");
    }
  });

  it("coerces string numbers", () => {
    const result = companyQuerySchema.safeParse({ page: "3", limit: "50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it("rejects page less than 1", () => {
    expect(companyQuerySchema.safeParse({ page: 0 }).success).toBe(false);
  });

  it("rejects limit greater than 100", () => {
    expect(companyQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });

  it("rejects invalid sort_by", () => {
    expect(companyQuerySchema.safeParse({ sort_by: "invalid" }).success).toBe(false);
  });

  it("rejects invalid sort_order", () => {
    expect(companyQuerySchema.safeParse({ sort_order: "random" }).success).toBe(false);
  });
});
