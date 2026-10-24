/**
 * Generates `src/app/favicon.ico` from the dynamic app icon (`src/app/apple-icon.tsx`).
 *
 * Browsers, bookmarks and crawlers request `/favicon.ico` directly, whatever the
 * `<link rel="icon">` says, and some keep a 404 cached per page. Next.js serves
 * `src/app/favicon.ico` statically and adds it to every page head.
 *
 * Requires the dev server (renders the icon through Next), then run after a rebrand:
 *
 *   bun scripts/dev/generate-favicon.ts [baseUrl]
 */
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const BASE_URL = process.argv[2] ?? "http://localhost:3000";
const OUTPUT_PATH = "src/app/favicon.ico";
const SIZES = [16, 32, 48];

const ICO_HEADER_BYTES = 6;
const ICO_ENTRY_BYTES = 16;

async function fetchSourceIcon(): Promise<Buffer> {
  const response = await fetch(`${BASE_URL}/apple-icon`);
  if (!response.ok) throw new Error(`GET /apple-icon failed: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

/** ICO container holding PNG-encoded images (supported by every current browser). */
function encodeIco(images: Array<{ size: number; png: Buffer }>): Buffer {
  const header = Buffer.alloc(ICO_HEADER_BYTES);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = ICO_HEADER_BYTES + ICO_ENTRY_BYTES * images.length;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(ICO_ENTRY_BYTES);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}

async function generateFavicon(): Promise<void> {
  const source = await fetchSourceIcon();
  const images = await Promise.all(
    SIZES.map(async (size) => ({
      size,
      png: await sharp(source).resize(size, size).png({ compressionLevel: 9 }).toBuffer(),
    }))
  );
  writeFileSync(OUTPUT_PATH, encodeIco(images));
  console.log(`Wrote ${OUTPUT_PATH} (${SIZES.join(", ")} px)`);
}

await generateFavicon();
