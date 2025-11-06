# Post-Deployment Smoke Test

**Environment:** Production  
**Release:** Admin Accessibility Remediation  
**Tester:** _________________  
**Date:** _________________

---

## Quick Verification (5 minutes)

### One-Liner Check
```bash
npm run lint && npm test && make a11y && bash patches/verify-patches.sh
```
- [ ] All commands pass ✅

### Lighthouse Audit
1. Open Chrome DevTools
2. Navigate to Lighthouse tab
3. Run Accessibility audit
4. **Target:** ≥95

**Score:** _____ / 100  
**Result:** ☐ Pass (≥95)  ☐ Fail (<95)

---

## Keyboard-Only Test (15 minutes)

### Admin Dashboard
- [ ] Tab through all interactive elements
- [ ] Skip link visible on focus (press Tab on page load)
- [ ] Focus indicators visible (≥3:1 contrast)
- [ ] Metric cards keyboard accessible
- [ ] Charts have data table alternatives

### User Management
- [ ] Filter menu opens with Enter/Space
- [ ] Arrow keys navigate filter options
- [ ] Table sortable with keyboard
- [ ] Pagination navigable with Tab
- [ ] Bulk toolbar appears when users selected
- [ ] User form (modal) traps focus
- [ ] Escape closes modal

### Notification Center
- [ ] Notifications navigable with Tab
- [ ] Action buttons keyboard accessible
- [ ] Unread count announced
- [ ] Mark as read works with Enter/Space

### Audit Logs
- [ ] Filter form keyboard accessible
- [ ] Log entries navigable
- [ ] Details toggle with Enter/Space
- [ ] Statistics keyboard accessible

### Settings
- [ ] Tab navigation works (arrow keys for tabs)
- [ ] Arrow keys navigate between tabs
- [ ] Form fields keyboard accessible
- [ ] Toggle switches work with Space
- [ ] Save button keyboard accessible

**Overall Keyboard Test:** ☐ Pass  ☐ Fail

---

## Screen Reader Test (20 minutes)

**Tool:** ☐ NVDA  ☐ JAWS  ☐ Other: _________

### Landmark Navigation (Press D)
- [ ] Main landmark present on all pages
- [ ] Navigation landmark present
- [ ] Complementary landmarks where appropriate
- [ ] Landmarks have descriptive labels

### Heading Navigation (Press H)
- [ ] H1 present on each page
- [ ] Heading hierarchy logical (h1 → h2 → h3)
- [ ] Headings describe content accurately

### Table Navigation (Press T)
- [ ] Tables have captions
- [ ] Column headers have scope="col"
- [ ] Row headers have scope="row"
- [ ] aria-sort announces sort direction

### Form Navigation (Press F)
- [ ] All inputs have labels
- [ ] Required fields announced
- [ ] Error messages announced
- [ ] Focus moves to first invalid field on error

### Button Navigation (Press B)
- [ ] All buttons have descriptive labels
- [ ] Icon-only buttons have aria-label
- [ ] Button states announced (disabled, loading)

### Live Regions
- [ ] Bulk toolbar announces when users selected
- [ ] Error alerts announce immediately
- [ ] Loading states announce
- [ ] Success messages announce

### Modal Dialog Test
1. Open user form modal
2. Verify focus moves to close button
3. Tab through form fields
4. Verify focus stays in modal
5. Press Escape to close
6. Verify focus returns to trigger button

**Result:** ☐ Pass  ☐ Fail

**Overall Screen Reader Test:** ☐ Pass  ☐ Fail

---

## Visual Test (10 minutes)

### Focus Indicators
- [ ] Visible on all interactive elements
- [ ] Contrast ≥3:1 against background
- [ ] Not obscured by other elements
- [ ] Consistent style across pages

### Error Handling
- [ ] Error messages visible
- [ ] Error messages have sufficient contrast
- [ ] Error icons have aria-hidden="true"
- [ ] Focus moves to first error

### Color Contrast
- [ ] Text contrast ≥4.5:1
- [ ] UI component contrast ≥3:1
- [ ] Error text contrast ≥4.5:1
- [ ] Focus indicators ≥3:1

### Skip Link
- [ ] Visible when focused (Tab on page load)
- [ ] Positioned at top of page
- [ ] Clicking moves focus to main content
- [ ] Styled consistently

**Overall Visual Test:** ☐ Pass  ☐ Fail

---

## Functional Test (10 minutes)

### Admin Dashboard
- [ ] Metrics display correctly
- [ ] Charts render properly
- [ ] Data table alternatives work
- [ ] Time elements formatted correctly

