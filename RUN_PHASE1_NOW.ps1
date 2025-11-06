# RUN_PHASE1_NOW.ps1 - Execute Phase 1 PR creation
# Run this script to complete Phase 1 accessibility PR

$ErrorActionPreference = "Stop"

Write-Host "=== PHASE 1: Creating Accessibility PR ===" -ForegroundColor Cyan
Write-Host ""

# Ensure we're on the right branch
Write-Host "Step 1: Switching to feat/a11y-admin branch..." -ForegroundColor Yellow
git checkout feat/a11y-admin

Write-Host ""
Write-Host "Step 2: Running COMPLETE_PR.ps1..." -ForegroundColor Yellow
.\COMPLETE_PR.ps1

Write-Host ""
Write-Host "=== PHASE 1 COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Browser should open to PR creation page"
Write-Host "2. Fill in PR title and description (see ACTION_REQUIRED_NOW.md)"
Write-Host "3. Wait for CI to turn green (10-15 min)"
Write-Host "4. Merge the PR"
Write-Host "5. Come back and say 'Phase 1 merged, start Phase 2'"
Write-Host ""
Write-Host "PR URL: https://github.com/Wael-dot-83/nursy1/compare/feat/a11y-admin?expand=1" -ForegroundColor Yellow
