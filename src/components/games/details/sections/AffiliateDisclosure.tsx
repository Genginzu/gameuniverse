"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";

/** Affiliate disclosure required by FTC / DGCCRF rules, shown under affiliated prices. */
export function AffiliateDisclosure() {
  const t = useTranslations("gameDetails.editorial.affiliate");

  return (
    <p className="text-editorial-muted mt-6 flex items-start gap-2 text-sm leading-relaxed">
      <Icon icon="lucide:info" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        {t("disclosure")}{" "}
        <Link
          href="/mentions-legales#affiliation"
          className="text-editorial-accent underline underline-offset-2 hover:no-underline"
        >
          {t("learnMore")}
        </Link>
      </span>
    </p>
  );
}
