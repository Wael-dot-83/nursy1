# 📋 Visual Deployment Checklist

Print this or keep it open in a separate window to track progress.

---

## ✅ Step 0: Push Protection [COMPLETED]

- [x] Redact Twilio SID from COMPLETE_PASSWORD_RESET_PROMPT.md
- [x] Redact Twilio SID from PASSWORD_RESET_FINAL_STATUS.md
- [x] Amend commit (no new commit)
- [x] Force-push to GitHub
- [x] Verify no pattern matches remain
- [x] Make verify-patches.sh executable
- [x] Open PR creation page in browser

**Status**: ✅ **DONE** | **Time**: Completed

---

## 📝 Step 1: Create Pull Request

### Actions:
- [ ] Browser tab open at GitHub compare page
- [ ] Fill PR title: `feat(a11y): admin accessibility remediation (WCAG 2.1 AA)`
- [ ] Copy body from PR_BODY.md
- [ ] Add labels: `accessibility`, `enhancement`, `ready-for-review`
- [ ] Assign reviewers (optional)
- [ ] Click "Create pull request"
- [ ] PR number assigned: `#____`

**Estimated Time**: 2-3 minutes

---

## ⏳ Step 2: CI Runs (Automatic)

### Workflows to Monitor:
- [ ] Accessibility Tests (Pa11y + axe-core)
- [ ] Backend Tests (pytest)
- [ ] Frontend Tests (Jest)
- [ ] Integration Tests (E2E)
- [ ] Main Pipeline (full build)

### Actions:
- [ ] Open https://github.com/Wael-dot-83/nursy1/actions
- [ ] All 5 workflows started
- [ ] All 5 workflows GREEN ✅

**Status**: ⏳ **WAITING** | **Expected Time**: 10-15 minutes

---

## 🎯 Step 3: Go/No-Go Decision

### Pre-Checks:
- [ ] All CI workflows GREEN (5/5)
- [ ] No security vulnerabilities detected
- [ ] Code coverage meets threshold
- [ ] PR template fully completed

### Optional Local Verification:
```powershell
bash patches/verify-patches.sh
```
- [ ] Patches verified successfully

### Checklist Review:
```powershell
code GO_NO_GO_CHECKLIST.md
```

### Screenshots Attached:
- [ ] Focus rings on buttons/inputs
- [ ] Skip link functionality
- [ ] Dialog focus trap
- [ ] Sortable table headers with ARIA
- [ ] Error focus management

### Decision:
- [ ] **✅ GO** - All checks passed, ready to merge
- [ ] **❌ NO-GO** - Issues found, need fixes

**Status**: ⏳ **PENDING** | **Time**: 2 minutes

---

## 🚢 Step 4: Merge & Deploy

### 4A: Merge PR
- [ ] Click "Merge pull request" in GitHub
- [ ] Choose "Squash and merge"
- [ ] Confirm merge
- [ ] PR merged successfully
- [ ] Delete branch feat/a11y-admin (optional)

### 4B: Pull Merged Changes
```powershell
git checkout main
git pull origin main
```
- [ ] Local main branch updated

### 4C: Deploy to Production
```powershell
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d --remove-orphans
```
- [ ] Containers pulled
- [ ] Containers restarted
- [ ] Wait 10 seconds for startup

### 4D: Health Checks
```powershell
(Invoke-WebRequest "http://localhost:8000/health").StatusCode
(Invoke-WebRequest "http://localhost:4173").StatusCode
```
- [ ] Backend health: **200** ✅
- [ ] Frontend health: **200** ✅
- [ ] System health: All flags OK ✅

**Status**: ⏳ **PENDING** | **Time**: 5 minutes

---

## 🧪 Step 5: Smoke Testing

### 5A: Basic Access
- [ ] Navigate to http://localhost:4173/login
- [ ] Login as admin successful
- [ ] Dashboard loads without errors

### 5B: Keyboard Navigation
- [ ] Tab through interface - focus rings visible
- [ ] Skip link appears and works
- [ ] Focus order is logical
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals/menus

### 5C: Focus Management
- [ ] Modal opens - focus trapped inside
- [ ] Modal closes - focus returns to trigger
- [ ] Error triggered - focus jumps to error
- [ ] Form submitted - focus managed correctly

### 5D: ARIA Attributes
- [ ] Table headers have aria-sort
- [ ] Sorting updates aria-sort
- [ ] Form errors have aria-describedby
- [ ] Invalid fields have aria-invalid

### 5E: Screen Reader (Optional)
- [ ] Enable screen reader (NVDA/JAWS/VoiceOver)
- [ ] Menu items announced correctly
- [ ] Modal title announced on open
- [ ] Error messages announced
- [ ] Live regions announce updates

