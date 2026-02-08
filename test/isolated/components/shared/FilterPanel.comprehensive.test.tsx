import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  FilterPanel,
  hasActiveFilters,
  countActiveFilters,
  toggleFilterValue,
  type FilterConfig,
} from "../../../../src/components/shared/FilterPanel";

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
      const onFilterChange = mock(() => {});
      const onClearAll = mock(() => {});

      const { container } = render(
        <FilterPanel
          filters={sampleFilters}
          activeFilters={{}}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
          showPanel={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("renders active filters section when filters are active", () => {
      const onFilterChange = mock(() => {});
      const onClearAll = mock(() => {});

      render(
        <FilterPanel
          filters={sampleFilters}
          activeFilters={{ genres: ["action"] }}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
          showPanel={false}
        />
      );

      expect(screen.getByText("Active filters")).toBeDefined();
      expect(screen.getByText("Action")).toBeDefined();
    });

    it("renders filter sections when showPanel is true", () => {
      const onFilterChange = mock(() => {});
      const onClearAll = mock(() => {});

      render(
        <FilterPanel
          filters={sampleFilters}
          activeFilters={{}}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
          showPanel={true}
        />
      );

      expect(screen.getByText("Genres")).toBeDefined();
      expect(screen.getByText("Platform")).toBeDefined();
    });

    it("shows option counts when provided", () => {
      const onFilterChange = mock(() => {});
      const onClearAll = mock(() => {});

      render(
        <FilterPanel
          filters={sampleFilters}
          activeFilters={{}}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
          showPanel={true}
        />
      );

      expect(screen.getByText("42")).toBeDefined();
      expect(screen.getByText("28")).toBeDefined();
    });

    it("shows available count for each filter section", () => {
      const onFilterChange = mock(() => {});
      const onClearAll = mock(() => {});

      render(
        <FilterPanel
          filters={sampleFilters}
          activeFilters={{}}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
          showPanel={true}
        />
      );

      // Each section shows "X available"
      expect(screen.getAllByText(/available/).length).toBeGreaterThan(0);
    });
  });

  describe("custom labels", () => {
    it("uses custom labels when provided", () => {
      const onFilterChange = mock(() => {});
      const onClearAll = mock(() => {});

      render(
        <FilterPanel
          filters={sampleFilters}
          activeFilters={{ genres: ["action"] }}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
          labels={{
            activeFilters: "Current Filters",
            selected: "chosen",
            clearAll: "Reset All",
          }}
        />
      );

      expect(screen.getByText("Current Filters")).toBeDefined();
      expect(screen.getByText("1 chosen")).toBeDefined();
      expect(screen.getByText("Reset All")).toBeDefined();
    });
  });

  describe("filter selection", () => {
    it("calls onFilterChange when checkbox option is clicked", () => {
      const onFilterChange = mock(() => {});
      const onClearAll = mock(() => {});

      render(
        <FilterPanel
          filters={sampleFilters}
          activeFilters={{}}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
          showPanel={true}
        />
      );

      const actionLabel = screen.getByText("Action");
      fireEvent.click(actionLabel);

      expect(onFilterChange).toHaveBeenCalledWith("genres", ["action"]);
    });

    it("calls onFilterChange with single value for radio option", () => {
      const onFilterChange = mock(() => {});
      const onClearAll = mock(() => {});

      render(
        <FilterPanel
          filters={sampleFilters}
          activeFilters={{}}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
          showPanel={true}
        />
      );

      const pcLabel = screen.getByText("PC");
      fireEvent.click(pcLabel);

      expect(onFilterChange).toHaveBeenCalledWith("platform", ["pc"]);
    });

    it("removes value when clicking selected checkbox option", () => {
      const onFilterChange = mock(() => {});
      const onClearAll = mock(() => {});

      render(
        <FilterPanel
          filters={sampleFilters}
          activeFilters={{ genres: ["action", "rpg"] }}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
          showPanel={true}
        />
      );

      // Use getAllByText and find the one in the filter options grid (not the active filters tag)
      const actionLabels = screen.getAllByText("Action");
      // The second one should be in the filter options grid
      const actionInGrid = actionLabels[actionLabels.length - 1];
      fireEvent.click(actionInGrid);

      expect(onFilterChange).toHaveBeenCalledWith("genres", ["rpg"]);
    });
  });

  describe("clear functionality", () => {
    it("calls onClearAll when clear all button is clicked", () => {
      const onFilterChange = mock(() => {});
      const onClearAll = mock(() => {});

      render(
        <FilterPanel
          filters={sampleFilters}
          activeFilters={{ genres: ["action"] }}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
        />
      );

      const clearButton = screen.getByText("Clear all");
      fireEvent.click(clearButton);

      expect(onClearAll).toHaveBeenCalled();
    });

    it("removes individual filter when X button is clicked", () => {
      const onFilterChange = mock(() => {});
      const onClearAll = mock(() => {});

      render(
        <FilterPanel
          filters={sampleFilters}
          activeFilters={{ genres: ["action", "rpg"] }}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
        />
      );

      // Find the remove button for "Action" filter tag
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
      const onFilterChange = mock(() => {});
      const onClearAll = mock(() => {});

      render(
        <FilterPanel
          filters={collapsibleFilters}
          activeFilters={{}}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
          showPanel={true}
        />
      );

      // The label should be a button for collapsible sections
      const genresButton = screen.getByText("Genres");
      expect(genresButton.tagName.toLowerCase()).toBe("button");
    });

    it("toggles section visibility when collapse button is clicked", () => {
      const onFilterChange = mock(() => {});
      const onClearAll = mock(() => {});

      render(
        <FilterPanel
          filters={collapsibleFilters}
          activeFilters={{}}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
          showPanel={true}
        />
      );

      // Initially expanded, options should be visible
      expect(screen.getByText("Action")).toBeDefined();

      // Click to collapse
      const genresButton = screen.getByText("Genres");
      fireEvent.click(genresButton);

      // Options should be hidden
      expect(screen.queryByText("Action")).toBeNull();
    });
  });

  describe("selected count display", () => {
    it("shows correct count of selected filters", () => {
      const onFilterChange = mock(() => {});
      const onClearAll = mock(() => {});

      render(
        <FilterPanel
          filters={sampleFilters}
          activeFilters={{ genres: ["action", "rpg"], platform: ["pc"] }}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
        />
      );

      expect(screen.getByText("3 selected")).toBeDefined();
    });
  });
});

