import { describe, it, expect } from "vitest";
import {
  genderForm,
  genreForm,
  roleForm,
  speciesForm,
} from "@/lib/admin-resource/forms/translatedForms";
import { companyForm, languageForm } from "@/lib/admin-resource/forms/catalogForms";
import {
  descriptorForm,
  ratingForm,
  ratingSystemForm,
} from "@/lib/admin-resource/forms/ageClassificationForms";
import { resolveAdminPath } from "@/lib/admin-resource/defineAdminForm";

const translations = [{ language_code: "fr", name: "Héros" }];

describe("admin form configs", () => {
  it("genre and role forms drop the immutable slug on edit", () => {
    for (const config of [genreForm, roleForm]) {
      const data = { slug: "hero", translations };
      expect(config.editKey?.(data)).toBe("hero");
      expect(config.toPayload?.(data, "create")).toEqual({ slug: "hero", translations });
      expect(config.toPayload?.(data, "edit")).toEqual({ translations });
    }
  });

  it("gender and species forms prefill one empty translation per site locale", () => {
    const empty = [
      { language_code: "fr", name: "" },
      { language_code: "en", name: "" },
    ];
    expect(genderForm.defaultValues()).toEqual({ slug: "", translations: empty });
    expect(speciesForm.defaultValues()).toEqual({ slug: "", translations: empty });
    expect(genderForm.editKey).toBeUndefined();
  });

  it("company form keys edits by slug and sends every other field", () => {
    const data = {
      ...(companyForm.defaultValues() as Record<string, unknown>),
      name: "Nintendo",
      slug: "nintendo",
    };
    expect(companyForm.editKey?.(data as never)).toBe("nintendo");
    expect(companyForm.toPayload?.(data as never, "edit")).not.toHaveProperty("slug");
    expect(companyForm.toPayload?.(data as never, "create")).toHaveProperty("slug", "nintendo");
  });

  it("language form keys edits by code and defaults the native name", () => {
    const data = { code: "ja", name: "Japanese", native_name: "" };
    expect(languageForm.editKey?.(data)).toBe("ja");
    expect(languageForm.toPayload?.(data, "create")).toEqual(data);
    expect(languageForm.toPayload?.(data, "edit")).toEqual({ name: "Japanese", native_name: "" });
  });

  it("rating system form fills optional fields", () => {
    expect(ratingSystemForm.toPayload?.({ code: "PEGI", name: "PEGI" } as never, "create")).toEqual(
      {
        code: "PEGI",
        name: "PEGI",
        description: "",
        country_codes: [],
        website_url: "",
      }
    );
  });

  it("rating and descriptor forms live under their encoded rating system", () => {
    expect(resolveAdminPath(ratingForm.path, { ratingSystemId: "pegi eu" })).toBe(
      "/api/admin/age-classifications/pegi%20eu/ratings"
    );
    expect(resolveAdminPath(descriptorForm.path, { ratingSystemId: "esrb" })).toBe(
      "/api/admin/age-classifications/esrb/descriptors"
    );
  });

  it("descriptor form defaults missing descriptions", () => {
    const payload = descriptorForm.toPayload?.(
      {
        code: "V",
        icon_url: undefined,
        translations: [{ language_code: "fr", name: "Violence" }],
      } as never,
      "create"
    );
    expect(payload).toEqual({
      code: "V",
      icon_url: "",
      translations: [{ language_code: "fr", name: "Violence", description: "" }],
    });
  });

  it("rating form fills optional visual fields", () => {
    const payload = ratingForm.toPayload?.(
      { code: "12", display_name: "PEGI 12", minimum_age: 12, sort_order: 2 } as never,
      "edit"
    );
    expect(payload).toEqual({
      code: "12",
      display_name: "PEGI 12",
      minimum_age: 12,
      color_hex: "",
      icon_url: "",
      sort_order: 2,
      translations: [],
    });
  });
});
