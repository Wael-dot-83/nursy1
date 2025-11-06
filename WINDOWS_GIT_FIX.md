# Windows Git Fix - Reserved Filename 'nul'

## Problem
Git on Windows cannot stage files named `nul` (reserved device name). This blocks `git add -A`.

## Quick Fix (PowerShell)

```powershell
# Run the automated fix script
.\FIX_NUL_FILES.ps1
```

This script will:
1. Delete all `nul` files using Windows device-path trick
2. Add `nul` to `.gitignore` to prevent recurrence
3. Configure `.gitattributes` for consistent line endings
4. Normalize line endings in the repo

---

## Manual Fix (if needed)

### 1) Delete reserved nul files

```powershell
$paths = @(
  "D:\nursy\nul",
  "D:\nursy\nursery-system\backend\nul",
  "D:\nursy\nursery-system\frontend\nul"
)

foreach ($p in $paths) {
  if (Test-Path $p) {
    Remove-Item -LiteralPath ("\\?\" + $p) -Force -Recurse
  }
}
```

### 2) Prevent recurrence

```powershell
@"
# Guard against accidental device-file names on Windows
/nul
/nursery-system/backend/nul
/nursery-system/frontend/nul
"@ | Add-Content .gitignore
```

### 3) Fix line endings

```powershell
@"
* text=auto eol=lf

# Keep CRLF where Windows shells expect it
*.bat text eol=crlf
*.ps1 text eol=crlf
"@ | Set-Content .gitattributes

git config core.autocrlf false
git add --renormalize .
```

---

## After Fix

### Stage and commit everything:

```bash
git add -A
git commit -m "feat(a11y): complete admin accessibility remediation (WCAG 2.1 AA)"
git push -u origin feat/a11y-admin
```

### Or stage docs/CI only:

```powershell
git add .github/pull_request_template.md `
        .github/workflows/a11y.yml `
        RELEASE_NOTES_A11Y.md `
        GO_NO_GO_CHECKLIST.md `
        POST_DEPLOY_SMOKE.md `
        DEPLOYMENT_QUICKSTART.md `
        patches/APPLY_VERIFY_MERGE.md `
        README.md

git commit -m "docs(a11y): PR template, CI workflow, release docs, go/no-go, smoke, quickstart"
git push -u origin feat/a11y-admin
```

---

## Open PR

```
https://github.com/Wael-dot-83/nursy1/pull/new/feat/a11y-admin
```

PR template will auto-populate, CI runs, then follow Go/No-Go → Deploy → Smoke steps.

---

## Troubleshooting

### If nul files persist:
1. Close all editors (VS Code, etc.)
2. Run `FIX_NUL_FILES.ps1` again
3. Check with: `git status`

### If git add still fails:
```bash
git status
# Paste exact error for diagnosis
```

### If line ending warnings persist:
```bash
git add --renormalize .
git status
```

---

## Prevention

The `.gitignore` and `.gitattributes` files created by the fix script will prevent this issue from recurring.

**Reserved Windows filenames to avoid:**
- `nul`, `con`, `prn`, `aux`
- `com1` through `com9`
- `lpt1` through `lpt9`

---

## Status
✅ Fix script ready: `FIX_NUL_FILES.ps1`  
✅ Manual steps documented  
✅ Prevention configured
