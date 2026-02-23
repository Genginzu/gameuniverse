import { useRef, useState } from "react";
import { useTheme } from "next-themes";
import { DashboardSidebarProps } from "@/types/components";
import SidebarContent from "./SidebarContent";

export default function DashboardSidebar({
  user,
  signOut,
  sidebarOpen,
  setSidebarOpen,
}: DashboardSidebarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const contentProps = {
    user,
    signOut,
    isUserMenuOpen,
    setIsUserMenuOpen,
    dropdownRef,
    onLinkClick: handleLinkClick,
    theme,
    setTheme,
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="glass-sidebar hidden h-full w-64 flex-shrink-0 flex-col lg:flex">
        <SidebarContent {...contentProps} />
      </div>

      {/* Mobile Sidebar */}
      <div
        id="mobile-sidebar"
        className={`glass-sidebar fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <SidebarContent {...contentProps} />
        </div>
      </div>
    </>
  );
}
