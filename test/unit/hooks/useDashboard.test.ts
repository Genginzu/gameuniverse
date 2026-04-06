import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { DashboardContext, useDashboard } from "@/hooks/useDashboard";

const mockUser = { id: "1", email: "test@test.com" } as any;

describe("useDashboard", () => {
  it("throws error when used outside provider", () => {
    expect(() => {
      renderHook(() => useDashboard());
    }).toThrow("useDashboard must be used within DashboardLayout");
  });

  it("returns context value when inside provider", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(DashboardContext.Provider, { value: { user: mockUser, loading: false } }, children);

    const { result } = renderHook(() => useDashboard(), { wrapper });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });
});
