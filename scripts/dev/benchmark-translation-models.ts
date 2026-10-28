/**
 * Compares Vercel AI Gateway models on real EN -> FR translations of the admin
 * translations page, with the production prompt and output schema
 * (translateFieldsDetailed). Read-only on the database: nothing is saved.
 *
 * Usage: bun scripts/dev/benchmark-translation-models.ts [output.json]
 * Needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AI_GATEWAY_API_KEY.
 */
import { writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { translateFieldsDetailed } from "@/lib/services/aiTranslateService";
import {
  EDITABLE_FIELDS,
  FK_COLUMN_MAP,
  TRANSLATION_TABLE_MAP,
  type EntityType,
} from "@/types/admin-translations";

const MODELS = [
  "openai/gpt-5.4-nano",
  "mistral/mistral-large-3",
  "deepseek/deepseek-v3.1",
  "alibaba/qwen-3-235b",
  "openai/gpt-4.1-mini",
  "google/gemini-2.5-flash",
];

/** Games whose official French title differs from a literal translation. */
const TRICKY_GAME_SLUGS = [
  "ice-age-dawn-of-the-dinosaurs",
  "professor-layton-and-the-curious-village",
  "brain-age-train-your-brain-in-minutes-a-day",
  "the-legend-of-zelda-breath-of-the-wild",
  "the-witcher-3-wild-hunt",
  "red-dead-redemption-2",
];

interface Sample {
  entityType: EntityType;
  identifier: string;
  source: Record<string, string>;
  currentFr: Record<string, string> | null;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function nonEmpty(row: Record<string, unknown> | undefined, fields: string[]) {
  const out: Record<string, string> = {};
  for (const f of fields) {
    const v = row?.[f];
    if (typeof v === "string" && v.trim()) out[f] = v;
  }
  return out;
}

/** EN source + current FR row for the given entities of one type. */
async function loadSamples(
  entityType: EntityType,
  ids: { id: string; identifier: string }[]
): Promise<Sample[]> {
  const fk = FK_COLUMN_MAP[entityType];
  const fields = EDITABLE_FIELDS[entityType];
  const { data, error } = await supabase
    .from(TRANSLATION_TABLE_MAP[entityType])
    .select([fk, "language_code", ...fields].join(", "))
    .in(
      fk,
      ids.map((e) => e.id)
    );
  if (error) throw new Error(`${entityType}: ${error.message}`);

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  return ids.flatMap(({ id, identifier }) => {
    const en = rows.find((r) => r[fk] === id && r.language_code === "en");
    const fr = rows.find((r) => r[fk] === id && r.language_code === "fr");
    const source = nonEmpty(en, fields);
    if (Object.keys(source).length === 0) return [];
    const currentFr = nonEmpty(fr, fields);
    return [{ entityType, identifier, source, currentFr: Object.keys(currentFr).length ? currentFr : null }];
  });
}

async function pickEntities(table: string, idField: string, limit: number, order?: string, slugs?: string[]) {
  let query = supabase.from(table).select(`id, ${idField}`);
  if (slugs) query = query.in(idField, slugs);
  else if (order) query = query.order(order, { ascending: false, nullsFirst: false });
  const { data, error } = await query.limit(limit);
  if (error) throw new Error(`${table}: ${error.message}`);
  return ((data ?? []) as unknown as Record<string, string>[]).map((r) => ({
    id: r.id,
    identifier: r[idField],
  }));
}

async function collectSamples(): Promise<Sample[]> {
  const tricky = await pickEntities("games", "slug", 10, undefined, TRICKY_GAME_SLUGS);
  const popular = (await pickEntities("games", "slug", 12, "hybrid_popularity_score")).filter(
    (g) => !tricky.some((t) => t.id === g.id)
  );
  const games = await loadSamples("games", [...tricky, ...popular]);
  const characters = await loadSamples(
    "characters",
    await pickEntities("characters", "slug", 6, "view_count")
  );
  const platforms = await loadSamples("platforms", await pickEntities("platforms", "slug", 40));
  const genres = await loadSamples("genres", await pickEntities("genres", "slug", 20));

  return [
    ...games.slice(0, 8),
    ...characters.slice(0, 3),
    ...platforms.filter((p) => p.source.abbreviation).slice(0, 2),
    ...genres.filter((g) => g.source.description).slice(0, 2),
  ];
}

async function translateWithRetry(model: string, sample: Sample) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const started = Date.now();
    try {
      const result = await translateFieldsDetailed({
        model,
        sourceLang: "en",
        targetLang: "fr",
        entityType: sample.entityType,
        fields: sample.source,
      });
      return { ok: true as const, ms: Date.now() - started, ...result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const rateLimited = /429|rate limit/i.test(message);
      if (!rateLimited || attempt === 3) return { ok: false as const, ms: Date.now() - started, error: message };
      await new Promise((r) => setTimeout(r, 5_000 * attempt));
    }
  }
  throw new Error("unreachable");
}

async function main() {
  const outPath = process.argv[2] ?? "benchmark-translation-models.json";
  const samples = await collectSamples();
  console.log(`${samples.length} samples: ${samples.map((s) => `${s.entityType}:${s.identifier}`).join(", ")}`);

  const results: Record<string, unknown>[] = [];
  for (const model of MODELS) {
    for (const sample of samples) {
      const result = await translateWithRetry(model, sample);
      results.push({ model, entityType: sample.entityType, identifier: sample.identifier, ...result });
      console.log(`${model} ${sample.identifier}: ${result.ok ? `ok ${result.ms}ms $${result.costUsd}` : `FAIL ${result.error}`}`);
    }
  }

  writeFileSync(outPath, JSON.stringify({ models: MODELS, samples, results }, null, 2));
  console.log(`Wrote ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
