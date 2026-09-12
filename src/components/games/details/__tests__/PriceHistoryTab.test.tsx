import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PriceHistoryTab } from "@/components/games/details/PriceHistoryTab";
import type { UsePriceHistoryReturn } from "@/hooks/usePriceHistory";
import type { PriceSnapshot, PriceHistoryStats } from "@/types/price-history";

// Mock child components to isolate orchestrator logic
vi.mock("@/components/games/details/PriceHistoryFilters", () => ({
  PriceHistoryFiltersBar: ({ availableStores }: { availableStores: string[] }) => (
    <div data-testid="filters-bar">stores: {availableStores.join(",")}</div>
  ),
}));

vi.mock("@/components/games/details/PriceHistoryStats", () => ({
  PriceHistoryStatsDisplay: ({ stats }: { stats: PriceHistoryStats }) => (
    <div data-testid="stats-display">min: {stats.min_price}</div>
  ),
}));

vi.mock("@/components/games/details/PriceHistoryChart", () => ({
  PriceHistoryChart: ({ storeNames }: { storeNames: string[] }) => (
    <div data-testid="chart">chart: {storeNames.join(",")}</div>
  ),
}));

const mockRefetch = vi.fn();

const defaultHookReturn: UsePriceHistoryReturn = {
  history: [],
  stats: null,
  isLoading: false,
  error: null,
  refetch: mockRefetch,
};

let hookReturn = { ...defaultHookReturn };

vi.mock("@/hooks/usePriceHistory", () => ({
  usePriceHistory: () => hookReturn,
}));

const sampleSnapshots: PriceSnapshot[] = [
  {
    id: "s1",
    game_id: "g1",
    store_id: "st1",
    store_name: "Steam",
    store_logo_url: null,
    price: 29.99,
    currency: "EUR",
    platform: "PC",
    recorded_at: "2024-01-15T00:00:00Z",
  },
  {
    id: "s2",
    game_id: "g1",
    store_id: "st2",
    store_name: "Epic",
    store_logo_url: null,
    price: 34.99,
    currency: "EUR",
    platform: "PC",
    recorded_at: "2024-02-15T00:00:00Z",
  },
];

const sampleStats: PriceHistoryStats = {
  min_price: 29.99,
  max_price: 34.99,
  avg_price: 32.49,
  currency: "EUR",
  total_snapshots: 2,
};

describe("PriceHistoryTab", () => {
  beforeEach(() => {
    hookReturn = { ...defaultHookReturn };
    mockRefetch.mockClear();
  });

  it("should show skeleton loader while loading", () => {
    hookReturn = { ...defaultHookReturn, isLoading: true };
    const { container } = render(<PriceHistoryTab gameSlug="test-game" />);

    // Skeleton elements should be present (animate-pulse class)
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);

    // Child components should NOT be rendered
    expect(screen.queryByTestId("filters-bar")).toBeNull();
    expect(screen.queryByTestId("stats-display")).toBeNull();
    expect(screen.queryByTestId("chart")).toBeNull();
  });

  it("should show error state with retry button on error", () => {
    hookReturn = { ...defaultHookReturn, error: "Network error" };
    render(<PriceHistoryTab gameSlug="test-game" />);

    expect(screen.getByText(/impossible de charger/i)).toBeDefined();
    const retryButton = screen.getByText("Réessayer");
    expect(retryButton).toBeDefined();

    fireEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("should show empty state when no history available", () => {
    hookReturn = { ...defaultHookReturn, history: [] };
    render(<PriceHistoryTab gameSlug="test-game" />);

    expect(screen.getByText(/aucun historique/i)).toBeDefined();
    expect(screen.queryByTestId("filters-bar")).toBeNull();
  });

  it("should render filters, stats and chart when data is available", () => {
    hookReturn = {
      ...defaultHookReturn,
      history: sampleSnapshots,
      stats: sampleStats,
    };
    render(<PriceHistoryTab gameSlug="test-game" currentPrice={29.99} />);

    expect(screen.getByTestId("filters-bar")).toBeDefined();
    expect(screen.getByTestId("stats-display")).toBeDefined();
    expect(screen.getByTestId("chart")).toBeDefined();
  });

  it("should extract unique store names from history", () => {
    hookReturn = {
      ...defaultHookReturn,
      history: sampleSnapshots,
      stats: sampleStats,
    };
    render(<PriceHistoryTab gameSlug="test-game" />);

    // Filters bar receives the unique store names
    expect(screen.getByText("stores: Steam,Epic")).toBeDefined();
    // Chart also receives them
    expect(screen.getByText("chart: Steam,Epic")).toBeDefined();
  });

  it("should render chart without stats when stats is null", () => {
    hookReturn = {
      ...defaultHookReturn,
      history: sampleSnapshots,
      stats: null,
    };
    render(<PriceHistoryTab gameSlug="test-game" />);

    expect(screen.getByTestId("filters-bar")).toBeDefined();
    expect(screen.queryByTestId("stats-display")).toBeNull();
    expect(screen.getByTestId("chart")).toBeDefined();
  });
});
