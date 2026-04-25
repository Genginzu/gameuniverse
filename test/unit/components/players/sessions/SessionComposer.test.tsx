import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
  };
});

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock the search picker to avoid fetch / debounce complexity.
vi.mock("@/components/players/sessions/GameSearchPicker", () => ({
  GameSearchPicker: ({
    onSelect,
    selectedLabel,
    onClear,
  }: {
    onSelect: (g: { id: string; title: string }) => void;
    selectedLabel: string;
    onClear: () => void;
  }) => (
    <div>
      {selectedLabel ? (
        <div>
          <span data-testid="selected-label">{selectedLabel}</span>
          <button type="button" onClick={onClear}>
            clear
          </button>
        </div>
      ) : (
        <button
          type="button"
          data-testid="mock-pick-game"
          onClick={() => onSelect({ id: "22222222-2222-2222-2222-222222222222", title: "Elden Ring" })}
        >
          pick-game
        </button>
      )}
    </div>
  ),
}));

import { SessionComposer } from "@/components/players/sessions/SessionComposer";

describe("SessionComposer", () => {
  it("disables submit until a game is selected", () => {
    const onSubmit = vi.fn();
    render(<SessionComposer locale="fr" isCreating={false} onSubmit={onSubmit} />);
    const submit = screen.getByRole("button", { name: /submit/i });
    expect(submit).toBeDisabled();
  });

  it("enables submit once a game is picked and calls onSubmit with derived payload", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<SessionComposer locale="fr" isCreating={false} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId("mock-pick-game"));
    expect(screen.getByTestId("selected-label")).toHaveTextContent("Elden Ring");

    const submit = screen.getByRole("button", { name: /submit/i });
    expect(submit).not.toBeDisabled();

    fireEvent.click(submit);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.gameId).toBe("22222222-2222-2222-2222-222222222222");
    // Default hours=1, minutes=0 → 60
    expect(payload.durationMinutes).toBe(60);
    expect(payload.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("disables submit when duration is 0", () => {
    const onSubmit = vi.fn();
    render(<SessionComposer locale="fr" isCreating={false} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByTestId("mock-pick-game"));

    const hours = screen.getByLabelText(/hoursLabel/i) as HTMLInputElement;
    const minutes = screen.getByLabelText(/minutesLabel/i) as HTMLInputElement;
    fireEvent.change(hours, { target: { value: "0" } });
    fireEvent.change(minutes, { target: { value: "0" } });

    const submit = screen.getByRole("button", { name: /submit/i });
    expect(submit).toBeDisabled();
  });
});
