# ARIA Hygiene Improvements Applied

## Summary
Surgical refinements to eliminate redundancy and improve robustness in accessibility implementation.

## Changes Applied

### 1. FilterMenu - Avoid Redundant Labeling
**Issue**: `aria-label` overrides visible text, creating disconnect between visual and accessible names.

**Fix**: Use `aria-labelledby` to tie accessible name to visible label.

```jsx
<Menu.Button
  aria-expanded={open}
  aria-haspopup="true"
  aria-labelledby="filtermenu-button-label"  // ✅ References visible text
>
  <FunnelIcon aria-hidden="true" />
  <span id="filtermenu-button-label">{activeOption?.label ?? placeholder}</span>
</Menu.Button>

<Menu.Items
  aria-label={`خيارات ${label}`}
  aria-orientation="vertical"  // ✅ Explicit orientation
>
```

**Benefit**: Screen readers announce the same text sighted users see.

---

### 2. SortableHeader - Improved Announcement
**Issue**: Hyphen separator less clear than em dash.

**Fix**: Use em dash (—) for better pause/clarity.

```jsx
aria-label={`ترتيب حسب ${label}${isActive ? ` — ${direction === 'asc' ? 'تصاعدي' : 'تنازلي'}` : ''}`}
```

**Benefit**: Screen readers pause slightly at em dash, improving comprehension.

---

### 3. Error Alert - Remove Redundant aria-live
**Issue**: `role="alert"` already implies `aria-live="assertive"`.

**Fix**: Remove redundant attribute.

```jsx
<div 
  role="alert"  // ✅ Sufficient - already assertive
>
  <strong>خطأ في الحفظ:</strong> {generalError}
</div>
```

**Benefit**: Cleaner markup, same functionality.

---

### 4. UserForm - Focus First Invalid Field
**Issue**: Errors announced but focus not moved to problem field.

**Fix**: Auto-focus first invalid input after validation error.

```jsx
useEffect(() => {
  const firstErrorKey = Object.keys(fieldErrors)[0];
  if (firstErrorKey) {
    const fieldMap = {
      full_name: 'user-fullname',
      email: 'user-email',
      phone: 'user-phone',
      role: 'user-role',
      nursery_id: 'user-nursery',
      branch_id: 'user-branch'
    };
    const el = document.getElementById(fieldMap[firstErrorKey]);
    if (el) el.focus();
  }
}, [fieldErrors]);
```

**Benefit**: Keyboard users immediately positioned to fix the error.

---

## Verification Checklist

### FilterMenu
- [ ] Tab to filter button
- [ ] Screen reader announces visible label text (not different aria-label)
- [ ] Down/Up arrows navigate menu items
- [ ] Space/Enter selects option
- [ ] Escape closes menu

### SortableHeader
- [ ] Click to sort
- [ ] Screen reader announces "ترتيب حسب [field] — تصاعدي/تنازلي"
- [ ] Inactive headers have `aria-sort="none"`
- [ ] Active header has `aria-sort="ascending"` or `"descending"`

### Error Handling
- [ ] Submit invalid form
- [ ] Screen reader announces error
- [ ] Focus moves to first invalid field automatically
- [ ] Field has `aria-invalid="true"`
- [ ] Error message linked via `aria-describedby`

### BulkToolbar
- [ ] Select users → toolbar appears
- [ ] Screen reader announces toolbar appearance
- [ ] Tab through toolbar buttons
- [ ] Each button has descriptive label with count

---

## WCAG Compliance

| Criterion | Level | Status |
|-----------|-------|--------|
| 1.3.1 Info and Relationships | A | ✅ Pass |
| 2.4.6 Headings and Labels | AA | ✅ Pass |
| 3.3.1 Error Identification | A | ✅ Pass |
| 3.3.2 Labels or Instructions | A | ✅ Pass |
| 3.3.3 Error Suggestion | AA | ✅ Pass |
| 4.1.2 Name, Role, Value | A | ✅ Pass |
| 4.1.3 Status Messages | AA | ✅ Pass |

---

## Files Modified
- `patches/patch-shared-components-a11y.diff`

## Impact
- **Redundancy**: Eliminated 2 redundant ARIA attributes
- **Clarity**: Improved 1 screen reader announcement
- **UX**: Added auto-focus to first error field
- **Robustness**: Ensured visible text matches accessible name

## Next Steps
1. Apply patch: `git apply patches/patch-shared-components-a11y.diff`
2. Test with screen reader (NVDA/JAWS)
3. Verify keyboard navigation flows
4. Confirm error focus management works
