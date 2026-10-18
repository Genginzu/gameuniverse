import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    values?.date ? `${key}:${values.date}` : key,
  useFormatter: () => ({ dateTime: () => "25 octobre 2026 à 13:49" }),
}));

const mockSuspension = vi.fn();
vi.mock("@/hooks/useMySuspension", () => ({
  useMySuspension: () => mockSuspension(),
}));

import { SuspensionGate } from "@/components/shared/SuspensionGate";

beforeEach(() => mockSuspension.mockReset());

describe("SuspensionGate", () => {
  it("renders the write UI when the user is not suspended", () => {
    mockSuspension.mockReturnValue({ suspended: false, until: null, isLoading: false });
    render(
      <SuspensionGate>
        <button>publish</button>
      </SuspensionGate>
    );
    expect(screen.getByText("publish")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("replaces the write UI with a notice showing the end date", () => {
    mockSuspension.mockReturnValue({
      suspended: true,
      until: "2026-10-25T11:49:00.000Z",
      isLoading: false,
    });
    render(
      <SuspensionGate>
        <button>publish</button>
      </SuspensionGate>
    );
    expect(screen.queryByText("publish")).toBeNull();
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("title")).toBeTruthy();
    expect(screen.getByText("bodyUntil:25 octobre 2026 à 13:49")).toBeTruthy();
  });

  it("shows the indefinite message when there is no end date", () => {
    mockSuspension.mockReturnValue({ suspended: true, until: null, isLoading: false });
    render(
      <SuspensionGate>
        <button>publish</button>
      </SuspensionGate>
    );
    expect(screen.getByText("bodyIndefinite")).toBeTruthy();
  });
});
