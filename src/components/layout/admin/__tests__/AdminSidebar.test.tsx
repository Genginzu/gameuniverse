import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AdminSidebar from "../AdminSidebar";
import type { AdminUser } from "@/types/admin-auth";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("../AdminSidebarNav", () => ({
  AdminSidebarNav: ({ onLinkClick }: { onLinkClick: () => void }) => (
    <a href="/admin/games" onClick={onLinkClick}>
      nav-link
    </a>
  ),
}));
vi.mock("../AdminSidebarUserMenu", () => ({ AdminSidebarUserMenu: () => null }));

function renderSidebar(role: AdminUser["role"], sidebarOpen = false) {
  const setSidebarOpen = vi.fn();
  render(
    <AdminSidebar
      user={{ id: "user-1", role } as AdminUser}
      signOut={vi.fn()}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    />
  );
  return setSidebarOpen;
}

describe("AdminSidebar", () => {
  it.each([
    ["admin", "bg-red-100"],
    ["contributor", "bg-blue-100"],
  ] as const)("renders the %s role badge with its color", (role, colorClass) => {
    renderSidebar(role);
    const badges = screen.getAllByText(`roles.${role}`);
    expect(badges).toHaveLength(2);
    badges.forEach((badge) => expect(badge).toHaveClass(colorClass));
  });

  it("closes the mobile drawer from its close button and with Escape", () => {
    const setSidebarOpen = renderSidebar("admin", true);
    fireEvent.click(screen.getByRole("button", { name: "closeSidebar" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(setSidebarOpen).toHaveBeenCalledTimes(2);
    expect(setSidebarOpen).toHaveBeenNthCalledWith(1, false);
    expect(setSidebarOpen).toHaveBeenNthCalledWith(2, false);
  });

  it("closes the drawer after navigating on small screens only", () => {
    window.innerWidth = 375;
    const setSidebarOpen = renderSidebar("admin", true);
    fireEvent.click(screen.getAllByText("nav-link")[1]);
    expect(setSidebarOpen).toHaveBeenCalledWith(false);

    setSidebarOpen.mockClear();
    window.innerWidth = 1280;
    fireEvent.click(screen.getAllByText("nav-link")[0]);
    expect(setSidebarOpen).not.toHaveBeenCalled();
  });
});
