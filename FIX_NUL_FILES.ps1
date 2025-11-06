# Fix Windows reserved filename 'nul' issue
# Run in PowerShell: .\FIX_NUL_FILES.ps1

Write-Host "Fixing Windows reserved 'nul' files..." -ForegroundColor Cyan

# 1) Delete reserved nul files
$paths = @(
  "D:\nursy\nul",
  "D:\nursy\nursery-system\backend\nul",
  "D:\nursy\nursery-system\frontend\nul"
)

foreach ($p in $paths) {
  if (Test-Path $p) {
    Write-Host "Removing: $p" -ForegroundColor Yellow
    Remove-Item -LiteralPath ("\\?\" + $p) -Force -Recurse
    Write-Host "  ✓ Removed" -ForegroundColor Green
  } else {
    Write-Host "  ✓ Not found (already clean): $p" -ForegroundColor Gray
  }
}

# 2) Add to .gitignore
Write-Host "`nAdding nul files to .gitignore..." -ForegroundColor Cyan
$gitignoreContent = @"

# Guard against accidental device-file names on Windows
/nul
/nursery-system/backend/nul
/nursery-system/frontend/nul
"@

Add-Content -Path ".gitignore" -Value $gitignoreContent
Write-Host "  ✓ Updated .gitignore" -ForegroundColor Green

# 3) Configure line endings
Write-Host "`nConfiguring line endings..." -ForegroundColor Cyan
$gitattributesContent = @"
* text=auto eol=lf

# Keep CRLF where Windows shells expect it
*.bat text eol=crlf
*.ps1 text eol=crlf
"@

Set-Content -Path ".gitattributes" -Value $gitattributesContent
Write-Host "  ✓ Created .gitattributes" -ForegroundColor Green

git config core.autocrlf false
Write-Host "  ✓ Set core.autocrlf=false" -ForegroundColor Green

Write-Host "`nNormalizing line endings..." -ForegroundColor Cyan
git add --renormalize .
Write-Host "  ✓ Line endings normalized" -ForegroundColor Green

Write-Host "`n✅ All fixes applied!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. git add -A" -ForegroundColor White
Write-Host "  2. git commit -m 'feat(a11y): complete admin accessibility remediation (WCAG 2.1 AA)'" -ForegroundColor White
Write-Host "  3. git push -u origin feat/a11y-admin" -ForegroundColor White
