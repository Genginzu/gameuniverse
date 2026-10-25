import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, within } from "@testing-library/react";

import { LibraryStatusLegend } from "@/components/library/LibraryStatusLegend";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

describe("LibraryStatusLegend", () => {
  it("explains each status icon in menu order", () => {
    render(<LibraryStatusLegend />);

    const legend = screen.getByRole("list", { name: "legendTitle" });
    const entries = within(legend).getAllByRole("listitem");
    expect(entries.map((entry) => entry.textContent)).toEqual([
      "owned",
      "playing",
      "completed",
      "wishlist",
    ]);
    expect(entries[1].querySelector("[data-icon='lucide:gamepad-2']")).not.toBeNull();
  });
});
