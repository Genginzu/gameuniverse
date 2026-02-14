import { describe, it, expect, mock } from "bun:test";
import { renderToString } from "react-dom/server";

// Mock react-hook-form's watch to return controlled values
const createMockForm = (overrides: Record<string, unknown> = {}) => {
  const values: Record<string, unknown> = {
    background_color: "#1a1a2e",
    accent_color: "#e94560",
    label_color: "#a0a0b0",
    text_color: "#f0f0f0",
    "translations.0.title": "The Witcher 3",
    "translations.0.description": "An epic RPG adventure",
    cover_image_url: "https://example.com/cover.jpg",
    background_image_url: "",
    release_date: "2015-05-19",
    metascore: 92,
    genres: [{ genre_id: "g1" }, { genre_id: "g2" }],
    companies: [
      { company_id: "c1", role: "developer" },
      { company_id: "c2", role: "publisher" },
    ],
    prices: [],
    ...overrides,
  };

  return {
    watch: (field: string) => values[field],
    control: {},
    getValues: (field: string) => values[field],
    formState: { errors: {} },
  } as any;
};

const mockGenres = [
  { id: "g1", slug: "rpg", name: "RPG" },
  { id: "g2", slug: "action", name: "Action" },
  { id: "g3", slug: "adventure", name: "Adventure" },
];

const mockCompanies = [
  { id: "c1", name: "CD Projekt Red", slug: "cd-projekt-red" },
  { id: "c2", name: "Bandai Namco", slug: "bandai-namco" },
];

const mockStores: {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
}[] = [{ id: "s1", name: "Steam", logo_url: null, website_url: null }];

const mockT = (key: string) => key;

// Import after mocks are set up
import { GameColorPreview } from "../../../../../src/components/admin/games/GameColorPreview";

describe("GameColorPreview", () => {
  it("renders with title, cover image, and genres (Requirements 2.1, 2.2, 2.3)", () => {
    const form = createMockForm();
    const html = renderToString(
      <GameColorPreview
        form={form}
        genres={mockGenres}
        companies={mockCompanies}
        stores={mockStores}
        t={mockT}
      />
    );

    expect(html).toContain("The Witcher 3");
    expect(html).toContain("https://example.com/cover.jpg");
    expect(html).toContain("RPG");
    expect(html).toContain("Action");
  });

  it("renders placeholder content when no contextual data (Requirement 2.4)", () => {
    const form = createMockForm({
      "translations.0.title": "",
      "translations.0.description": "",
      cover_image_url: "",
      background_image_url: "",
      release_date: "",
      metascore: null,
      genres: [],
      companies: [],
    });
    const html = renderToString(
      <GameColorPreview
        form={form}
        genres={mockGenres}
        companies={mockCompanies}
        stores={mockStores}
        t={mockT}
      />
    );

    // Should have placeholder title (italic)
    expect(html).toContain("titlePlaceholder");
    // Should not contain genre badges or company names
    expect(html).not.toContain("RPG");
    expect(html).not.toContain("Action");
    expect(html).not.toContain("CD Projekt Red");
  });

  it("applies custom colors as inline styles (Requirements 1.4, 4.1)", () => {
    const form = createMockForm({
      background_color: "#2d2d44",
      accent_color: "#ff6b6b",
      label_color: "#b0b0c0",
      text_color: "#ffffff",
    });
    const html = renderToString(
      <GameColorPreview
        form={form}
        genres={mockGenres}
        companies={mockCompanies}
        stores={mockStores}
        t={mockT}
      />
    );

    // Background color applied to container
    expect(html).toContain("#2d2d44");
    // Text color applied
    expect(html).toContain("#ffffff");
    // Label color applied
    expect(html).toContain("#b0b0c0");
    // Accent color applied
    expect(html).toContain("#ff6b6b");
  });

  it("renders overview cards with correct CSS classes (Requirement 4.5)", () => {
    const form = createMockForm();
    const html = renderToString(
      <GameColorPreview
        form={form}
        genres={mockGenres}
        companies={mockCompanies}
        stores={mockStores}
        t={mockT}
      />
    );

    // Overview cards should have the same styling as GameOverviewSection
    expect(html).toContain("border-slate-700");
    expect(html).toContain("bg-slate-800/50");
  });

  it("uses default colors when fields are empty (Requirement 5.1)", () => {
    const form = createMockForm({
      background_color: "",
      accent_color: "",
      label_color: "",
      text_color: "",
    });
    const html = renderToString(
      <GameColorPreview
        form={form}
        genres={mockGenres}
        companies={mockCompanies}
        stores={mockStores}
        t={mockT}
      />
    );

    // Default colors from buildGameColors
    expect(html).toContain("#0f172a"); // default background
    expect(html).toContain("#8b5cf6"); // default accent
    expect(html).toContain("#94a3b8"); // default label
    expect(html).toContain("#e2e8f0"); // default text
  });

  it("contains gradient overlay with backgroundColor (Requirement 4.2)", () => {
    const form = createMockForm({ background_color: "#1a1a2e" });
    const html = renderToString(
      <GameColorPreview
        form={form}
        genres={mockGenres}
        companies={mockCompanies}
        stores={mockStores}
        t={mockT}
      />
    );

    // Gradient should contain the background color with opacity suffixes
    expect(html).toContain("#1a1a2e");
    expect(html).toContain("linear-gradient");
  });
});
