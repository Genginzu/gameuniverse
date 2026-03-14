import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

const mockToast = vi.fn();

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

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

import { PostComposer } from "@/components/players/PostComposer";

const defaultProps = {
  onPostCreated: vi.fn(),
  playerId: "player-1",
  isCreating: false,
  onSubmit: vi.fn().mockResolvedValue(undefined),
};

describe("PostComposer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps.onSubmit = vi.fn().mockResolvedValue(undefined);
  });

  // Req 7.2 — renders textarea with placeholder
  it("renders textarea with placeholder", () => {
    render(<PostComposer {...defaultProps} />);
    const textarea = screen.getByPlaceholderText("placeholder");
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe("TEXTAREA");
  });

  // Req 7.4 — publish button disabled when empty
  it("publish button is disabled when textarea is empty", () => {
    render(<PostComposer {...defaultProps} />);
    const button = screen.getByRole("button", { name: /publish/i });
    expect(button).toBeDisabled();
  });

  // Req 7.4 — publish button disabled when whitespace only
  it("publish button is disabled when textarea contains only whitespace", () => {
    render(<PostComposer {...defaultProps} />);
    const textarea = screen.getByPlaceholderText("placeholder");
    fireEvent.change(textarea, { target: { value: "   \n\t  " } });
    const button = screen.getByRole("button", { name: /publish/i });
    expect(button).toBeDisabled();
  });

  // Req 7.3 — character counter displayed
  it("displays character counter", () => {
    render(<PostComposer {...defaultProps} />);
    expect(screen.getByText("charCount")).toBeInTheDocument();
  });

  // Req 7.4 — typing text enables the publish button
  it("typing text enables the publish button", () => {
    render(<PostComposer {...defaultProps} />);
    const textarea = screen.getByPlaceholderText("placeholder");
    fireEvent.change(textarea, { target: { value: "Hello world" } });
    const button = screen.getByRole("button", { name: /publish/i });
    expect(button).not.toBeDisabled();
  });

  // Req 7.5 — clicking publish calls onSubmit with content
  it("clicking publish calls onSubmit with content", async () => {
    render(<PostComposer {...defaultProps} />);
    const textarea = screen.getByPlaceholderText("placeholder");
    fireEvent.change(textarea, { target: { value: "My new post" } });
    const button = screen.getByRole("button", { name: /publish/i });
    fireEvent.click(button);
    expect(defaultProps.onSubmit).toHaveBeenCalledWith("My new post", undefined);
  });

  // Req 7.6 — button disabled when isCreating=true
  it("button is disabled when isCreating is true", () => {
    render(<PostComposer {...defaultProps} isCreating={true} />);
    const textarea = screen.getByPlaceholderText("placeholder");
    fireEvent.change(textarea, { target: { value: "Some content" } });
    const button = screen.getByRole("button", { name: /publish/i });
    expect(button).toBeDisabled();
  });

  // Req 11.4 — aria-label present on textarea
  it("textarea has aria-label attribute", () => {
    render(<PostComposer {...defaultProps} />);
    const textarea = screen.getByPlaceholderText("placeholder");
    expect(textarea).toHaveAttribute("aria-label", "placeholder");
  });
});
