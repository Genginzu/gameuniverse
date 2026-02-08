import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  SearchBar,
  shouldTriggerSearch,
  createDebouncedCallback,
  type SearchResultItem,
} from "../../../../src/components/shared/SearchBar";

describe("SearchBar Component", () => {
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("basic rendering", () => {
    it("renders with default placeholder", () => {
      const onSearch = mock(() => {});
      render(<SearchBar onSearch={onSearch} />);

      const input = screen.getByPlaceholderText("Search...");
      expect(input).toBeDefined();
    });

    it("renders with custom placeholder", () => {
      const onSearch = mock(() => {});
      render(<SearchBar onSearch={onSearch} placeholder="Find games..." />);

      const input = screen.getByPlaceholderText("Find games...");
      expect(input).toBeDefined();
    });

    it("renders with initial value", () => {
      const onSearch = mock(() => {});
      render(<SearchBar onSearch={onSearch} initialValue="test query" />);

      const input = screen.getByDisplayValue("test query");
      expect(input).toBeDefined();
    });

    it("applies custom className", () => {
      const onSearch = mock(() => {});
      const { container } = render(<SearchBar onSearch={onSearch} className="custom-class" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("custom-class");
    });
  });

  describe("input handling", () => {
    it("updates input value on change", () => {
      const onSearch = mock(() => {});
      render(<SearchBar onSearch={onSearch} />);

      const input = screen.getByPlaceholderText("Search...") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "new value" } });

      expect(input.value).toBe("new value");
    });

    it("shows clear button when input has value", () => {
      const onSearch = mock(() => {});
      render(<SearchBar onSearch={onSearch} initialValue="test" />);

      // Clear button should be visible (it's a button with an X icon)
      const clearButton = screen.getByRole("button");
      expect(clearButton).toBeDefined();
    });

    it("hides clear button when input is empty", () => {
      const onSearch = mock(() => {});
      render(<SearchBar onSearch={onSearch} />);

      // Only the submit button should exist (form submit), no clear button
      const buttons = screen.queryAllByRole("button");
      expect(buttons.length).toBe(0);
    });

    it("clears input when clear button is clicked", () => {
      const onSearch = mock(() => {});
      render(<SearchBar onSearch={onSearch} initialValue="test" />);

      const input = screen.getByDisplayValue("test") as HTMLInputElement;
      const clearButton = screen.getByRole("button");

      fireEvent.click(clearButton);

      expect(input.value).toBe("");
    });
  });

  describe("debouncing", () => {
    it("calls onSearch after debounce delay", async () => {
      const onSearch = mock(() => {});
      render(<SearchBar onSearch={onSearch} debounceMs={100} />);

      const input = screen.getByPlaceholderText("Search...");
      fireEvent.change(input, { target: { value: "test" } });

      // Should not be called immediately
      expect(onSearch).not.toHaveBeenCalled();

      // Wait for debounce
      await waitFor(
        () => {
          expect(onSearch).toHaveBeenCalledWith("test");
        },
        { timeout: 200 }
      );
    });

    it("only calls onSearch once for rapid changes", async () => {
      const onSearch = mock(() => {});
      render(<SearchBar onSearch={onSearch} debounceMs={100} />);

      const input = screen.getByPlaceholderText("Search...");

      // Rapid changes
      fireEvent.change(input, { target: { value: "t" } });
      fireEvent.change(input, { target: { value: "te" } });
      fireEvent.change(input, { target: { value: "tes" } });
      fireEvent.change(input, { target: { value: "test" } });

      // Wait for debounce
      await waitFor(
        () => {
          expect(onSearch).toHaveBeenCalledWith("test");
        },
        { timeout: 200 }
      );

      // Should only be called once with final value
      expect(onSearch).toHaveBeenCalledTimes(1);
    });
  });

  describe("form submission", () => {
    it("calls onSearch on form submit", () => {
      const onSearch = mock(() => {});
      const { container } = render(<SearchBar onSearch={onSearch} initialValue="submit test" />);

      const form = container.querySelector("form");
      if (form) {
        fireEvent.submit(form);
        expect(onSearch).toHaveBeenCalledWith("submit test");
      }
    });
  });

  describe("search indicator", () => {
    it("shows search indicator when enabled and has query", async () => {
      const onSearch = mock(() => {});
      render(
        <SearchBar
          onSearch={onSearch}
          showSearchIndicator={true}
          searchIndicatorText="Searching for"
          initialValue="test"
        />
      );

      // The indicator should show the search text
      expect(screen.getByText(/Searching for/)).toBeDefined();
    });

    it("hides search indicator when query is empty", () => {
      const onSearch = mock(() => {});
      render(
        <SearchBar
          onSearch={onSearch}
          showSearchIndicator={true}
          searchIndicatorText="Searching for"
        />
      );

      expect(screen.queryByText(/Searching for/)).toBeNull();
    });
  });
});

describe("shouldTriggerSearch helper", () => {
  it("returns false for empty string", () => {
    expect(shouldTriggerSearch("")).toBe(false);
  });

  it("returns false for single character with default minLength", () => {
    expect(shouldTriggerSearch("a")).toBe(false);
  });

  it("returns true for two characters with default minLength", () => {
    expect(shouldTriggerSearch("ab")).toBe(true);
  });

  it("respects custom minLength", () => {
    expect(shouldTriggerSearch("abc", 3)).toBe(true);
    expect(shouldTriggerSearch("ab", 3)).toBe(false);
  });

  it("returns true for long queries", () => {
    expect(shouldTriggerSearch("this is a long search query")).toBe(true);
  });
});

describe("createDebouncedCallback helper", () => {
  it("returns debouncedFn and cancel functions", () => {
    const callback = mock(() => {});
    const result = createDebouncedCallback(callback, 100);

    expect(typeof result.debouncedFn).toBe("function");
    expect(typeof result.cancel).toBe("function");
  });

  it("cancel prevents callback execution", async () => {
    const callback = mock(() => {});
    const { debouncedFn, cancel } = createDebouncedCallback(callback, 50);

    debouncedFn();
    cancel();

    // Wait longer than debounce time
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(callback).not.toHaveBeenCalled();
  });

  it("executes callback after delay", async () => {
    const callback = mock(() => {});
    const { debouncedFn } = createDebouncedCallback(callback, 50);

    debouncedFn();

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(callback).toHaveBeenCalled();
  });
});
