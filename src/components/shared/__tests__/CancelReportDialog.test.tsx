import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { CancelReportDialog } from "@/components/shared/CancelReportDialog";

describe("CancelReportDialog", () => {
  it("renders the confirmation message", () => {
    render(<CancelReportDialog onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(screen.getByText("cancelConfirmMessage")).toBeTruthy();
  });

  it("closes without cancelling when the user keeps the report", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(<CancelReportDialog onClose={onClose} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText("cancelConfirmKeep"));
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("cancels then closes on confirmation", async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<CancelReportDialog onClose={onClose} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText("cancelConfirmAction"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows a specific error when the report was already handled", async () => {
    const onClose = vi.fn();
    const err = Object.assign(new Error("closed"), { code: "closed" });
    const onConfirm = vi.fn().mockRejectedValue(err);
    render(<CancelReportDialog onClose={onClose} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText("cancelConfirmAction"));
    expect(await screen.findByText("errors.cancelClosed")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});