### 5F: Critical Paths
- [ ] Admin → Users (view, add, edit, deactivate)
- [ ] Admin → Nurseries (view, create, edit)
- [ ] Admin → Reports (generate, view)
- [ ] Admin → Settings (view, update)
- [ ] Admin → Audit Logs (view, filter)

### 5G: Toast Notifications
- [ ] Success toast appears with checkmark
- [ ] Error toast appears with alert icon
- [ ] Focus returns after toast dismisses
- [ ] Screen reader announces toast

### 5H: System Health Final Check
```powershell
Invoke-WebRequest "http://localhost:8000/system/system-health"
```
- [ ] Database: OK
- [ ] Redis: OK
- [ ] API: OK
- [ ] No errors in logs

### Smoke Test Result:
- [ ] **✅ PASS** - All tests passed
- [ ] **❌ FAIL** - Issues found (go to Rollback)

**Status**: ⏳ **PENDING** | **Time**: 10-20 minutes

---

## 📢 Step 6: Publish Release

### 6A: Prepare Release Notes
```powershell
code RELEASE_NOTES_A11Y.md
```
- [ ] Review release notes
- [ ] Add final screenshots
- [ ] Update version number
- [ ] Review rollback procedures

### 6B: Create GitHub Release

**Option 1: GitHub UI**
- [ ] Go to https://github.com/Wael-dot-83/nursy1/releases
- [ ] Click "Draft a new release"
- [ ] Tag: `v1.0.0-a11y`
- [ ] Target: `main`
- [ ] Title: `Admin Accessibility Remediation (WCAG 2.1 AA)`
- [ ] Description: Paste from RELEASE_NOTES_A11Y.md
- [ ] Attach screenshots
- [ ] Click "Publish release"

**Option 2: CLI**
```powershell
gh release create v1.0.0-a11y --target main -F RELEASE_NOTES_A11Y.md -t "Admin Accessibility Remediation (WCAG 2.1 AA)"
```
- [ ] Release created via CLI

### Release Checklist:
- [ ] Release published on GitHub
- [ ] Version tag created: v1.0.0-a11y
- [ ] Release notes include all changes
- [ ] Screenshots attached
- [ ] Rollback plan documented

**Status**: ⏳ **PENDING** | **Time**: 3 minutes

---

## 🔄 Step 7: Rollback (Only if Needed)

**Execute ONLY if smoke tests fail or critical issues found**

### Rollback Actions:
```powershell
# 1. Find merge commit
git log --oneline -5

# 2. Revert merge
git revert <merge-sha> -m 1
git push origin main

# 3. Redeploy previous version
docker compose -f docker-compose.production.yml up -d --remove-orphans

# 4. Verify rollback
(Invoke-WebRequest "http://localhost:8000/health").StatusCode
```

- [ ] Merge commit identified: `_______`
- [ ] Revert commit created
- [ ] Pushed to main
- [ ] Containers redeployed
- [ ] Health checks pass
- [ ] Rollback logged in ROLLBACK_LOG.md

**Status**: ❌ **NOT NEEDED** (unless issues arise)

---

## ✨ Final Summary

### Deployment Metrics:
- **Start Time**: __________
- **PR Created**: __________
- **CI Completed**: __________
- **Merged**: __________
- **Deployed**: __________
- **Smoke Tested**: __________
- **Released**: __________
- **End Time**: __________
- **Total Duration**: __________ minutes

### Overall Status:
- [ ] ✅ **SUCCESS** - All steps completed
- [ ] ⚠️ **ISSUES** - Documented below
- [ ] ❌ **ROLLED BACK** - See rollback log

### Notes:
```
[Add any notes, issues encountered, or learnings here]




```

---

## 📊 Metrics & Statistics

### Code Changes:
- Files changed: 597
- Insertions: 78,404
- Deletions: 2,049
- Accessibility issues fixed: 30/30

### Test Coverage:
- Accessibility tests: _____ passed
- Backend tests: _____ passed
- Frontend tests: _____ passed
- Integration tests: _____ passed

### Performance Impact:
- Page load time: _____ (before/after)
- Accessibility score: _____ (before/after)
- Bundle size change: _____ KB

---

## 📚 Reference Documents

Quick links:
- Full guide: `DEPLOYMENT_WORKFLOW_COMPLETE.md`
- Quick TL;DR: `DEPLOYMENT_TLDR.md`
- Current status: `DEPLOYMENT_STATUS_NOW.md`
- Go/No-Go: `GO_NO_GO_CHECKLIST.md`
- Smoke tests: `POST_DEPLOY_SMOKE.md`
- Release notes: `RELEASE_NOTES_A11Y.md`
- Patch guide: `patches/APPLY_VERIFY_MERGE.md`

---

**Checklist Owner**: _____________
**Deployment Date**: November 6, 2025
**Feature**: Admin Accessibility Remediation (WCAG 2.1 AA)
**Branch**: feat/a11y-admin → main
**Version**: v1.0.0-a11y
