import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import NewGamePage from "@/app/[locale]/admin/games/new/page";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  toast: vi.fn(),
  submitGame: vi.fn(),
}));

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/hooks/use-toast", () => ({ toast: mocks.toast }));
vi.mock("@/hooks/useGameForm", () => ({
  useGameForm: () => ({ form: {}, submitGame: mocks.submitGame, isSubmitting: false }),
}));
vi.mock("@/components/admin/games/GameForm", () => ({
  GameForm: ({ onSubmit }: { onSubmit: (data: AdminGameFormData) => Promise<void> }) => (
    <button type="button" onClick={() => onSubmit({} as AdminGameFormData)}>
      submit-form
    </button>
  ),
}));

async function submit() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "submit-form" }));
  });
}

describe("NewGamePage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.push.mockReset();
    mocks.toast.mockReset();
    mocks.submitGame.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a success toast and redirects to the list after creation", async () => {
    render(<NewGamePage />);
    await submit();

    expect(mocks.toast).toHaveBeenCalledWith({ title: "createPage.success", variant: "success" });
    expect(mocks.push).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(500));
    expect(mocks.push).toHaveBeenCalledWith("/admin/games");
  });

  it("maps duplicate errors to the translated duplicate message", async () => {
    mocks.submitGame.mockRejectedValue(new Error("A game with this slug already exists"));
    render(<NewGamePage />);
    await submit();

    expect(mocks.toast).toHaveBeenCalledWith({
      title: "createPage.errorDuplicate",
      variant: "destructive",
    });
    act(() => vi.advanceTimersByTime(1000));
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("shows the raw message for other errors", async () => {
    mocks.submitGame.mockRejectedValue(new Error("Network error"));
    render(<NewGamePage />);
    await submit();

    expect(mocks.toast).toHaveBeenCalledWith({ title: "Network error", variant: "destructive" });
  });

  it("falls back to the generic message for non-Error rejections", async () => {
    mocks.submitGame.mockRejectedValue("boom");
    render(<NewGamePage />);
    await submit();

    expect(mocks.toast).toHaveBeenCalledWith({
      title: "createPage.errorGeneric",
      variant: "destructive",
    });
  });

  it("navigates back to the list from the back button", () => {
    render(<NewGamePage />);
    fireEvent.click(screen.getByRole("button", { name: /form\.backToList/ }));
    expect(mocks.push).toHaveBeenCalledWith("/admin/games");
  });
});
