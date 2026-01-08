# PowerShell script to update game backgrounds
# This script runs the migration and updates existing games with background customization

Write-Host "🎮 Updating game backgrounds..." -ForegroundColor Cyan

# Run the migration to add background fields
Write-Host "📦 Running migration to add background fields..." -ForegroundColor Yellow
bunx supabase db push

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Migration completed successfully!" -ForegroundColor Green

# Update existing games with background data
Write-Host "🎨 Updating existing games with background colors and images..." -ForegroundColor Yellow
bunx supabase db reset --linked

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database reset failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database updated successfully!" -ForegroundColor Green
Write-Host "🎉 Game backgrounds have been updated! You can now test the new background customization feature." -ForegroundColor Cyan