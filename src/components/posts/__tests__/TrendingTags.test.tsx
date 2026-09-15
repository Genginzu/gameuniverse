import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import type { TrendingTag } from "@/types/post";

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string, params?: Record<string, string | number>) => {
      if (params) {
        return Object.entries(params).reduce(
          (acc, [k, v]) => acc.replace(`{${k}}`, String(v)),
          key
        );
      }
      return key;
    };
    return t;
  },
}));

vi.mock("@iconify/react", () => ({
  Icon: ({ icon }: { icon: string }) => React.createElement("span", { "data-icon": icon }),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => React.createElement("a", { href, ...props }, children),
}));

const mockUseTrendingTags = vi.fn();
vi.mock("@/hooks/useTrendingTags", () => ({
  useTrendingTags: (limit?: number) => mockUseTrendingTags(limit),
}));

import { TrendingTags } from "@/components/posts/TrendingTags";

function setHook(value: { tags: TrendingTag[]; isLoading: boolean; error: string | null }) {
  mockUseTrendingTags.mockReturnValue(value);
}

describe("TrendingTags", () => {
  beforeEach(() => {
    mockUseTrendingTags.mockReset();
  });

  it("renders tags as links to the tag page", () => {
    setHook({
      tags: [
        { tag: "rpg", count: 12 },
        { tag: "gaming", count: 5 },
      ],
      isLoading: false,
      error: null,
    });

    render(<TrendingTags />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/posts/tags/rpg");
    expect(links[0]).toHaveTextContent("#rpg");
    expect(links[0]).toHaveTextContent("12");
    expect(links[1]).toHaveAttribute("href", "/posts/tags/gaming");
  });

  it("shows the empty message when there are no tags", () => {
    setHook({ tags: [], isLoading: false, error: null });

    render(<TrendingTags />);

    expect(screen.getByText("trendingEmpty")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders nothing meaningful on error", () => {
    setHook({ tags: [], isLoading: false, error: "error" });

    const { container } = render(<TrendingTags />);

    expect(container).toBeEmptyDOMElement();
  });

  it("forwards the limit prop to the hook", () => {
    setHook({ tags: [], isLoading: true, error: null });

    render(<TrendingTags limit={5} />);

    expect(mockUseTrendingTags).toHaveBeenCalledWith(5);
  });

  it("renders tags as buttons calling onTagSelect when provided", () => {
    setHook({
      tags: [{ tag: "rpg", count: 3 }],
      isLoading: false,
      error: null,
    });
    const onTagSelect = vi.fn();

    render(<TrendingTags onTagSelect={onTagSelect} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    const button = screen.getByRole("button", { name: "trendingPostCount" });
    expect(button).toHaveTextContent("#rpg");
    button.click();
    expect(onTagSelect).toHaveBeenCalledWith("rpg");
  });
});
