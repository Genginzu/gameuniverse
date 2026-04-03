/**
 * Admin API: Compute diff between a webhook event payload and local DB data.
 * GET /api/admin/webhooks/events/[eventId]/diff
 */

import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";
import type { DiffField, DiffFieldStatus, WebhookDiffResult } from "@/types/webhook-diff";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

/** Mapping of IGDB webhook payload fields to local games table columns */
const FIELD_MAP: Array<{
  field: string;
  label: string;
  fromPayload: (p: Record<string, unknown>) => unknown;
  fromGame: (g: Record<string, unknown>) => unknown;
  overrideField?: string;
}> = [
  {
    field: "name",
    label: "fields.name",
    fromPayload: (p) => p.name,
    fromGame: (g) => g.title_en,
    overrideField: "translations",
  },
  {
    field: "summary",
    label: "fields.summary",
    fromPayload: (p) => p.summary ?? null,
    fromGame: (g) => g.description_en ?? null,
    overrideField: "translations",
  },
  {
    field: "slug",
    label: "fields.slug",
    fromPayload: (p) => p.slug,
    fromGame: (g) => g.slug,
  },
  {
    field: "release_date",
    label: "fields.releaseDate",
    fromPayload: (p) => {
      if (!p.first_release_date) return null;
      return new Date((p.first_release_date as number) * 1000).toISOString().split("T")[0];
    },
    fromGame: (g) => {
      if (!g.release_date) return null;
      const d = g.release_date as string;
      return d.length > 10 ? d.split("T")[0] : d;
    },
  },
  {
    field: "metascore",
    label: "fields.metascore",
    fromPayload: (p) => (p.aggregated_rating ? Math.round(p.aggregated_rating as number) : null),
    fromGame: (g) => g.metascore ?? null,
  },
  {
    field: "cover_image",
    label: "fields.coverImage",
    fromPayload: (p) => {
      const cover = p.cover as { image_id?: string } | undefined;
      if (!cover?.image_id) return null;
      return `https://images.igdb.com/igdb/image/upload/t_cover_big/${cover.image_id}.jpg`;
    },
    fromGame: (g) => g.cover_image_url ?? null,
    overrideField: "cover_image",
  },
];

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { eventId } = await params;

    const supabase = await createRouteHandlerClient();

    // Fetch the webhook event
    const { data: event, error: eventError } = await supabase
      .from("igdb_webhook_events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.event_type !== "update") {
      return NextResponse.json(
        { error: "Diff is only available for update events" },
        { status: 400 }
      );
    }

    if (!event.game_id) {
      return NextResponse.json({ error: "No local game linked to this event" }, { status: 400 });
    }

    // Fetch local game data with EN translation
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*, game_translations(title, description, language_code)")
      .eq("id", event.game_id)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Flatten EN translation into game object for comparison
    const translations = (game.game_translations ?? []) as Array<{
      title: string;
      description: string | null;
      language_code: string;
    }>;
    const enTranslation = translations.find((t) => t.language_code === "en");
    const gameFlat = {
      ...game,
      title_en: enTranslation?.title ?? null,
      description_en: enTranslation?.description ?? null,
    };

    // Fetch admin overrides for this game
    const { data: overrides } = await supabase
      .from("game_field_overrides")
      .select("field_name")
      .eq("game_id", event.game_id);

    const overrideSet = new Set((overrides ?? []).map((o) => o.field_name as string));

    // Compute diff
    const payload = event.payload as Record<string, unknown>;
    const gameName = enTranslation?.title ?? (game.slug as string) ?? "Unknown";

    const fields: DiffField[] = FIELD_MAP.map((mapping) => {
      const igdbValue = mapping.fromPayload(payload);
      const localValue = mapping.fromGame(gameFlat);
      const hasOverride = mapping.overrideField ? overrideSet.has(mapping.overrideField) : false;

      const valuesEqual = JSON.stringify(igdbValue) === JSON.stringify(localValue);

      let status: DiffFieldStatus = "unchanged";
      if (!valuesEqual) {
        status = hasOverride ? "conflict" : "changed";
      }

      return {
        field: mapping.field,
        label: mapping.label,
        igdbValue,
        localValue,
        status,
        hasOverride,
      };
    });

    const changedCount = fields.filter((f) => f.status !== "unchanged").length;
    const conflictCount = fields.filter((f) => f.status === "conflict").length;

    const result: WebhookDiffResult = {
      eventId,
      gameId: event.game_id as string,
      gameName,
      igdbId: event.igdb_id as number,
      fields,
      changedCount,
      conflictCount,
    };

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    logger.error("Webhook diff error", { error });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
