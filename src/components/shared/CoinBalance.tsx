"use client";

import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";

export function CoinBalance() {
  const { user } = useAuth();
  const { wallet, isLoading } = useWallet();

  if (!user || isLoading || !wallet) return null;

  return (
    <Link
      href="/coins"
      className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-sm font-medium text-amber-300 backdrop-blur-xs transition-all hover:bg-white/15"
    >
      <Icon icon="mdi:circle-multiple" className="size-4 text-amber-400" />
      <span>{wallet.balance.toLocaleString()}</span>
    </Link>
  );
}
