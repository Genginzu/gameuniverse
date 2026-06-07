#!/bin/bash
# Bash script to run all development checks with Bun
# Usage: ./scripts/dev/check-all.sh

set -e

echo "🔍 Running ESLint..."
bun run lint

echo "✨ Checking Prettier formatting..."
bun run format:check

echo "🔧 Running TypeScript type check..."
bun run type-check

echo "🧪 Running tests..."
bun run test:run

echo "✅ All checks passed!"