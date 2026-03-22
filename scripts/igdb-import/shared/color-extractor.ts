/**
 * Color Extractor for IGDB Game Import (script version)
 *
 * Re-exports the shared color extraction utility.
 * The actual logic lives in src/lib/utils/color-extraction.ts
 * to be shared between the import script and the GameImportService.
 */

export {
  extractColorsFromCover,
  type ExtractedGameColors,
} from "../../../src/lib/utils/color-extraction";
