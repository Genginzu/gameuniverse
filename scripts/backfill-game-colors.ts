/**
 * Backfill game colors from cover images.
 *
 * Finds all games that have a cover image but no accent_color set,
 * extracts colors from the cover using colorthief, and updates the DB.
 *
 * Usage:
 *   bun scripts/backfill-game-colors.ts [--verbose] [--dry-run] [--force]
 *
 * Options:
 *   --verbose   Show detailed logs
 *   --dry-run   Don't write to DB, just show what would be updated
 *   --force     Re-extract colors even if already set
 */

import { createScriptClient } from "./igdb-import/supabase-client";
import { extractColorsFromCover } from "../src/lib/utils/color-extraction";

const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");

async function backfillColors() {
  const supabase = createScriptClient();

  // Fetch games with a cover but missing colors
  let query = supabase
    .from("games")
    .select("id, slug, cover_image_url, accent_color")
    .not("cover_image_url", "is", null);

  if (!force) {
    query = query.is("accent_color", null);
  }

  const { data: games, error } = await query;

  if (error) {
    console.error("Failed to fetch games:", error.message);
    process.exit(1);
  }

  if (!games || games.length === 0) {
    console.log("No games to update.");
    return;
  }

  console.log(`Found ${games.length} game(s) to process${dryRun ? " (dry run)" : ""}...`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const game of games) {
    if (!game.cover_image_url) {
      skipped++;
      continue;
    }

    if (verbose) {
      console.log(`\nProcessing: ${game.slug}`);
    }

    const colors = await extractColorsFromCover(game.cover_image_url, verbose);

    if (!colors) {
      console.log(`  ⚠ ${game.slug}: color extraction failed`);
      failed++;
      continue;
    }

    if (verbose || dryRun) {
      console.log(`  ${game.slug}:`);
      console.log(`    background: ${colors.background_color}`);
      console.log(`    accent:     ${colors.accent_color}`);
      console.log(`    label:      ${colors.label_color}`);
      console.log(`    text:       ${colors.text_color}`);
    }

    if (!dryRun) {
      const { error: updateError } = await supabase
        .from("games")
        .update({
          background_color: colors.background_color,
          accent_color: colors.accent_color,
          label_color: colors.label_color,
          text_color: colors.text_color,
        })
        .eq("id", game.id);

      if (updateError) {
        console.log(`  ✗ ${game.slug}: update failed — ${updateError.message}`);
        failed++;
        continue;
      }
    }

    console.log(`  ✓ ${game.slug}`);
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped, ${failed} failed`);
}

backfillColors().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
