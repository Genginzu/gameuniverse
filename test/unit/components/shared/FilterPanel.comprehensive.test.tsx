import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  FilterPanel,
  hasActiveFilters,
  countActiveFilters,
  toggleFilterValue,
  type FilterConfig,
} from "@/components/shared/FilterPanel";

const sampleFilters: FilterConfig[] = [
  {
    id: "genres",
    label: "Genres",
    type: "checkbox",
    options: [
      { id: "action", label: "Action", count: 42 },
      { id: "rpg", label: "RPG", count: 28 },
      { id: "adventure", label: "Adventure", count: 15 },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    type: "radio",
    options: [
      { id: "pc", label: "PC", count: 100 },
      { id: "ps5", label: "PS5", count: 50 },
      { id: "xbox", label: "Xbox", count: 45 },
    ],
  },
];

const collapsibleFilters: FilterConfig[] = [
  {
    id: "genres",
    label: "Genres",
    type: "checkbox",
    collapsible: true,
    defaultExpanded: true,
    options: [
      { id: "action", label: "Action" },
      { id: "rpg", label: "RPG" },
    ],
  },
];

describe("FilterPanel Component", () => {
  describe("rendering", () => {
    it("renders nothing when no active filters and showPanel is false", () => {
      const { container } = render(
        <FilterPanel
          filters={sampleFilters}
          activeFilters={{}}
          onFilterChange={vi.fn()}
          onClearAll={vi.fn()}
          showPanel={false}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders filter sections when showPanel is true", () => {
      render(
        <FilterPanel
          filters={sampleFilters}
          activeFilters={{}}
          onFilterChange={vi.fn()}
          onClearAll={vi.fn()}
          showPanel={true}
        />
      );
      expect(screen.getByText("Genres")).toBeDefined();
      expect(screen.getByText("Platform")).toBeDefined();
    });

    it("shows option counts when provided", () => {
      render(
        <FilterPanel
          filters={sampleFilters}
          activeFilters={{}}
          onFilterChange={vi.fn()}
          onClearAll={vi.fn()}
          showPanel={true}
        />
      );
      expect(screen.getByText("42")).toBeDefined();
      expect(screen.getByText("28")).toBeDefined();
    });
  });

  describe("filter selection", () => {
    it("calls onFilterChange when checkbox option is clicked", () => {
      const onFilterChange = vi.fn();
      render(
        <FilterPanel
          filters={sampleFilters}
          activeFilters={{}}
          onFilterChange={onFilterChange}
          onClearAll={vi.fn()}
          showPanel={true}
        />
      );
      fireEvent.click(screen.getByText("Action"));
      expect(onFilterChange).toHaveBeenCalledWith("genres", ["action"]);
    });

    it("calls onFilterChange with single value for radio option", () => {
      const onFilterChange = vi.fn();
      render(
        <FilterPanel
          filters={sampleFilters}
          activeFilters={{}}
          onFilterChange={onFilterChange}
          onClearAll={vi.fn()}
          showPanel={true}
        />
      );
      fireEvent.click(screen.getByText("PC"));
      expect(onFilterChange).toHaveBeenCalledWith("platform", ["pc"]);
    });
  });

  describe("clear functionality", () => {
    it("calls onClearAll when clear all button is clicked", () => {
      const onClearAll = vi.fn();
      render(
        <FilterPanel
          filters={sampleFilters}
          activeFilters={{ genres: ["action"] }}
          onFilterChange={vi.fn()}
          onClearAll={onClearAll}
        />
      );
      fireEvent.click(screen.getByText("Clear all"));
      expect(onClearAll).toHaveBeenCalled();
    });

    it("removes individual filter when X button is clicked", () => {
      const onFilterChange = vi.fn();
      render(
        <FilterPanel
          filters={sampleFilters}
          activeFilters={{ genres: ["action", "rpg"] }}
          onFilterChange={onFilterChange}
          onClearAll={vi.fn()}
        />
      );
      const actionTag = screen.getByText("Action").closest("div");
      const removeButton = actionTag?.querySelector("button");
      if (removeButton) {
        fireEvent.click(removeButton);
        expect(onFilterChange).toHaveBeenCalledWith("genres", ["rpg"]);
      }
    });
  });

  describe("collapsible sections", () => {
    it("renders collapse button for collapsible filters", () => {
      render(
        <FilterPanel
          filters={collapsibleFilters}
          activeFilters={{}}
          onFilterChange={vi.fn()}
          onClearAll={vi.fn()}
          showPanel={true}
        />
      );
      const genresButton = screen.getByText("Genres");
      expect(genresButton.tagName.toLowerCase()).toBe("button");
    });

    it("toggles section visibility when collapse button is clicked", () => {
      render(
        <FilterPanel
          filters={collapsibleFilters}
          activeFilters={{}}
          onFilterChange={vi.fn()}
          onClearAll={vi.fn()}
          showPanel={true}
        />
      );
      expect(screen.getByText("Action")).toBeDefined();
      fireEvent.click(screen.getByText("Genres"));
      expect(screen.queryByText("Action")).toBeNull();
    });
  });
});

describe("hasActiveFilters helper", () => {
  it("returns false for empty object", () => {
    expect(hasActiveFilters({})).toBe(false);
  });

  it("returns true when at least one filter has values", () => {
    expect(hasActiveFilters({ genres: ["action"] })).toBe(true);
  });
});

describe("countActiveFilters helper", () => {
  it("returns 0 for empty object", () => {
    expect(countActiveFilters({})).toBe(0);
  });

  it("returns sum of all filter values", () => {
    expect(countActiveFilters({ genres: ["action", "rpg"], platform: ["pc"] })).toBe(3);
  });
});

describe("toggleFilterValue helper", () => {
  it("adds value in checkbox mode", () => {
    expect(toggleFilterValue(["action"], "rpg", "checkbox")).toContain("rpg");
  });

  it("removes value in checkbox mode", () => {
    expect(toggleFilterValue(["action", "rpg"], "action", "checkbox")).not.toContain("action");
  });

  it("returns single value in radio mode", () => {
    expect(toggleFilterValue(["action"], "rpg", "radio")).toEqual(["rpg"]);
  });
});
