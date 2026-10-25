import { describe, it, expect, vi } from "vitest";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { PlayerPlaytimeForm } from "@/components/games/details/PlayerPlaytimeForm";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

function renderForm(onSubmit = vi.fn().mockResolvedValue(true)) {
  render(
    <PlayerPlaytimeForm
      open
      onOpenChange={vi.fn()}
      currentPlaytime={null}
      submitting={false}
      error={null}
      onSubmit={onSubmit}
    />
  );
  return onSubmit;
}

describe("PlayerPlaytimeForm", () => {
  it.each([
    ["a dot", "250.5"],
    ["a comma", "250,5"],
  ])("accepts decimal hours written with %s", async (_label, typed) => {
    const onSubmit = renderForm();

    fireEvent.change(screen.getByLabelText("normally"), { target: { value: typed } });
    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ hastily: null, normally: 250.5, completely: null })
    );
  });

  it("uses a text field with a decimal keypad", () => {
    renderForm();

    const field = screen.getByLabelText("completely");
    expect(field).toHaveAttribute("type", "text");
    expect(field).toHaveAttribute("inputmode", "decimal");
  });

  it("rejects a value that is not a number", async () => {
    const onSubmit = renderForm();

    fireEvent.change(screen.getByLabelText("hastily"), { target: { value: "12h" } });
    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("hastily: errorNumber");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects more than one decimal", async () => {
    const onSubmit = renderForm();

    fireEvent.change(screen.getByLabelText("normally"), { target: { value: "12,55" } });
    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("errorPrecision");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
