import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock @/i18n/navigation : router.push stub + usePathname stub.
const mockPush = vi.fn();
const mockUsePathname = vi.fn<[], string>(() => "/games");
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}));

// Mock next-intl : useLocale + useTranslations.
const mockUseLocale = vi.fn<[], string>(() => "fr");
const editorialTranslations: Record<string, string> = {
  "editorial.languageSwitcher.ariaLabel": "Change language",
  "editorial.languageSwitcher.currentLanguage": "Current language: {language}",
  "editorial.languageSwitcher.listboxAriaLabel": "Available languages",
  "editorial.languages.fr": "French",
  "editorial.languages.en": "English",
};
vi.mock("next-intl", () => ({
  useLocale: () => mockUseLocale(),
  useTranslations: (namespace: string) => (key: string, params?: Record<string, string>) => {
    const fullKey = `${namespace}.${key}`;
    let value = editorialTranslations[fullKey] ?? fullKey;
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        value = value.replace(`{${paramKey}}`, paramValue);
      }
    }
    return value;
  },
}));

// Mock country-flag-icons : just stub the components to avoid SVG rendering noise.
vi.mock("country-flag-icons/react/3x2/FR", () => ({
  default: ({ className, title }: { className?: string; title?: string }) => (
    <span data-testid="flag-fr" className={className} title={title} />
  ),
}));
vi.mock("country-flag-icons/react/3x2/US", () => ({
  default: ({ className, title }: { className?: string; title?: string }) => (
    <span data-testid="flag-us" className={className} title={title} />
  ),
}));

import { HeaderLanguageSwitcher } from "@/components/layout/editorial/HeaderLanguageSwitcher";

