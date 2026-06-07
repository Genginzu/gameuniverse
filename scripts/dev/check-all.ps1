# PowerShell script to run all development checks with Bun
# Usage: .\scripts\dev\check-all.ps1

Write-Host "🔍 Running ESLint..." -ForegroundColor Blue
bun run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ESLint failed" -ForegroundColor Red
    exit 1
}

Write-Host "✨ Checking Prettier formatting..." -ForegroundColor Blue
bun run format:check
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prettier check failed" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Running TypeScript type check..." -ForegroundColor Blue
bun run type-check
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript check failed" -ForegroundColor Red
    exit 1
}

Write-Host "🧪 Running tests..." -ForegroundColor Blue
bun run test:run
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tests failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All checks passed!" -ForegroundColor Green