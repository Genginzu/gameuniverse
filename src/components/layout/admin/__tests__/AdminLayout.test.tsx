import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdminLayout } from "../AdminLayout";

const state = vi.hoisted(() => ({
  auth: { user: null as { id: string } | null, loading: false, signOut: vi.fn() },
  admin: {
    user: null as { id: string; role: string } | null,
    loading: false,
    canRead: false,
  },
  push: vi.fn(),
}));

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push: state.push }) }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => state.auth }));
vi.mock("@/hooks/useAdminAuth", () => ({ useAdminAuth: () => state.admin }));
vi.mock("../AdminSidebar", () => ({
  default: ({ user, sidebarOpen }: { user: { role: string }; sidebarOpen: boolean }) => (
    <nav id="admin-mobile-sidebar" data-open={String(sidebarOpen)}>
      sidebar:{user.role}
    </nav>
  ),
}));
vi.mock("@/components/shared/LanguageSwitcher", () => ({ LanguageSwitcher: () => null }));
vi.mock("@/components/shared/Footer", () => ({ default: () => null }));

function renderLayout() {
  return render(
    <AdminLayout>
      <p>admin-content</p>
    </AdminLayout>
  );
}

describe("AdminLayout", () => {
  beforeEach(() => {
    state.push.mockReset();
    state.auth = { user: { id: "user-1" }, loading: false, signOut: vi.fn() };
    state.admin = { user: { id: "user-1", role: "admin" }, loading: false, canRead: true };
  });

  it("shows the loader while either auth source is loading", () => {
    state.admin.loading = true;
    renderLayout();
    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(screen.queryByText("admin-content")).not.toBeInTheDocument();
    expect(state.push).not.toHaveBeenCalled();
  });

  it("redirects anonymous visitors to sign in and renders nothing", () => {
    state.auth.user = null;
    const { container } = renderLayout();
    expect(state.push).toHaveBeenCalledWith("/auth?mode=signin");
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a 403 for users without read permission, with a way back to the profile", () => {
    state.admin.canRead = false;
    renderLayout();
    expect(screen.getByText("403")).toBeInTheDocument();
    expect(screen.queryByText("admin-content")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "backToDashboard" }));
    expect(state.push).toHaveBeenCalledWith("/profile");
  });

  it("renders the sidebar and content for authorized users", () => {
    state.admin.user = { id: "user-1", role: "contributor" };
    renderLayout();
    expect(screen.getByText("admin-content")).toBeInTheDocument();
    expect(screen.getByText("sidebar:contributor")).toBeInTheDocument();
  });

  it("locks page scroll while mounted and restores it on unmount", () => {
    const { unmount } = renderLayout();
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("toggles the mobile sidebar from its button", () => {
    renderLayout();
    const sidebar = () => screen.getByText("sidebar:admin");
    expect(sidebar()).toHaveAttribute("data-open", "false");

    fireEvent.click(screen.getByRole("button", { name: "openSidebar" }));
    expect(sidebar()).toHaveAttribute("data-open", "true");

    fireEvent.click(screen.getByRole("button", { name: "closeSidebar" }));
    expect(sidebar()).toHaveAttribute("data-open", "false");
  });
});
