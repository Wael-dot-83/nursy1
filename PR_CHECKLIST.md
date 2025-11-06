# Pull Request Checklist

## 🚀 Open PR

### 1. Run Preparation Script
```powershell
.\OPEN_PR.ps1
```

**Or manually:**
```bash
# Make script executable for Linux CI
git update-index --chmod=+x patches/verify-patches.sh
git commit -m "chore(ci): mark verify-patches.sh executable"
git push origin feat/a11y-admin

# Open PR
Start-Process "https://github.com/Wael-dot-83/nursy1/compare/feat/a11y-admin?expand=1"
```

### 2. Create PR
- [ ] Ensure base branch is `main` (or your target)
- [ ] Compare branch is `feat/a11y-admin`
- [ ] Click "Create pull request"
- [ ] PR template auto-fills (if not, paste from `.github/pull_request_template.md`)
- [ ] Add reviewers
- [ ] Add labels (if applicable)

---

## ✅ CI Checks

### Workflows That Will Run
- [ ] `a11y.yml` - Accessibility verification (lint, test, verify-patches.sh, make a11y)
- [ ] `backend-tests.yml` - Backend tests
- [ ] `frontend-tests.yml` - Frontend tests
- [ ] `integration-tests.yml` - Integration tests
- [ ] `ci-cd.yml` - Main CI/CD pipeline

### Common CI Fixes
If any fail:

**Script not found:**
```bash
# Check path exists
ls patches/verify-patches.sh
```

**Permission denied:**
```bash
# Already fixed by OPEN_PR.ps1
git update-index --chmod=+x patches/verify-patches.sh
```

**Wrong working directory:**
- Check `working-directory` in workflow matches your structure
- Should be `nursery-system/frontend` for frontend steps

**Make target missing:**
- Workflow already gates `make a11y` with existence check
- If needed, add to Makefile

---

## 📋 PR Template Sections

### Summary
- [x] Complete admin accessibility remediation (WCAG 2.1 AA)
- [x] All patch files in order
- [x] Final polish guardrails

### Changes
- [x] Landmarks, heading hierarchy, skip links
- [x] ~50 ARIA attributes
- [x] Keyboard navigation
- [x] Focus management + live regions
- [x] Final guardrails

### Docs & How-To
- [x] All documentation links present

### Verification (must pass)
- [ ] `npm run lint` ✅
- [ ] `npm test` ✅
- [ ] `make a11y` ✅
- [ ] `bash patches/verify-patches.sh` ✅
- [ ] Manual keyboard + SR smoke ✅

**Performed by:** _[Fill in]_  
**Date:** _[Fill in]_  
**Notes:** _[Fill in]_

### Rollback
- [x] Documented in `patches/APPLY_VERIFY_MERGE.md`

### Risk
- [x] Low–medium (UI-only, no business logic)

### Screenshots
- [ ] Focus rings (3:1 contrast)
- [ ] Skip link (visible on focus)
- [ ] Dialog focus trap
- [ ] Table captions/aria-sort
- [ ] Error focus management

---

## 🎯 After CI Passes

### 1. Go/No-Go Decision
Use `GO_NO_GO_CHECKLIST.md`:
- [ ] All pre-deployment verification complete
- [ ] All automated tests pass
- [ ] Manual testing complete and signed off
- [ ] Documentation complete
- [ ] Team communication complete
- [ ] Risk assessment acceptable
- [ ] Rollback plan ready
- [ ] Post-deployment plan ready
- [ ] On-call engineer assigned

### 2. Merge PR
Choose merge strategy:
- **Squash & merge** - One clean commit (recommended for clean history)
- **Merge** - Keep per-patch commits (good for audit trail)

### 3. Deploy
Follow `DEPLOYMENT_QUICKSTART.md`:
```bash
# Already on main after merge
git pull origin main

# Deploy per your process
# (Docker, manual, CI/CD, etc.)
```

### 4. Post-Deploy Smoke Test
Run `POST_DEPLOY_SMOKE.md`:
- [ ] Quick verification (5 min)
- [ ] Lighthouse ≥95
- [ ] Keyboard-only test (15 min)
- [ ] Screen reader test (20 min)
- [ ] Visual test (10 min)
- [ ] Functional test (10 min)
- [ ] Live region test (5 min)
- [ ] ARIA validation (5 min)
- [ ] Performance check (5 min)

### 5. Release Notes
Publish `RELEASE_NOTES_A11Y.md`:
- [ ] Update date/version
- [ ] Attach screenshots
- [ ] Announce to team

---

## 🔗 Quick Links

- **PR URL:** https://github.com/Wael-dot-83/nursy1/compare/feat/a11y-admin?expand=1
- **PR Template:** `.github/pull_request_template.md`
- **CI Workflow:** `.github/workflows/a11y.yml`
- **Deployment:** `DEPLOYMENT_QUICKSTART.md`
- **Go/No-Go:** `GO_NO_GO_CHECKLIST.md`
- **Smoke Test:** `POST_DEPLOY_SMOKE.md`
- **Release Notes:** `RELEASE_NOTES_A11Y.md`

---

## 📊 Status Tracking

| Step | Status | Date | Notes |
|------|--------|------|-------|
| PR Created | ☐ | | |
| CI Passing | ☐ | | |
| Review Complete | ☐ | | |
| Go/No-Go | ☐ | | |
| Merged | ☐ | | |
| Deployed | ☐ | | |
| Smoke Test | ☐ | | |
| Released | ☐ | | |

---

## 🆘 Troubleshooting

### PR Template Not Showing
1. Click "Preview" tab
2. Look for "Choose a template" dropdown
3. Or manually paste from `.github/pull_request_template.md`

### CI Failing
1. Check workflow logs in Actions tab
2. Common fixes documented above
3. Push fixes to same branch (CI re-runs automatically)

### Line Ending Warnings
- Safe to ignore (already configured in `.gitattributes`)
- Won't break CI

---

**Status:** Ready to open PR  
**Next Action:** Run `.\OPEN_PR.ps1`
