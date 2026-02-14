#!/usr/bin/env bun
/**
 * Run all tests: parallel tests first, then isolated tests sequentially.
 *
 * Usage:
 *   bun scripts/run-all-tests.ts [--coverage] [--verbose]
 */

import { readdirSync, statSync } from "fs";
import { join, relative } from "path";

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

function parseTestOutput(output: string): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;
  const passMatch = output.match(/(\d+)\s+pass/);
  const failMatch = output.match(/(\d+)\s+fail/);
  if (passMatch) passed = parseInt(passMatch[1], 10);
  if (failMatch) failed = parseInt(failMatch[1], 10);
  return { passed, failed };
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

async function runParallelTests(
  coverage: boolean,
  verbose: boolean
): Promise<{ passed: number; failed: number; success: boolean; failureOutput: string }> {
  console.log(color("\n🚀 Phase 1: Running Parallel Tests", COLORS.bold));
  console.log(color("━".repeat(60), COLORS.dim));

  const cmd = coverage
    ? "bun test test/unit test/integration test/scripts test/setup.test.ts --coverage"
    : "bun test test/unit test/integration test/scripts test/setup.test.ts";

  const proc = Bun.spawn(cmd.split(" "), {
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const output = stdout + stderr;

  if (verbose) {
    console.log(output);
  }

  const { passed, failed } = parseTestOutput(output);

  // Extract coverage table and summary lines from output
  const lines = output.split("\n");
  const summaryLines: string[] = [];
  let failureOutput = "";

  // Extract coverage table: everything between first and last separator lines (---...|...)
  let inCoverageTable = false;
  for (const line of lines) {
    // Detect separator lines like "---|---------|---------|---"
    const isSeparator = /^-+\s*\|/.test(line);
    if (isSeparator && !inCoverageTable) {
      inCoverageTable = true;
    }
    if (inCoverageTable) {
      summaryLines.push(line);
      // End after the closing separator (3rd separator line)
      if (isSeparator && summaryLines.filter((l) => /^-+\s*\|/.test(l)).length >= 3) {
        inCoverageTable = false;
      }
    }
    // Also capture the "Ran X tests across Y files" line
    if (/Ran \d+ tests across/.test(line)) {
      summaryLines.push(line);
    }
  }

  // Extract failure details when not verbose
  if (failed > 0 && !verbose) {
    const failureLines: string[] = [];
    let capturing = false;
    for (const line of lines) {
      if (
        line.includes("✗") ||
        line.includes("Error") ||
        line.includes("expected") ||
        line.includes("AssertionError") ||
        line.includes("TypeError") ||
        line.includes("ReferenceError")
      ) {
        capturing = true;
      }
      if (capturing) {
        failureLines.push(line);
        if (line.trim() === "" && failureLines.length > 1) {
          capturing = false;
        }
      }
    }
    failureOutput = failureLines.join("\n");
  }

  // Show coverage table if present
  if (!verbose && summaryLines.length > 0) {
    console.log(summaryLines.join("\n"));
  }

  console.log(
    `  ${color(String(passed), COLORS.green)} pass, ${failed > 0 ? color(String(failed), COLORS.red) + " fail" : "0 fail"}`
  );

  return { passed, failed, success: failed === 0, failureOutput };
}

async function runIsolatedTests(
  verbose: boolean
): Promise<{ passed: number; failed: number; success: boolean }> {
  console.log(color("\n🔒 Phase 2: Running Isolated Tests (Sequential)", COLORS.bold));
  console.log(color("━".repeat(60), COLORS.dim));

  const isolatedDir = join(process.cwd(), "test", "isolated");
  const testFiles = findTestFiles(isolatedDir);

  if (testFiles.length === 0) {
    console.log(color("No isolated test files found", COLORS.yellow));
    return { passed: 0, failed: 0, success: true };
  }

  console.log(color(`Found ${testFiles.length} isolated test files\n`, COLORS.dim));

  let totalPassed = 0;
  let totalFailed = 0;

  for (let i = 0; i < testFiles.length; i++) {
    const testFile = testFiles[i];
    const relPath = relative(process.cwd(), testFile);

    const proc = Bun.spawn(["bun", "test", testFile, "--preload", "./test/setup.ts"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const output = stdout + stderr;
    const { passed, failed } = parseTestOutput(output);

    totalPassed += passed;
    totalFailed += failed;

    const status = failed === 0 ? color("✓", COLORS.green) : color("✗", COLORS.red);
    const stats =
      failed === 0
        ? color(`${passed} pass`, COLORS.green)
        : `${color(`${passed} pass`, COLORS.green)}, ${color(`${failed} fail`, COLORS.red)}`;

    console.log(`${status} [${i + 1}/${testFiles.length}] ${relPath} - ${stats}`);

    if (verbose && failed > 0) {
      console.log(output);
    }
  }

  return { passed: totalPassed, failed: totalFailed, success: totalFailed === 0 };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const coverage = args.includes("--coverage");
  const verbose = args.includes("--verbose") || args.includes("-v");

  console.log(color("\n" + "═".repeat(60), COLORS.cyan));
  console.log(color("  🧪 Running All Tests", COLORS.bold));
  console.log(color("═".repeat(60), COLORS.cyan));

  const startTime = Date.now();

  const parallel = await runParallelTests(coverage, verbose);
  const isolated = await runIsolatedTests(verbose);

  const totalDuration = Date.now() - startTime;
  const totalPassed = parallel.passed + isolated.passed;
  const totalFailed = parallel.failed + isolated.failed;
  const allSuccess = parallel.success && isolated.success;

  console.log(color("\n" + "═".repeat(60), COLORS.cyan));
  console.log(color("  📊 Final Summary", COLORS.bold));
  console.log(color("═".repeat(60), COLORS.cyan));
  console.log(
    `  Parallel:  ${color(String(parallel.passed), COLORS.green)} pass, ${parallel.failed > 0 ? color(String(parallel.failed), COLORS.red) : "0"} fail`
  );
  console.log(
    `  Isolated:  ${color(String(isolated.passed), COLORS.green)} pass, ${isolated.failed > 0 ? color(String(isolated.failed), COLORS.red) : "0"} fail`
  );
  console.log(color("  " + "─".repeat(58), COLORS.dim));
  console.log(
    `  Total:     ${color(String(totalPassed), COLORS.green)} pass, ${totalFailed > 0 ? color(String(totalFailed), COLORS.red) : "0"} fail`
  );
  console.log(`  Time:      ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(color("═".repeat(60), COLORS.cyan));

  // Show failure details if any (and not already shown in verbose mode)
  if (!verbose && parallel.failureOutput) {
    console.log(color("\n📋 Parallel Test Failures:", COLORS.red));
    console.log(parallel.failureOutput);
  }

  if (allSuccess) {
    console.log(color("\n✅ All tests passed!\n", COLORS.green));
  } else {
    console.log(color("\n❌ Some tests failed\n", COLORS.red));
  }

  process.exit(allSuccess ? 0 : 1);
}

main();
