import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("next-intl", () => {
  const createTranslator = () => {
    const t = (key: string) => key;
    t.rich = (key: string) => key;
    t.raw = (key: string) => key;
    t.markup = (key: string) => key;
    t.has = () => true;
    return t;
  };
  return {
    useTranslations: () => createTranslator(),
    useLocale: () => "fr",
    useMessages: () => ({}),
    useFormatter: () => ({
      relativeTime: () => "il y a 2 heures",
      dateTime: () => "01/03/2024",
      number: (n: number) => String(n),
    }),
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock("lucide-react", () => ({
  Search: (props: Record<string, unknown>) =>
    React.createElement("svg", { "data-testid": "search-icon", ...props }),
}));

import { SearchBar } from "@/components/players/SearchBar";

const defaultProps = {
  value: "",
  onChange: vi.fn(),
};

describe("SearchBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Req 4.1, 4.2 — renders input with placeholder text
  it("renders input with placeholder text", () => {
    render(<SearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText("searchPlaceholder");
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
  });

  // Req 9.6 — renders with aria-label
  it("renders with aria-label for accessibility", () => {
    render(<SearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText("searchPlaceholder");
    expect(input).toHaveAttribute("aria-label", "searchAriaLabel");
  });

  // Req 4.6 — calls onChange when user types
  it("calls onChange when user types", () => {
    const onChange = vi.fn();
    render(<SearchBar {...defaultProps} onChange={onChange} />);
    const input = screen.getByPlaceholderText("searchPlaceholder");
    fireEvent.change(input, { target: { value: "test query" } });
    expect(onChange).toHaveBeenCalledWith("test query");
  });

  // Req 4.1 — displays the current value
  it("displays the current value", () => {
    render(<SearchBar {...defaultProps} value="current search" />);
    const input = screen.getByPlaceholderText("searchPlaceholder");
    expect(input).toHaveAttribute("value", "current search");
  });

  // Req 4.6 — clears when value is set to empty string
  it("clears when value is set to empty string", () => {
    const { rerender } = render(<SearchBar {...defaultProps} value="something" />);
    const input = screen.getByPlaceholderText("searchPlaceholder");
    expect(input).toHaveAttribute("value", "something");

    rerender(<SearchBar value="" onChange={defaultProps.onChange} />);
    expect(input).toHaveAttribute("value", "");
  });

  // Req 4.2 — renders search icon
  it("renders search icon", () => {
    render(<SearchBar {...defaultProps} />);
    expect(screen.getByTestId("search-icon")).toBeInTheDocument();
  });
});
