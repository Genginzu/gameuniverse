import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { ModerationConfirmDialog } from "@/components/admin/reports/ModerationConfirmDialog";

function renderSuspension(onConfirm = vi.fn().mockResolvedValue(undefined), onClose = vi.fn()) {
  render(
    <ModerationConfirmDialog
      action="author_suspended"
      authorName="alice"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
  return {
    onConfirm,
    onClose,
    input: screen.getByRole("spinbutton") as HTMLInputElement,
    submit: screen.getByText("confirm.author_suspended.action").closest("button")!,
  };
}

describe("ModerationConfirmDialog — suspension", () => {
  it("defaults to 7 days with 1..365 bounds", () => {
    const { input } = renderSuspension();
    expect(input.value).toBe("7");
    expect(input.min).toBe("1");
    expect(input.max).toBe("365");
  });

  it("sends the chosen duration on confirm, then closes", async () => {
    const { input, submit, onConfirm, onClose } = renderSuspension();
    fireEvent.change(input, { target: { value: "30" } });
    fireEvent.click(submit);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onConfirm).toHaveBeenCalledWith({ suspensionDays: 30 });
  });

  it.each(["0", "366", "", "2.5"])("blocks submission for %j", (value) => {
    const { input, submit, onConfirm } = renderSuspension();
    fireEvent.change(input, { target: { value } });
    expect(submit.disabled).toBe(true);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    fireEvent.click(submit);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it.each(["1", "365"])("accepts the %s-day boundary", (value) => {
    const { input, submit } = renderSuspension();
    fireEvent.change(input, { target: { value } });
    expect(submit.disabled).toBe(false);
  });

  it("keeps the dialog open and shows an error when the action fails", async () => {
    const { submit, onClose } = renderSuspension(vi.fn().mockRejectedValue(new Error("boom")));
    fireEvent.click(submit);
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("ModerationConfirmDialog — deletion", () => {
  it("has no duration field and confirms without options", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <ModerationConfirmDialog
        action="content_deleted"
        authorName="alice"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );
    expect(screen.queryByRole("spinbutton")).toBeNull();
    fireEvent.click(screen.getByText("confirm.content_deleted.action"));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith({}));
  });
});
