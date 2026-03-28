/**
 * IGDB Data Dump Downloader.
 *
 * Downloads CSV data dumps from the IGDB API (/v4/dumps endpoint).
 * Each endpoint (games, genres, platforms…) has a daily-updated CSV dump.
 * The API returns a presigned S3 URL valid for 5 minutes.
 */

import { IGDBService } from "../../../src/lib/services/igdbService";
import { existsSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import { writeFile } from "fs/promises";
import { join } from "path";

const IGDB_API_URL = "https://api.igdb.com/v4";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface DumpInfo {
  endpoint: string;
  file_name: string;
  updated_at: number;
}

export interface DumpDownloadInfo {
  s3_url: string;
  endpoint: string;
  file_name: string;
  size_bytes: number;
  updated_at: number;
  schema_version: string;
  schema: Record<string, string>;
}

/** Fetch the list of available dumps from IGDB */
export async function listAvailableDumps(verbose: boolean): Promise<DumpInfo[]> {
  const accessToken = await IGDBService.getAccessToken();
  const clientId = process.env.IGDB_CLIENT_ID!;

  const response = await fetch(`${IGDB_API_URL}/dumps`, {
    method: "GET",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to list dumps: ${response.status} - ${text}`);
  }

  const dumps = (await response.json()) as DumpInfo[];
  if (verbose) {
    console.log(`[DumpDownloader] ${dumps.length} dumps available`);
  }
  return dumps;
}

/** Get the S3 download URL for a specific endpoint dump */
export async function getDumpDownloadUrl(
  endpoint: string,
  verbose: boolean
): Promise<DumpDownloadInfo> {
  const accessToken = await IGDBService.getAccessToken();
  const clientId = process.env.IGDB_CLIENT_ID!;

  const response = await fetch(`${IGDB_API_URL}/dumps/${endpoint}`, {
    method: "GET",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get dump for "${endpoint}": ${response.status} - ${text}`);
  }

  const info = (await response.json()) as DumpDownloadInfo;
  if (verbose) {
    const sizeMb = (info.size_bytes / 1024 / 1024).toFixed(1);
    console.log(`[DumpDownloader] ${endpoint}: ${sizeMb} MB (${info.file_name})`);
  }
  return info;
}

/**
 * Download a CSV dump from S3 and save it with a date suffix.
 * If a recent file (< 30 days) already exists, reuse it.
 * Old files for the same endpoint are deleted.
 * Returns the local file path.
 */
export async function downloadDumpCsv(
  endpoint: string,
  dumpsDir: string,
  verbose: boolean
): Promise<string> {
  if (!existsSync(dumpsDir)) {
    mkdirSync(dumpsDir, { recursive: true });
  }

  // Check for existing cached file
  const existing = findExistingDump(endpoint, dumpsDir);
  if (existing) {
    if (verbose) {
      console.log(
        `[DumpDownloader] Using cached ${existing.fileName} (${existing.ageInDays}d old)`
      );
    }
    return existing.path;
  }

  // Download fresh dump
  const info = await getDumpDownloadUrl(endpoint, verbose);
  const today = new Date().toISOString().split("T")[0];
  const fileName = `${endpoint}_${today}.csv`;
  const localPath = join(dumpsDir, fileName);

  if (verbose) {
    console.log(`[DumpDownloader] Downloading ${endpoint} → ${fileName}...`);
  }

  const response = await fetch(info.s3_url);
  if (!response.ok) {
    throw new Error(`Failed to download ${endpoint} CSV: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(localPath, buffer);

  // Clean up old files for this endpoint
  cleanOldDumps(endpoint, dumpsDir, fileName, verbose);

  if (verbose) {
    const sizeMb = (buffer.length / 1024 / 1024).toFixed(1);
    console.log(`[DumpDownloader] Downloaded ${endpoint}: ${sizeMb} MB`);
  }

  return localPath;
}

/**
 * Find an existing dump file for an endpoint that is less than 30 days old.
 * Files are named: {endpoint}_{YYYY-MM-DD}.csv
 */
function findExistingDump(
  endpoint: string,
  dumpsDir: string
): { path: string; fileName: string; ageInDays: number } | null {
  if (!existsSync(dumpsDir)) return null;

  const prefix = `${endpoint}_`;
  const files = readdirSync(dumpsDir).filter((f) => f.startsWith(prefix) && f.endsWith(".csv"));

  for (const fileName of files) {
    // Extract date from filename: endpoint_YYYY-MM-DD.csv
    const dateStr = fileName.slice(prefix.length, -4); // remove prefix and .csv
    const fileDate = new Date(dateStr);
    if (isNaN(fileDate.getTime())) continue;

    const ageMs = Date.now() - fileDate.getTime();
    if (ageMs < MAX_AGE_MS) {
      return {
        path: join(dumpsDir, fileName),
        fileName,
        ageInDays: Math.floor(ageMs / (24 * 60 * 60 * 1000)),
      };
    }
  }

  return null;
}

/** Delete old dump files for an endpoint, keeping only the current one */
function cleanOldDumps(
  endpoint: string,
  dumpsDir: string,
  keepFileName: string,
  verbose: boolean
): void {
  const prefix = `${endpoint}_`;
  const files = readdirSync(dumpsDir).filter(
    (f) => f.startsWith(prefix) && f.endsWith(".csv") && f !== keepFileName
  );

  for (const oldFile of files) {
    try {
      unlinkSync(join(dumpsDir, oldFile));
      if (verbose) console.log(`[DumpDownloader] Deleted old dump: ${oldFile}`);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Download all CSV dumps needed for game import.
 * Returns a map of endpoint → local file path.
 */
export async function downloadGameDumps(
  dumpsDir: string,
  verbose: boolean
): Promise<Map<string, string>> {
  const endpoints = [
    "games",
    "covers",
    "screenshots",
    "artworks",
    "genres",
    "involved_companies",
    "companies",
    "platforms",
    "game_videos",
    "age_ratings",
    "language_supports",
    "languages",
    "language_support_types",
  ];

  console.log(`[DumpDownloader] Downloading ${endpoints.length} game-related dumps...`);
  const paths = new Map<string, string>();

  for (const endpoint of endpoints) {
    try {
      const path = await downloadDumpCsv(endpoint, dumpsDir, verbose);
      paths.set(endpoint, path);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[DumpDownloader] Skipping ${endpoint}: ${msg}`);
    }
  }

  console.log(`[DumpDownloader] Downloaded ${paths.size}/${endpoints.length} dumps`);
  return paths;
}

/**
 * Download all CSV dumps needed for character import.
 * Returns a map of endpoint → local file path.
 */
export async function downloadCharacterDumps(
  dumpsDir: string,
  verbose: boolean
): Promise<Map<string, string>> {
  const endpoints = ["characters", "character_mug_shots", "genders", "species"];

  console.log(`[DumpDownloader] Downloading ${endpoints.length} character-related dumps...`);
  const paths = new Map<string, string>();

  for (const endpoint of endpoints) {
    try {
      const path = await downloadDumpCsv(endpoint, dumpsDir, verbose);
      paths.set(endpoint, path);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[DumpDownloader] Skipping ${endpoint}: ${msg}`);
    }
  }

  console.log(`[DumpDownloader] Downloaded ${paths.size}/${endpoints.length} dumps`);
  return paths;
}