describe("hasActiveFilters helper", () => {
  it("returns false for empty object", () => {
    expect(hasActiveFilters({})).toBe(false);
  });

  it("returns false when all arrays are empty", () => {
    expect(hasActiveFilters({ genres: [], platform: [] })).toBe(false);
  });

  it("returns true when at least one filter has values", () => {
    expect(hasActiveFilters({ genres: ["action"] })).toBe(true);
  });

  it("returns true for multiple active filters", () => {
    expect(hasActiveFilters({ genres: ["action"], platform: ["pc"] })).toBe(true);
  });
});

describe("countActiveFilters helper", () => {
  it("returns 0 for empty object", () => {
    expect(countActiveFilters({})).toBe(0);
  });

  it("returns correct count for single filter", () => {
    expect(countActiveFilters({ genres: ["action", "rpg"] })).toBe(2);
  });

  it("returns sum of all filter values", () => {
    expect(countActiveFilters({ genres: ["action", "rpg"], platform: ["pc"] })).toBe(3);
  });
});

describe("toggleFilterValue helper", () => {
  describe("checkbox mode", () => {
    it("adds value when not present", () => {
      const result = toggleFilterValue(["action"], "rpg", "checkbox");
      expect(result).toContain("action");
      expect(result).toContain("rpg");
    });

    it("removes value when present", () => {
      const result = toggleFilterValue(["action", "rpg"], "action", "checkbox");
      expect(result).not.toContain("action");
      expect(result).toContain("rpg");
    });

    it("preserves other values", () => {
      const result = toggleFilterValue(["action", "rpg", "adventure"], "rpg", "checkbox");
      expect(result).toContain("action");
      expect(result).toContain("adventure");
      expect(result).not.toContain("rpg");
    });
  });

  describe("radio mode", () => {
    it("returns single value array", () => {
      const result = toggleFilterValue(["action"], "rpg", "radio");
      expect(result).toEqual(["rpg"]);
    });

    it("replaces existing selection", () => {
      const result = toggleFilterValue(["action", "rpg"], "adventure", "radio");
      expect(result).toEqual(["adventure"]);
    });

    it("works with empty current values", () => {
      const result = toggleFilterValue([], "action", "radio");
      expect(result).toEqual(["action"]);
    });
  });
});
