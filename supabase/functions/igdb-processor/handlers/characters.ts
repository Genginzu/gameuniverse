/**
 * Handler for character webhook events.
 *
 * The current product treats character events as audit-only: we log
 * them but don't auto-import or sync. Admins handle character data
 * via dedicated bulk-import jobs.
 */

import { logger } from "../../_shared/logger.ts";
import type { WebhookEventType } from "../../_shared/igdb-types.ts";
import { updateEventStatus } from "../lib/event-status.ts";

export interface HandleCharactersInput {
  eventId: string;
  eventType: WebhookEventType;
  igdbId: number;
}

export async function handleCharacters(input: HandleCharactersInput): Promise<void> {
  logger.info("Webhook: character event logged", { ...input });
  await updateEventStatus(input.eventId, "processed");
}
