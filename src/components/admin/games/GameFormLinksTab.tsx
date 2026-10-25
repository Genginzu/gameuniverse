"use client";

/** "Links" tab of the admin game form: IGDB websites (official site, stores, communities). */

import type { GameFormTabProps } from "@/types/admin-games";
import { WebsitesEditor } from "./metadata/WebsitesEditor";

export function GameFormLinksTab({ form, isIgdbField }: GameFormTabProps) {
  return <WebsitesEditor form={form} isIgdbField={isIgdbField} />;
}
