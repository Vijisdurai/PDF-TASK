# PowerShell script to run Vitest tests with proper cleanup

Write-Host "Clearing node_modules/.vitest cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.vitest") {
    Remove-Item -Recurse -Force "node_modules/.vitest"
    Write-Host "Cache cleared!" -ForegroundColor Green
} else {
    Write-Host "No cache found." -ForegroundColor Gray
}

Write-Host "`nRunning tests with single fork..." -ForegroundColor Yellow
npx vitest run --pool=forks --poolOptions.forks.singleFork=true

Write-Host "`nTest run complete!" -ForegroundColor Green
