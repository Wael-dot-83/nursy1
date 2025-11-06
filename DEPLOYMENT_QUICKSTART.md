# Final Merge & Release (Copy–Paste)

## 1) Branch, push, open PR

```bash
git checkout -b feat/a11y-admin
git add -A
git commit -m "feat(a11y): complete admin accessibility remediation (WCAG 2.1 AA)"
git push -u origin feat/a11y-admin
```

Open a PR → the **PR template** will guide verification (already in `.github/pull_request_template.md`).

---

## 2) CI must be green

GitHub Actions will run:
- `a11y.yml` (lint, tests, `verify-patches.sh`, `make a11y`)
- `backend-tests.yml`, `frontend-tests.yml`, `integration-tests.yml`, `ci-cd.yml`

**If anything fails, fix and push again.**

---

## 3) Go/No-Go

Use `GO_NO_GO_CHECKLIST.md` to record sign-offs. If all checks are ✅, merge the PR.

---

## 4) Deploy

Follow `patches/APPLY_VERIFY_MERGE.md` → **Deploy** section.

Rollback and troubleshooting already documented there.

---

## 5) Post-deploy smoke (10–20 min)

Run `POST_DEPLOY_SMOKE.md`:
- Keyboard-only (Tab/Shift+Tab, Enter/Space, Esc, Arrows)
- Screen reader landmarks/headings/tables/forms
- Focus indicators ≥3:1, error focus to first invalid
- Live regions announce only when needed

---

## 6) Release notes

Publish `RELEASE_NOTES_A11Y.md` with final date/version.

Attach screenshots:
- Skip link (visible on focus)
- Dialog focus trap
- Table caption/aria-sort
- Error focus management

---

## 7) Rollback (if needed)

Reverse apply patches (top → bottom) or revert commits.

See `patches/APPLY_VERIFY_MERGE.md` → Section 7.

---

## TL;DR Status

- ✅ PR template
- ✅ CI workflows (a11y + others)
- ✅ Deployment docs + rollback
- ✅ Go/No-Go + Post-deploy smoke
- ✅ README cross-references

**Cleared for takeoff. 🚀**

---

## Quick Links

- **PR Template:** `.github/pull_request_template.md`
- **CI Workflow:** `.github/workflows/a11y.yml`
- **Deployment:** `patches/APPLY_VERIFY_MERGE.md`
- **Go/No-Go:** `GO_NO_GO_CHECKLIST.md`
- **Smoke Test:** `POST_DEPLOY_SMOKE.md`
- **Release Notes:** `RELEASE_NOTES_A11Y.md`
- **Rollback:** `patches/APPLY_VERIFY_MERGE.md` → Section 7

---

## One-Liner Verification

```bash
npm run lint && npm test && make a11y && bash patches/verify-patches.sh
```

**All must pass before merge.**
