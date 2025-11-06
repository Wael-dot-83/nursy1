# COMPLETE_PR.ps1 (ASCII-only, PowerShell 5 safe)

$ErrorActionPreference = "Stop"

function Run($cmd, $args) {
  Write-Host ">> $cmd $args"
  & $cmd $args
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: $cmd $args"
  }
}

Write-Host "=== Finalizing A11Y PR (feat/a11y-admin) ===" -ForegroundColor Cyan

# 1) Ensure we are on the a11y branch
try {
  Run git "rev-parse --abbrev-ref HEAD"
  $branch = (& git rev-parse --abbrev-ref HEAD).Trim()
  if ($branch -ne "feat/a11y-admin") {
    Run git "checkout feat/a11y-admin"
  }
} catch {
  Run git "checkout -b feat/a11y-admin"
}

# 2) Remove accidental Windows 'nul' files and ignore them
if (-not (Test-Path .gitignore)) { "" | Out-File -Encoding ascii .gitignore }
Add-Content -Encoding ascii .gitignore "`n**/nul"
# Remove any cached nul
& git rm -r --cached --ignore-unmatch **/nul 2>$null | Out-Null
# Remove from disk if present
Get-ChildItem -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq 'nul' } | ForEach-Object {
  try { Remove-Item -Force -Recurse $_.FullName } catch {}
}

# 3) Normalize EOLs and ensure .gitattributes
if (-not (Test-Path .gitattributes)) {
  @"
* text=auto
*.sh text eol=lf
"@ | Out-File -Encoding ascii .gitattributes
  Write-Host "Created .gitattributes"
}

# 4) Make verify script executable (works if file exists and Git supports --chmod)
if (Test-Path "patches/verify-patches.sh") {
  # First stage, then set mode, or do both in one go with modern Git
  try {
    & git add --chmod=+x patches/verify-patches.sh
  } catch {
    # Fallback for older Git: stage then update-index
    & git add patches/verify-patches.sh
    & git update-index --add --chmod=+x patches/verify-patches.sh
  }
}

# 5) Stage everything needed for the PR
# Tip: if you want to restrict to A11Y artifacts only, replace with targeted paths.
Run git "add -A"

# 6) Commit if there are changes
$pending = (& git status --porcelain).Trim()
if ($pending) {
  Run git 'commit -m "chore(a11y): finalize patches, docs, CI, and repo hygiene"'
} else {
  Write-Host "Nothing to commit (working tree clean)."
}

# 7) Push branch
Run git "push -u origin feat/a11y-admin"

# 8) Print next steps and open PR URL
Write-Host ""
Write-Host "Open PR here:" -ForegroundColor Yellow
Write-Host "https://github.com/Wael-dot-83/nursy1/compare/feat/a11y-admin?expand=1"
try { Start-Process "https://github.com/Wael-dot-83/nursy1/compare/feat/a11y-admin?expand=1" } catch {}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1) Create the PR using the template (PR_BODY.md)."
Write-Host "2) Ensure CI is green (a11y + frontend + backend + integration + ci-cd)."
Write-Host "3) Use GO_NO_GO_CHECKLIST.md, then deploy using APPLY_VERIFY_MERGE.md."
Write-Host "4) Run POST_DEPLOY_SMOKE.md and publish RELEASE_NOTES_A11Y.md."