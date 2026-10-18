import { describe, it, expect } from "vitest";
import frMessages from "../../../src/messages/fr.json";
import enMessages from "../../../src/messages/en.json";

describe("Internationalization", () => {
  it("should have French translations", () => {
    expect(frMessages.navigation.home).toBe("Accueil");
    expect(frMessages.navigation.library).toBe("Bibliothèque");
    expect(frMessages.landing.hero.titlePart1).toBe("Votre");
    expect(frMessages.landing.hero.titlePart2).toBe("univers");
  });

  it("should have English translations", () => {
    expect(enMessages.navigation.home).toBe("Home");
    expect(enMessages.navigation.library).toBe("Library");
    expect(enMessages.landing.hero.titlePart1).toBe("Your");
  });

  it("should have consistent top-level and navigation keys between languages", () => {
    expect(Object.keys(frMessages).sort()).toEqual(Object.keys(enMessages).sort());
    expect(Object.keys(frMessages.navigation).sort()).toEqual(
      Object.keys(enMessages.navigation).sort()
    );
  });
});
