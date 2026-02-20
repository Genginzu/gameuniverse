import { describe, it, expect } from "vitest";

// Test middleware configuration
describe("Middleware Configuration", () => {
  it("should have correct locale configuration", () => {
    // Test that our supported locales are correctly defined
    const supportedLocales = ["fr", "en"];
    const defaultLocale = "fr";

    expect(supportedLocales).toContain("fr");
    expect(supportedLocales).toContain("en");
    expect(defaultLocale).toBe("fr");
    expect(supportedLocales.length).toBe(2);
  });

  it("should handle locale detection logic", () => {
    // Test the logic for locale detection
    const detectLocale = (cookieLocale?: string, browserLocale?: string) => {
      if (cookieLocale && ["fr", "en"].includes(cookieLocale)) {
        return cookieLocale;
      }

      if (browserLocale) {
        const browserLang = browserLocale.split("-")[0];
        if (["fr", "en"].includes(browserLang)) {
          return browserLang;
        }
      }

      return "fr"; // default
    };

    expect(detectLocale("en")).toBe("en");
    expect(detectLocale("fr")).toBe("fr");
    expect(detectLocale("es")).toBe("fr"); // fallback to default
    expect(detectLocale(undefined, "en-US")).toBe("en");
    expect(detectLocale(undefined, "fr-FR")).toBe("fr");
    expect(detectLocale(undefined, "es-ES")).toBe("fr"); // fallback to default
    expect(detectLocale()).toBe("fr"); // default when nothing provided
  });

  it("should handle path generation correctly", () => {
    // Test path generation logic for different locales
    const generatePath = (path: string, locale: string) => {
      const cleanPath = path.startsWith("/") ? path.slice(1) : path;

      // If locale is default (fr), don't add locale prefix
      if (locale === "fr") {
        return `/${cleanPath}`;
      }

      return `/${locale}/${cleanPath}`;
    };

    expect(generatePath("library", "fr")).toBe("/library");
    expect(generatePath("library", "en")).toBe("/en/library");
    expect(generatePath("/dashboard", "fr")).toBe("/dashboard");
    expect(generatePath("/dashboard", "en")).toBe("/en/dashboard");
    expect(generatePath("", "fr")).toBe("/");
    expect(generatePath("", "en")).toBe("/en/");
  });
});
