import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TranslationAiSettingsPanel } from "@/components/admin/translations/TranslationAiSettingsPanel";
import type { TranslationAiSettings } from "@/types/admin-translations";

const mockUpdateModel = vi.fn();
const mockRefresh = vi.fn();
let hookState: {
  settings: TranslationAiSettings | undefined;
  isLoading: boolean;
  isSaving: boolean;
  isRefreshing: boolean;
  saveError: string | null;
};

vi.mock("@/hooks/useTranslationAiSettings", () => ({
  useTranslationAiSettings: () => ({
    ...hookState,
    updateModel: mockUpdateModel,
    refresh: mockRefresh,
  }),
}));

const SETTINGS: TranslationAiSettings = {
  model: "openai/gpt-5.4-nano",
  models: [
    {
      id: "anthropic/claude-haiku-4.5",
      name: "Claude Haiku 4.5",
      inputPricePerMillion: 1,
      outputPricePerMillion: 5,
    },
    {
      id: "openai/gpt-5.4-nano",
      name: "GPT-5.4 Nano",
      inputPricePerMillion: null,
      outputPricePerMillion: null,
    },
  ],
  credits: { balance: 12.5, totalUsed: 3.25 },
};

beforeEach(() => {
  vi.clearAllMocks();
  hookState = {
    settings: SETTINGS,
    isLoading: false,
    isSaving: false,
    isRefreshing: false,
    saveError: null,
  };
});

describe("TranslationAiSettingsPanel", () => {
  it("selects the current model and groups models by provider", () => {
    const { container } = render(<TranslationAiSettingsPanel />);
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("openai/gpt-5.4-nano");
    const groups = [...container.querySelectorAll("optgroup")].map((g) => g.label);
    expect(groups).toEqual(["anthropic", "openai"]);
  });

  it("changes the model when another one is picked", () => {
    render(<TranslationAiSettingsPanel />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "anthropic/claude-haiku-4.5" },
    });
    expect(mockUpdateModel).toHaveBeenCalledWith("anthropic/claude-haiku-4.5");
  });

  it("shows the remaining credits", () => {
    render(<TranslationAiSettingsPanel />);
    expect(screen.getByText("creditsLabel")).toBeInTheDocument();
    expect(screen.getByText(/12[.,]50/)).toBeInTheDocument();
  });

  it("refreshes credits on demand", () => {
    render(<TranslationAiSettingsPanel />);
    fireEvent.click(screen.getByRole("button", { name: "refreshCredits" }));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("spins and locks the refresh button while credits reload", () => {
    hookState.isRefreshing = true;
    render(<TranslationAiSettingsPanel />);
    const button = screen.getByRole("button", { name: "refreshCredits" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector(".animate-spin")).not.toBeNull();
  });

  it("says when credits are unavailable", () => {
    hookState.settings = { ...SETTINGS, credits: null };
    render(<TranslationAiSettingsPanel />);
    expect(screen.getByText("creditsUnavailable")).toBeInTheDocument();
  });

  it("keeps the current model selectable when the model list is unavailable", () => {
    hookState.settings = { ...SETTINGS, models: [] };
    render(<TranslationAiSettingsPanel />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("openai/gpt-5.4-nano");
    expect(select).toBeDisabled();
    expect(screen.getByText("modelsUnavailable")).toBeInTheDocument();
  });

  it("reports a failed model change", () => {
    hookState.saveError = "boom";
    render(<TranslationAiSettingsPanel />);
    expect(screen.getByText("saveError")).toBeInTheDocument();
  });
});
