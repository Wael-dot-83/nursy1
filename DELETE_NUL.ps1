# Simple script to delete nul files
Write-Host "Deleting nul files..." -ForegroundColor Cyan

$paths = @(
  "D:\nursy\nul",
  "D:\nursy\nursery-system\backend\nul",
  "D:\nursy\nursery-system\frontend\nul"
)

foreach ($p in $paths) {
  if (Test-Path $p) {
    Write-Host "Removing: $p" -ForegroundColor Yellow
    Remove-Item -LiteralPath ("\\?\" + $p) -Force -Recurse
    Write-Host "  Removed" -ForegroundColor Green
  }
}

Write-Host "`nDone! Now run: git add -A" -ForegroundColor Green
