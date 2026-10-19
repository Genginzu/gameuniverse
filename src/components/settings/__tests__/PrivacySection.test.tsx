import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { PrivacySection } from "@/components/settings/PrivacySection";

// test/setup-vitest.ts mocks next-intl: t(key) returns the key.
function renderSection(isPrivate: boolean, onChange = vi.fn().mockResolvedValue(undefined)) {
  render(<PrivacySection isPrivate={isPrivate} onChange={onChange} />);
  return onChange;
}

describe("PrivacySection", () => {
  it("renders a labelled switch reflecting the current state", () => {
    renderSection(true);
    const toggle = screen.getByRole("switch", { name: "privateProfile" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("statusPrivate")).toBeInTheDocument();
  });

  it("calls onChange with the new value when toggled", async () => {
    const onChange = renderSection(false);
    fireEvent.click(screen.getByRole("switch", { name: "privateProfile" }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(true));
  });
});