describe("HeaderLanguageSwitcher", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockUseLocale.mockReset();
    mockUseLocale.mockReturnValue("fr");
    mockUsePathname.mockReset();
    mockUsePathname.mockReturnValue("/games");
  });

  describe("trigger", () => {
    it("renders the current locale's short code (FR)", () => {
      render(<HeaderLanguageSwitcher />);
      expect(screen.getByText("FR")).toBeDefined();
    });

    it("renders EN when current locale is en", () => {
      mockUseLocale.mockReturnValue("en");
      render(<HeaderLanguageSwitcher />);
      expect(screen.getByText("EN")).toBeDefined();
    });

    it("uses an aria-label that includes the current language name", () => {
      render(<HeaderLanguageSwitcher />);
      expect(
        screen.getByRole("button", { name: "Current language: French" })
      ).toBeDefined();
    });

    it("has aria-haspopup=listbox and aria-expanded=false initially", () => {
      render(<HeaderLanguageSwitcher />);
      const button = screen.getByTestId("header-language-trigger");
      expect(button.getAttribute("aria-haspopup")).toBe("listbox");
      expect(button.getAttribute("aria-expanded")).toBe("false");
    });

    it("does not show the listbox when closed", () => {
      render(<HeaderLanguageSwitcher />);
      expect(screen.queryByRole("listbox")).toBeNull();
    });

    it("forwards a className", () => {
      const { container } = render(<HeaderLanguageSwitcher className="my-extra" />);
      const wrapper = container.querySelector(".header-language-switcher");
      expect(wrapper?.className).toContain("header-language-switcher");
      expect(wrapper?.className).toContain("my-extra");
    });
  });

  describe("opening the listbox", () => {
    it("opens on trigger click", () => {
      render(<HeaderLanguageSwitcher />);
      fireEvent.click(screen.getByTestId("header-language-trigger"));
      expect(screen.getByRole("listbox")).toBeDefined();
    });

    it("flips aria-expanded to true once open", () => {
      render(<HeaderLanguageSwitcher />);
      const button = screen.getByTestId("header-language-trigger");
      fireEvent.click(button);
      expect(button.getAttribute("aria-expanded")).toBe("true");
    });

    it("renders one option per locale, with the current marked aria-selected", () => {
      render(<HeaderLanguageSwitcher />);
      fireEvent.click(screen.getByTestId("header-language-trigger"));

      const options = screen.getAllByRole("option");
      expect(options.length).toBe(2);

      const french = options.find((o) => o.getAttribute("data-locale") === "fr");
      const english = options.find((o) => o.getAttribute("data-locale") === "en");
      expect(french?.getAttribute("aria-selected")).toBe("true");
      expect(english?.getAttribute("aria-selected")).toBe("false");
    });

    it("opens via ArrowDown on trigger and highlights the current locale", () => {
      render(<HeaderLanguageSwitcher />);
      const button = screen.getByTestId("header-language-trigger");
      fireEvent.keyDown(button, { key: "ArrowDown" });
      const french = screen
        .getAllByRole("option")
        .find((o) => o.getAttribute("data-locale") === "fr");
      expect(french?.className).toContain("is-highlighted");
    });

    it("opens via Enter on trigger", () => {
      render(<HeaderLanguageSwitcher />);
      fireEvent.keyDown(screen.getByTestId("header-language-trigger"), { key: "Enter" });
      expect(screen.getByRole("listbox")).toBeDefined();
    });
  });

  describe("selecting a locale", () => {
    it("calls router.push with the new locale and the current pathname on click", () => {
      mockUsePathname.mockReturnValue("/games/zelda");
      render(<HeaderLanguageSwitcher />);
      fireEvent.click(screen.getByTestId("header-language-trigger"));

      const english = screen
        .getAllByRole("option")
        .find((o) => o.getAttribute("data-locale") === "en")!;
      fireEvent.click(english);

      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/games/zelda", { locale: "en" });
    });

    it("does NOT call router.push when selecting the current locale", () => {
      render(<HeaderLanguageSwitcher />);
      fireEvent.click(screen.getByTestId("header-language-trigger"));

      const french = screen
        .getAllByRole("option")
        .find((o) => o.getAttribute("data-locale") === "fr")!;
      fireEvent.click(french);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("closes the listbox after selection", () => {
      render(<HeaderLanguageSwitcher />);
      fireEvent.click(screen.getByTestId("header-language-trigger"));

      const english = screen
        .getAllByRole("option")
        .find((o) => o.getAttribute("data-locale") === "en")!;
      fireEvent.click(english);

      expect(screen.queryByRole("listbox")).toBeNull();
    });
  });

  describe("keyboard navigation in the listbox", () => {
    it("Escape closes the listbox", () => {
      render(<HeaderLanguageSwitcher />);
      fireEvent.click(screen.getByTestId("header-language-trigger"));
      const list = screen.getByRole("listbox");
      fireEvent.keyDown(list, { key: "Escape" });
      expect(screen.queryByRole("listbox")).toBeNull();
    });

    it("ArrowDown / ArrowUp cycle through options", () => {
      render(<HeaderLanguageSwitcher />);
      fireEvent.click(screen.getByTestId("header-language-trigger"));
      const list = screen.getByRole("listbox");

      // After open, French is highlighted (current locale, index 0)
      fireEvent.keyDown(list, { key: "ArrowDown" });
      let highlighted = screen.getAllByRole("option").find((o) => o.className.includes("is-highlighted"));
      expect(highlighted?.getAttribute("data-locale")).toBe("en");

      // Wrap-around to French
      fireEvent.keyDown(list, { key: "ArrowDown" });
      highlighted = screen.getAllByRole("option").find((o) => o.className.includes("is-highlighted"));
      expect(highlighted?.getAttribute("data-locale")).toBe("fr");

      fireEvent.keyDown(list, { key: "ArrowUp" });
      highlighted = screen.getAllByRole("option").find((o) => o.className.includes("is-highlighted"));
      expect(highlighted?.getAttribute("data-locale")).toBe("en");
    });

    it("Home jumps to the first option, End to the last", () => {
      render(<HeaderLanguageSwitcher />);
      fireEvent.click(screen.getByTestId("header-language-trigger"));
      const list = screen.getByRole("listbox");

      fireEvent.keyDown(list, { key: "End" });
      expect(
        screen
          .getAllByRole("option")
          .find((o) => o.className.includes("is-highlighted"))
          ?.getAttribute("data-locale")
      ).toBe("en");

      fireEvent.keyDown(list, { key: "Home" });
      expect(
        screen
          .getAllByRole("option")
          .find((o) => o.className.includes("is-highlighted"))
          ?.getAttribute("data-locale")
      ).toBe("fr");
    });

    it("Enter on highlighted option selects it", () => {
      mockUsePathname.mockReturnValue("/library");
      render(<HeaderLanguageSwitcher />);
      fireEvent.click(screen.getByTestId("header-language-trigger"));
      const list = screen.getByRole("listbox");

      fireEvent.keyDown(list, { key: "ArrowDown" });
      fireEvent.keyDown(list, { key: "Enter" });

      expect(mockPush).toHaveBeenCalledWith("/library", { locale: "en" });
    });
  });

  describe("click outside", () => {
    it("closes the listbox when clicking outside the trigger and listbox", () => {
      render(
        <div>
          <button data-testid="outside" type="button">
            Outside
          </button>
          <HeaderLanguageSwitcher />
        </div>
      );
      fireEvent.click(screen.getByTestId("header-language-trigger"));
      fireEvent.pointerDown(screen.getByTestId("outside"));
      expect(screen.queryByRole("listbox")).toBeNull();
    });

    it("does NOT close when clicking inside the listbox", () => {
      render(<HeaderLanguageSwitcher />);
      fireEvent.click(screen.getByTestId("header-language-trigger"));
      const list = screen.getByRole("listbox");
      fireEvent.pointerDown(list);
      expect(screen.queryByRole("listbox")).not.toBeNull();
    });
  });

  describe("toggle", () => {
    it("clicking the trigger again closes an open listbox", () => {
      render(<HeaderLanguageSwitcher />);
      const button = screen.getByTestId("header-language-trigger");
      fireEvent.click(button);
      expect(screen.queryByRole("listbox")).not.toBeNull();
      fireEvent.click(button);
      expect(screen.queryByRole("listbox")).toBeNull();
    });
  });
});
