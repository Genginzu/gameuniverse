import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  SearchBar,
  shouldTriggerSearch,
  createDebouncedCallback,
} from "@/components/shared/SearchBar";

describe("SearchBar Component", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    consoleErrorSpy.mockRestore();
  });

  describe("basic rendering", () => {
    it("renders with default placeholder", () => {
      render(<SearchBar onSearch={vi.fn()} />);
      expect(screen.getByPlaceholderText("Search...")).toBeDefined();
    });

    it("renders with custom placeholder", () => {
      render(<SearchBar onSearch={vi.fn()} placeholder="Find games..." />);
      expect(screen.getByPlaceholderText("Find games...")).toBeDefined();
    });

    it("renders with initial value", () => {
      render(<SearchBar onSearch={vi.fn()} initialValue="test query" />);
      expect(screen.getByDisplayValue("test query")).toBeDefined();
    });

    it("applies custom className", () => {
      const { container } = render(<SearchBar onSearch={vi.fn()} className="custom-class" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("custom-class");
    });
  });

  describe("input handling", () => {
    it("updates input value on change", () => {
      render(<SearchBar onSearch={vi.fn()} />);
      const input = screen.getByPlaceholderText("Search...") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "new value" } });
      expect(input.value).toBe("new value");
    });

    it("shows clear button when input has value", () => {
      render(<SearchBar onSearch={vi.fn()} initialValue="test" />);
      expect(screen.getByRole("button")).toBeDefined();
    });

    it("hides clear button when input is empty", () => {
      render(<SearchBar onSearch={vi.fn()} />);
      expect(screen.queryAllByRole("button").length).toBe(0);
    });

    it("clears input when clear button is clicked", () => {
      render(<SearchBar onSearch={vi.fn()} initialValue="test" />);
      const input = screen.getByDisplayValue("test") as HTMLInputElement;
      fireEvent.click(screen.getByRole("button"));
      expect(input.value).toBe("");
    });
  });

  describe("debouncing", () => {
    it("calls onSearch after debounce delay", () => {
      const onSearch = vi.fn();
      render(<SearchBar onSearch={onSearch} debounceMs={100} />);

      fireEvent.change(screen.getByPlaceholderText("Search..."), {
        target: { value: "test" },
      });

      expect(onSearch).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(onSearch).toHaveBeenCalledWith("test");
    });

    it("only calls onSearch once for rapid changes", () => {
      const onSearch = vi.fn();
      render(<SearchBar onSearch={onSearch} debounceMs={100} />);

      const input = screen.getByPlaceholderText("Search...");
      fireEvent.change(input, { target: { value: "t" } });
      fireEvent.change(input, { target: { value: "te" } });
      fireEvent.change(input, { target: { value: "tes" } });
      fireEvent.change(input, { target: { value: "test" } });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(onSearch).toHaveBeenCalledWith("test");
      expect(onSearch).toHaveBeenCalledTimes(1);
    });
  });

  describe("search indicator", () => {
    it("shows search indicator when enabled and has query", () => {
      render(
        <SearchBar
          onSearch={vi.fn()}
          showSearchIndicator={true}
          searchIndicatorText="Searching for"
          initialValue="test"
        />
      );
      expect(screen.getByText(/Searching for/)).toBeDefined();
    });

    it("hides search indicator when query is empty", () => {
      render(
        <SearchBar
          onSearch={vi.fn()}
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
});

describe("createDebouncedCallback helper", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns debouncedFn and cancel functions", () => {
    const result = createDebouncedCallback(vi.fn(), 100);
    expect(typeof result.debouncedFn).toBe("function");
    expect(typeof result.cancel).toBe("function");
  });

  it("cancel prevents callback execution", () => {
    const callback = vi.fn();
    const { debouncedFn, cancel } = createDebouncedCallback(callback, 50);
    debouncedFn();
    cancel();
    vi.advanceTimersByTime(100);
    expect(callback).not.toHaveBeenCalled();
  });

  it("executes callback after delay", () => {
    const callback = vi.fn();
    const { debouncedFn } = createDebouncedCallback(callback, 50);
    debouncedFn();
    vi.advanceTimersByTime(50);
    expect(callback).toHaveBeenCalled();
  });
});
