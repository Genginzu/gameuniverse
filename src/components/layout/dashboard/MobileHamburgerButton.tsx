"use client";

import { FaBars } from "react-icons/fa";

interface MobileHamburgerButtonProps {
  onClick: () => void;
}

export default function MobileHamburgerButton({ onClick }: MobileHamburgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed left-4 top-4 z-40 rounded-xl border border-neon-violet/30 bg-black/40 p-2.5 text-gray-300 backdrop-blur-md transition-all duration-200 hover:text-white hover:shadow-[0_0_15px_rgb(var(--neon-violet)/0.4)] lg:hidden"
      aria-label="Open navigation menu"
    >
      <FaBars className="h-5 w-5" />
    </button>
  );
}
