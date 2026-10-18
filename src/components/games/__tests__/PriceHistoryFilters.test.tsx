import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PriceHistoryFiltersBar } from "../details/PriceHistoryFilters";
import type { PriceHistoryFilters } from "@/types/price-history";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

const STORES = ["Steam", "GOG"];

function renderBar(filters: PriceHistoryFilters, availableStores = STORES) {
  const onFiltersChange = vi.fn();
  render(
    <PriceHistoryFiltersBar
      filters={filters}
      onFiltersChange={onFiltersChange}
      availableStores={availableStores}
    />
  );
  return onFiltersChange;
}

describe("PriceHistoryFiltersBar", () => {
  it("marks the active period as pressed", () => {
    renderBar({ period: "3m" });
    expect(screen.getByRole("button", { name: "periods.3m" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "periods.1m" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("changes the period while keeping the store filter", () => {
    const onChange = renderBar({ period: "1m", store: "Steam" });
    fireEvent.click(screen.getByRole("button", { name: "periods.all" }));
    expect(onChange).toHaveBeenCalledWith({ period: "all", store: "Steam" });
  });

  it("selects a store, keeping the period", () => {
    const onChange = renderBar({ period: "6m" });
    fireEvent.click(screen.getByRole("button", { name: "GOG" }));
    expect(onChange).toHaveBeenCalledWith({ period: "6m", store: "GOG" });
  });

  it("toggles the active store off", () => {
    const onChange = renderBar({ period: "6m", store: "GOG" });
    expect(screen.getByRole("button", { name: "GOG" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "GOG" }));
    expect(onChange).toHaveBeenCalledWith({ period: "6m", store: undefined });
  });

  it("hides the store group when no store is available", () => {
    renderBar({ period: "1y" }, []);
    expect(screen.queryByRole("group", { name: "storeFilterLabel" })).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "periodSelectionLabel" })).toBeInTheDocument();
  });
});
