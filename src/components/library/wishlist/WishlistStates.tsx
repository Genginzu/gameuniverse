"use client";

/** Empty states of `/library/wishlist`: signed-out visitor and empty wishlist. */

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

interface WishlistStateProps {
  icon: string;
  title: string;
  description: string;
  action: { href: string; icon: string; label: string };
}

function WishlistState({ icon, title, description, action }: WishlistStateProps) {
  return (
    <div className="border-editorial-line bg-editorial-2 flex flex-col items-center gap-5 rounded-3xl border px-6 py-12 text-center sm:px-8 sm:py-16">
      <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
        <Icon icon={icon} className="h-7 w-7" aria-hidden />
      </div>
      <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
      <p className="text-editorial-muted max-w-[50ch]">{description}</p>
      <Button asChild className="w-full sm:w-auto">
        <Link href={action.href}>
          <Icon icon={action.icon} className="mr-2 h-4 w-4" aria-hidden />
          {action.label}
        </Link>
      </Button>
    </div>
  );
}

export function WishlistAuthRequired() {
  const t = useTranslations("userLibrary.wishlist.authRequired");
  return (
    <WishlistState
      icon="lucide:lock"
      title={t("title")}
      description={t("description")}
      action={{ href: "/auth", icon: "lucide:log-in", label: t("signIn") }}
    />
  );
}

export function WishlistEmptyState() {
  const t = useTranslations("userLibrary.wishlist.empty");
  return (
    <WishlistState
      icon="lucide:star"
      title={t("title")}
      description={t("description")}
      action={{ href: "/games", icon: "lucide:search", label: t("exploreGames") }}
    />
  );
}