### User Management
- [ ] Filter menu works
- [ ] Sorting works
- [ ] Pagination works
- [ ] Bulk actions work
- [ ] User form submits correctly
- [ ] Validation errors display and focus

### Notification Center
- [ ] Notifications display
- [ ] Mark as read works
- [ ] Action buttons work
- [ ] Unread count updates

### Audit Logs
- [ ] Logs display
- [ ] Filters work
- [ ] Details toggle works
- [ ] Statistics display

### Settings
- [ ] Tab switching works
- [ ] Form fields save
- [ ] Toggle switches work
- [ ] Validation works

**Overall Functional Test:** ☐ Pass  ☐ Fail

---

## Live Region Test (5 minutes)

### Conditional Announcements
- [ ] Bulk toolbar only announces when count > 0
- [ ] No announcements on page load (count = 0)
- [ ] Selection count updates announce
- [ ] Toolbar disappears when count = 0 (no announcement)

### Error Announcements
- [ ] Form errors announce immediately
- [ ] role="alert" used (no redundant aria-live)
- [ ] Focus moves to first invalid field
- [ ] Error messages linked via aria-describedby

### Status Announcements
- [ ] Loading states announce
- [ ] Success messages announce
- [ ] Non-critical updates use aria-live="polite"

**Overall Live Region Test:** ☐ Pass  ☐ Fail

---

## ARIA Validation (5 minutes)

### FilterMenu
- [ ] aria-labelledby references visible text
- [ ] aria-controls links button to menu
- [ ] aria-expanded reflects state
- [ ] menuitemradio role on options
- [ ] aria-checked on selected option

### SortableHeader
- [ ] aria-sort on <th> element
- [ ] aria-label with em dash separator
- [ ] Announces "ترتيب حسب [field] — تصاعدي/تنازلي"

### BulkToolbar
- [ ] role="toolbar" on container
- [ ] aria-label describes toolbar
- [ ] Buttons have descriptive aria-label with count

### UserForm
- [ ] Dialog focus trap works
- [ ] initialFocus on close button
- [ ] Error focus fallback chain works
- [ ] All inputs have labels and IDs

**Overall ARIA Test:** ☐ Pass  ☐ Fail

---

## Performance Check (5 minutes)

### Page Load
- [ ] No significant performance degradation
- [ ] Focus indicators don't cause layout shift
- [ ] ARIA attributes don't slow rendering

### Interaction
- [ ] Keyboard navigation responsive
- [ ] Focus management smooth
- [ ] Live regions don't cause lag

**Overall Performance:** ☐ Pass  ☐ Fail

---

## Final Results

### Summary
| Test Category | Result | Notes |
|---------------|--------|-------|
| Quick Verification | ☐ Pass ☐ Fail | |
| Lighthouse | ☐ Pass ☐ Fail | Score: _____ |
| Keyboard-Only | ☐ Pass ☐ Fail | |
| Screen Reader | ☐ Pass ☐ Fail | |
| Visual | ☐ Pass ☐ Fail | |
| Functional | ☐ Pass ☐ Fail | |
| Live Regions | ☐ Pass ☐ Fail | |
| ARIA Validation | ☐ Pass ☐ Fail | |
| Performance | ☐ Pass ☐ Fail | |

### Overall Result
**Status:** ☐ PASS  ☐ FAIL

**Pass Criteria:** All tests pass  
**Fail Criteria:** Any test fails

---

## Issues Found

| Issue | Severity | Page | Description | Action |
|-------|----------|------|-------------|--------|
| 1. | ☐ Critical ☐ High ☐ Medium ☐ Low | | | |
| 2. | ☐ Critical ☐ High ☐ Medium ☐ Low | | | |
| 3. | ☐ Critical ☐ High ☐ Medium ☐ Low | | | |

**Critical/High Issues:** _____ (If > 0, consider rollback)

---

## Recommendations

### Immediate Actions
- [ ] None needed (all tests pass)
- [ ] Minor fixes needed (deploy hotfix)
- [ ] Major issues (consider rollback)

### Follow-up Actions
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## Sign-off

**Tester:** _________________  
**Date/Time:** _________________  
**Signature:** _________________

**Approved by:** _________________  
**Date/Time:** _________________  
**Signature:** _________________

---

## Rollback Decision

**Rollback Required:** ☐ Yes  ☐ No

**If Yes, Reason:**
_________________________________________________________________
_________________________________________________________________

**Rollback Procedure:** See `patches/APPLY_VERIFY_MERGE.md` → Section 7

---

**Test Complete:** ☐ Yes  ☐ No  
**Production Ready:** ☐ Yes  ☐ No
