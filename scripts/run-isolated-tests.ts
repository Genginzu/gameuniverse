#!/usr/bin/env bun
/**
 * Script to run isolated tests sequentially.
 * These tests have mock conflicts and must run in separate processes.
 *
 * Usage:
 *   bun scripts/run-isolated-tests.ts [--verbose] [--bail]
 *
 * Options:
 *   --verbose  Show full test output
 *   --bail     Stop on first failure
 */

import { $ } from "bun";
import { readdirSync, statSync } from "fs";
import { join, relative } from "path";

interface TestResult {
  file: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  success: boolean;
  output?: string;
}

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
};

function color(text: string, colorCode: string): string {
  return `${colorCode}${text}${COLORS.reset}`;
}

function parseTestOutput(output: string): { passed: number; failed: number; skipped: number } {
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  const passMatch = output.match(/(\d+)\s+pass/);
  const failMatch = output.match(/(\d+)\s+fail/);
  const skipMatch = output.match(/(\d+)\s+skip/);

  if (passMatch) passed = parseInt(passMatch[1], 10);
  if (failMatch) failed = parseInt(failMatch[1], 10);
  if (skipMatch) skipped = parseInt(skipMatch[1], 10);

  return { passed, failed, skipped };
}

function findTestFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = readdirSync(currentDir);
    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith(".test.ts") || entry.endsWith(".test.tsx")) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

async function runTest(testFile: string, verbose: boolean): Promise<TestResult> {
  const startTime = Date.now();

  try {
    // Run each test file individually with preload
    const result = await $`bun test ${testFile} --preload ./test/setup.ts`.quiet();
    const output = result.stdout.toString() + result.stderr.toString();
    const { passed, failed, skipped } = parseTestOutput(output);
    const duration = Date.now() - startTime;

    return {
      file: testFile,
      passed,
      failed,
      skipped,
      duration,
      success: failed === 0,
      output: verbose ? output : undefined,
    };
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const errorOutput =
      error instanceof Error && "stdout" in error
        ? String((error as { stdout?: unknown }).stdout) +
          String((error as { stderr?: unknown }).stderr)
        : String(error);
    const { passed, failed, skipped } = parseTestOutput(errorOutput);

    return {
      file: testFile,
      passed,
      failed: failed || 1,
      skipped,
      duration,
      success: false,
      output: verbose ? errorOutput : undefined,
    };
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function printProgress(current: number, total: number, result: TestResult): void {
  const status = result.success ? color("✓", COLORS.green) : color("✗", COLORS.red);
  const progress = color(`[${current}/${total}]`, COLORS.dim);
  const duration = color(`(${formatDuration(result.duration)})`, COLORS.dim);
  const relPath = relative(process.cwd(), result.file);
  const stats = result.success
    ? color(`${result.passed} pass`, COLORS.green)
    : `${color(`${result.passed} pass`, COLORS.green)}, ${color(`${result.failed} fail`, COLORS.red)}`;

  console.log(`${status} ${progress} ${relPath} ${duration} - ${stats}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose") || args.includes("-v");
  const bail = args.includes("--bail") || args.includes("-b");

  console.log(color("\n🧪 Running Isolated Tests (Sequential)", COLORS.bold));
  console.log(color("━".repeat(60), COLORS.dim));
  console.log(color("These tests run one-by-one to avoid mock conflicts\n", COLORS.dim));

  const isolatedDir = join(process.cwd(), "test", "isolated");
  const testFiles = findTestFiles(isolatedDir);

  if (testFiles.length === 0) {
    console.log(color("No isolated test files found in test/isolated/", COLORS.yellow));
    process.exit(0);
  }

  console.log(color(`Found ${testFiles.length} isolated test files\n`, COLORS.dim));

  const results: TestResult[] = [];
  const startTime = Date.now();

  for (let i = 0; i < testFiles.length; i++) {
    const testFile = testFiles[i];
    const result = await runTest(testFile, verbose);
    results.push(result);
    printProgress(i + 1, testFiles.length, result);

    if (verbose && result.output) {
      console.log(color("─".repeat(40), COLORS.dim));
      console.log(result.output);
      console.log(color("─".repeat(40), COLORS.dim));
    }

    if (bail && !result.success) {
      console.log(color("\n⚠️  Bailing on first failure", COLORS.yellow));
      break;
    }
  }

  const totalDuration = Date.now() - startTime;
  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
  const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
  const filesSucceeded = results.filter((r) => r.success).length;
  const filesFailed = results.filter((r) => !r.success).length;

  console.log(color("\n" + "━".repeat(60), COLORS.dim));
  console.log(color("📊 Isolated Tests Summary", COLORS.bold));
  console.log(color("━".repeat(60), COLORS.dim));
  console.log(
    `   Files:  ${color(String(filesSucceeded), COLORS.green)} passed, ${filesFailed > 0 ? color(String(filesFailed), COLORS.red) : "0"} failed`
  );
  console.log(
    `   Tests:  ${color(String(totalPassed), COLORS.green)} passed, ${totalFailed > 0 ? color(String(totalFailed), COLORS.red) : "0"} failed${totalSkipped > 0 ? `, ${totalSkipped} skipped` : ""}`
  );
  console.log(`   Time:   ${formatDuration(totalDuration)}`);
  console.log(color("━".repeat(60), COLORS.dim));

  if (filesFailed > 0) {
    console.log(color("\n❌ Failed test files:", COLORS.red));
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   - ${relative(process.cwd(), r.file)}`);
      });
  }

  process.exit(totalFailed > 0 ? 1 : 0);
}

main();
