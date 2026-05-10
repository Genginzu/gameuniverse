import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock next-intl
const editorialTranslations: Record<string, string> = {
  "globalSearch.overlay.emptyHint": "Start typing to see results.",
  "globalSearch.overlay.recent.title": "Recent searches",
  "globalSearch.overlay.recent.clearAll": "Clear all",
  "globalSearch.overlay.recent.removeAriaLabel": "Remove search “{query}”",
};
vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string, params?: Record<string, string>) => {
    const fullKey = `${namespace}.${key}`;
    let value = editorialTranslations[fullKey] ?? fullKey;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(`{${k}}`, v);
      }
    }
    return value;
  },
}));

import { SearchOverlayEmptyState } from "@/components/layout/editorial/search/SearchOverlayEmptyState";

describe("SearchOverlayEmptyState", () => {
  describe("when there are no recent searches", () => {
    it("renders the emptyHint message", () => {
      render(
        <SearchOverlayEmptyState
          recentSearches={[]}
          onSelectRecent={() => {}}
          onRemoveRecent={() => {}}
          onClearAll={() => {}}
        />
      );
      expect(screen.getByText("Start typing to see results.")).toBeDefined();
      expect(screen.queryByText("Recent searches")).toBeNull();
    });

    it("does not render the recent list section", () => {
      const { container } = render(
        <SearchOverlayEmptyState
          recentSearches={[]}
          onSelectRecent={() => {}}
          onRemoveRecent={() => {}}
          onClearAll={() => {}}
        />
      );
      expect(container.querySelector(".search-overlay-recent-list")).toBeNull();
    });
  });

  describe("when there are recent searches", () => {
    it("renders the title and the clear-all button", () => {
      render(
        <SearchOverlayEmptyState
          recentSearches={["zelda", "mario"]}
          onSelectRecent={() => {}}
          onRemoveRecent={() => {}}
          onClearAll={() => {}}
        />
      );
      expect(screen.getByText("Recent searches")).toBeDefined();
      expect(screen.getByText("Clear all")).toBeDefined();
    });

    it("renders one button per recent query", () => {
      render(
        <SearchOverlayEmptyState
          recentSearches={["zelda", "mario", "elden ring"]}
          onSelectRecent={() => {}}
          onRemoveRecent={() => {}}
          onClearAll={() => {}}
        />
      );
      expect(screen.getByText("zelda")).toBeDefined();
      expect(screen.getByText("mario")).toBeDefined();
      expect(screen.getByText("elden ring")).toBeDefined();
    });

    it("calls onSelectRecent with the query when a button is clicked", () => {
      const onSelectRecent = vi.fn();
      render(
        <SearchOverlayEmptyState
          recentSearches={["zelda"]}
          onSelectRecent={onSelectRecent}
          onRemoveRecent={() => {}}
          onClearAll={() => {}}
        />
      );
      fireEvent.click(screen.getByText("zelda"));
      expect(onSelectRecent).toHaveBeenCalledWith("zelda");
    });

    it("calls onRemoveRecent with the query when its X button is clicked", () => {
      const onRemoveRecent = vi.fn();
      render(
        <SearchOverlayEmptyState
          recentSearches={["zelda"]}
          onSelectRecent={() => {}}
          onRemoveRecent={onRemoveRecent}
          onClearAll={() => {}}
        />
      );
      fireEvent.click(screen.getByLabelText('Remove search “zelda”'));
      expect(onRemoveRecent).toHaveBeenCalledWith("zelda");
    });

    it("does NOT propagate the remove click to the parent button (avoids onSelect being called)", () => {
      const onSelectRecent = vi.fn();
      const onRemoveRecent = vi.fn();
      render(
        <SearchOverlayEmptyState
          recentSearches={["zelda"]}
          onSelectRecent={onSelectRecent}
          onRemoveRecent={onRemoveRecent}
          onClearAll={() => {}}
        />
      );
      fireEvent.click(screen.getByLabelText('Remove search “zelda”'));
      expect(onRemoveRecent).toHaveBeenCalled();
      expect(onSelectRecent).not.toHaveBeenCalled();
    });

    it("calls onClearAll when the clear-all button is clicked", () => {
      const onClearAll = vi.fn();
      render(
        <SearchOverlayEmptyState
          recentSearches={["zelda"]}
          onSelectRecent={() => {}}
          onRemoveRecent={() => {}}
          onClearAll={onClearAll}
        />
      );
      fireEvent.click(screen.getByText("Clear all"));
      expect(onClearAll).toHaveBeenCalledTimes(1);
    });

    it("each remove button has a distinct aria-label including the query", () => {
      render(
        <SearchOverlayEmptyState
          recentSearches={["zelda", "mario"]}
          onSelectRecent={() => {}}
          onRemoveRecent={() => {}}
          onClearAll={() => {}}
        />
      );
      expect(screen.getByLabelText('Remove search “zelda”')).toBeDefined();
      expect(screen.getByLabelText('Remove search “mario”')).toBeDefined();
    });
  });
});
