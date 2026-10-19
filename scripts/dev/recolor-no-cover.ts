/**
 * Re-tints the "cover unavailable" placeholder (public/assets/no-cover.png) with the site
 * palette. A raster image cannot read CSS variables, so run this after a rebrand:
 *
 *   bun scripts/dev/recolor-no-cover.ts
 *
 * The tint keeps the image luminance and replaces its chroma with BRAND_COLORS.primary[500],
 * so it can be re-run on an already tinted file.
 */
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { BRAND_COLORS } from "../../src/lib/utils/brand-colors";

const PLACEHOLDER_PATH = "public/assets/no-cover.png";

async function recolorPlaceholder(): Promise<void> {
  const source = readFileSync(PLACEHOLDER_PATH);
  const tinted = await sharp(source)
    .tint(BRAND_COLORS.primary[500])
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(PLACEHOLDER_PATH, tinted);
  console.log(`Tinted ${PLACEHOLDER_PATH} with ${BRAND_COLORS.primary[500]}`);
}

await recolorPlaceholder();
