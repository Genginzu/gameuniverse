"use client";

import { useTranslations } from "next-intl";
import { useFormField } from "@/components/ui/form";

const KNOWN_ERRORS = new Set(["invalidTemplate", "networkRequired", "templateRequired"]);

/** Translates Zod error codes of the store affiliate schema into localized messages. */
export function StoreAffiliateFieldError() {
  const t = useTranslations("admin.stores.errors");
  const { error, formMessageId } = useFormField();
  if (!error?.message) return null;
  const key = KNOWN_ERRORS.has(error.message) ? error.message : "invalid";
  return (
    <p id={formMessageId} className="text-destructive text-sm font-medium">
      {t(key)}
    </p>
  );
}
