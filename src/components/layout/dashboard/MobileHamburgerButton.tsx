"use client";

import { Icon } from "@iconify/react";

interface MobileHamburgerButtonProps {
  onClick: () => void;
}

export default function MobileHamburgerButton({ onClick }: MobileHamburgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed left-4 top-[10px] z-40 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-neon-primary/30 bg-black/40 text-gray-300 backdrop-blur-md transition-all duration-200 hover:text-white hover:shadow-[0_0_15px_rgb(var(--neon-primary)/0.4)] lg:hidden"
      aria-label="Open navigation menu"
    >
      <Icon icon="fa:bars" className="h-5 w-5" />
    </button>
  );
}
