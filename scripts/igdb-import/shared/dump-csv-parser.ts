/**
 * CSV Parser for IGDB Data Dumps.
 *
 * IGDB CSV format specifics:
 * - Standard comma-separated values
 * - Strings are quoted with double quotes
 * - Arrays use curly braces: {1,2,3} or {"str1","str2"}
 * - Timestamps are in "YYYY-MM-DD HH:MM:SS" format
 * - Empty fields = null
 */

import { readFile } from "fs/promises";

/** Parse a single CSV file into an array of row objects */
export async function parseCsvFile<T extends Record<string, unknown>>(
  filePath: string
): Promise<T[]> {
  const raw = await readFile(filePath, "utf-8");
  const records = splitCsvRecords(raw);

  if (records.length < 2) return []; // header only or empty

  const headers = parseIGDBCsvLine(records[0]);
  const rows: T[] = [];

  for (let i = 1; i < records.length; i++) {
    const values = parseIGDBCsvLine(records[i]);
    if (values.length !== headers.length) continue; // skip malformed rows

    const row: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = parseValue(values[j]);
    }
    rows.push(row as T);
  }

  return rows;
}

/**
 * Split CSV content into records (lines), respecting quoted fields
 * that may contain newlines.
 */
function splitCsvRecords(content: string): string[] {
  const records: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < content.length && content[i + 1] === '"') {
          current += '""';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
          current += char;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
      current += char;
    } else if (char === "\n" || char === "\r") {
      // Skip \r in \r\n
      if (char === "\r" && i + 1 < content.length && content[i + 1] === "\n") {
        i++;
      }
      if (current.trim().length > 0) {
        records.push(current);
      }
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim().length > 0) {
    records.push(current);
  }

  return records;
}

/** Build a lookup Map from a CSV file, keyed by the `id` field */
export async function buildLookupMap<T extends Record<string, unknown>>(
  filePath: string
): Promise<Map<number, T>> {
  const rows = await parseCsvFile<T>(filePath);
  const map = new Map<number, T>();
  for (const row of rows) {
    const id = Number(row.id);
    if (!isNaN(id)) map.set(id, row);
  }
  return map;
}

/** Build a multi-value lookup Map (one key → many rows) */
export async function buildMultiLookupMap<T extends Record<string, unknown>>(
  filePath: string,
  keyField: string
): Promise<Map<number, T[]>> {
  const rows = await parseCsvFile<T>(filePath);
  const map = new Map<number, T[]>();
  for (const row of rows) {
    const key = Number(row[keyField]);
    if (isNaN(key)) continue;
    const existing = map.get(key) ?? [];
    existing.push(row);
    map.set(key, existing);
  }
  return map;
}

/**
 * Parse an IGDB CSV line respecting:
 * - Quoted strings (double quotes, with "" escape)
 * - Curly-brace arrays: {1,2,3} or {"a","b"}
 * - Regular comma separators
 */
function parseIGDBCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  let inBraces = 0; // nesting depth for {}

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === "{") {
      inBraces++;
      current += char;
    } else if (char === "}") {
      inBraces = Math.max(0, inBraces - 1);
      current += char;
    } else if (char === "," && inBraces === 0) {
      // Field separator (only when not inside braces)
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Parse a CSV cell value into the appropriate JS type.
 * - Empty / "null" → null
 * - {1,2,3} → number array
 * - {"a","b"} → string array
 * - Numeric string → number
 * - Otherwise → string
 */
function parseValue(value: string): unknown {
  if (value === "" || value === "null") return null;

  // Curly-brace arrays: {1,2,3} or {"str1","str2"}
  if (value.startsWith("{") && value.endsWith("}")) {
    return parseBraceArray(value.slice(1, -1));
  }

  // Try numeric
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== "") return num;

  return value;
}

/** Parse the inner content of a {…} array */
function parseBraceArray(inner: string): unknown[] {
  if (inner === "") return [];

  // Split by comma, respecting quoted strings inside the array
  const items: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of inner) {
    if (inQuotes) {
      if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      items.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  items.push(current.trim());

  // Determine type: all numeric → number[], otherwise string[]
  if (items.every((item) => item !== "" && !isNaN(Number(item)))) {
    return items.map(Number);
  }
  return items;
}
