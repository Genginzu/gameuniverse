import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TranslationDashboard } from "@/components/admin/translations/TranslationDashboard";
import type { UseAdminTranslationsReturn } from "@/hooks/useAdminTranslations";
import type { TranslationStats } from "@/types/admin-translations";

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

const mockSwr: UseAdminTranslationsReturn = {
  stats: [],
  items: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  isLoadingStats: false,
  isLoadingItems: false,
  error: null,
  mutateStats: vi.fn(),
  mutateItems: vi.fn(),
  translateOne: vi.fn().mockResolvedValue({ entityId: "1", translatedFields: {}, saved: true }),
  translateBatch: vi.fn().mockResolvedValue({ total: 0, succeeded: 0, failed: 0 }),
  saveTranslation: vi.fn().mockResolvedValue(undefined),
  fetchEntityDetail: vi
    .fn()
    .mockResolvedValue({ entityId: "1", identifier: "test", languages: [] }),
};

vi.mock("@/hooks/useAdminTranslations", () => ({
  useAdminTranslations: () => mockSwr,
}));

// ─── Tests ──────────────────────────────────────────────────────────

describe("TranslationDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSwr.stats = [];
    mockSwr.items = [];
    mockSwr.isLoadingStats = false;
    mockSwr.isLoadingItems = false;
  });

  it("renders the page title and description", () => {
    render(<TranslationDashboard />);
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
  });

  it("renders language selector with all locales", () => {
    render(<TranslationDashboard />);
    const langSelect = screen.getByLabelText("targetLanguage");
    expect(langSelect).toBeInTheDocument();
    expect(langSelect.querySelectorAll("option")).toHaveLength(2);
  });

  it("renders entity grid cards on initial view", () => {
    mockSwr.stats = [
      {
        entityType: "games",
        language: "en",
        total: 50,
        complete: 25,
        partial: 5,
        missing: 20,
        percentage: 50,
      },
    ] as TranslationStats[];
    render(<TranslationDashboard />);
    // Grid cards are buttons with entity type names
    expect(screen.getByText("entityTypes.games")).toBeInTheDocument();
  });

  it("renders the progress bar component", () => {
    mockSwr.stats = [
      {
        entityType: "games",
        language: "en",
        total: 100,
        complete: 60,
        partial: 10,
        missing: 30,
        percentage: 60,
      },
    ] as TranslationStats[];
    render(<TranslationDashboard />);
    expect(screen.getByText(/60 \/ 100/)).toBeInTheDocument();
  });

  it("renders stats cards component", () => {
    mockSwr.stats = [
      {
        entityType: "games",
        language: "en",
        total: 50,
        complete: 25,
        partial: 5,
        missing: 20,
        percentage: 50,
      },
    ] as TranslationStats[];
    render(<TranslationDashboard />);
    const matches = screen.getAllByText("50%");
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("does not render batch progress when no batch is running", () => {
    render(<TranslationDashboard />);
    expect(screen.queryByText("batch.processing")).not.toBeInTheDocument();
  });

  it("does not show table on initial grid view", () => {
    render(<TranslationDashboard />);
    expect(screen.queryByPlaceholderText("table.searchPlaceholder")).not.toBeInTheDocument();
  });

  it("changes target language when selector changes", () => {
    render(<TranslationDashboard />);
    const langSelect = screen.getByLabelText("targetLanguage");
    fireEvent.change(langSelect, { target: { value: "fr" } });
    expect((langSelect as HTMLSelectElement).value).toBe("fr");
  });
});
