import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ─── Mocks ──────────────────────────────────────────────────────────

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params) return `${key}(${JSON.stringify(params)})`;
    return key;
  },
}));

vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["fr", "en"], defaultLocale: "fr" },
}));

vi.mock("swr", () => ({
  default: () => ({ data: { stats: [] }, isLoading: false }),
}));

// Must mock next/link for jsdom
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// ─── Lazy import after mocks ────────────────────────────────────────

const { default: AdminTranslationsPage } = await import("@/app/[locale]/admin/translations/page");

// ─── Tests ──────────────────────────────────────────────────────────

describe("AdminTranslationsPage (grid view)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the page title and description", () => {
    render(<AdminTranslationsPage />);
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
  });

  it("renders sync button", () => {
    render(<AdminTranslationsPage />);
    expect(screen.getByText("buttons.syncStats")).toBeInTheDocument();
  });

  it("renders the progress bar", () => {
    render(<AdminTranslationsPage />);
    // Progress bar always renders (0/0 when no stats)
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
