"use client";

import { useTranslations } from "next-intl";

/**
 * Display name of a content author. A null author id means the account was
 * deleted and its content anonymised (issue #378): shown as "Deleted user".
 */
export function useAuthorDisplayName() {
  const t = useTranslations("accountDeletion");
  return (
    authorId: string | null | undefined,
    name: string | null | undefined,
    fallback: string
  ) => (authorId === null ? t("deletedUser") : name || fallback);
}
