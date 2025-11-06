# Accessibility Quick Reference Card

## Apply All Patches (5 minutes)

```bash
cd d:\nursy
git apply patches/patch-admin-dashboard-a11y.diff
git apply patches/patch-admin-users-a11y.diff
git apply patches/patch-admin-notifications-a11y.diff
git apply patches/patch-admin-auditlogs-a11y.diff
git apply patches/patch-admin-settings-a11y.diff
git apply patches/patch-shared-components-a11y.diff
```

## Quick Verify (2 minutes)

```bash
npm run lint    # Should pass
npm test        # Should pass
make a11y       # Should show 30/30 fixed
```

## Keyboard Test (5 minutes per page)

1. **Tab** - Navigate forward
2. **Shift+Tab** - Navigate backward
3. **Enter/Space** - Activate buttons
4. **Escape** - Close modals
5. **Arrow keys** - Navigate menus/tabs

## Screen Reader Test (10 minutes per page)

Download NVDA: https://www.nvaccess.org/

1. **D** - Navigate landmarks
2. **H** - Navigate headings
3. **T** - Navigate tables
4. **F** - Navigate forms
5. **B** - Navigate buttons

## Common Patterns

### Landmark
```jsx
<main id="main-content" aria-labelledby="page-title" role="main">
  <h1 id="page-title">Page Title</h1>
</main>
```

### Button (with visible text - use aria-labelledby)
```jsx
<button aria-labelledby="btn-label">
  <Icon aria-hidden="true" />
  <span id="btn-label">Visible Text</span>
</button>
```

### Button (icon-only - use aria-label)
```jsx
<button aria-label="Descriptive action">
  <Icon aria-hidden="true" />
</button>
```

### Form Field
```jsx
<label htmlFor="field-id">Label</label>
<input
  id="field-id"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? "error-id" : undefined}
/>
{hasError && <p id="error-id" role="alert">{error}</p>}
```

### Table
```jsx
<table>
  <caption>Table description</caption>
  <thead>
    <tr>
      <th scope="col">Header</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Row header</th>
      <td>Data</td>
    </tr>
  </tbody>
</table>
```

### Live Region
```jsx
<div role="status" aria-live="polite" aria-atomic="true">
  {message}
</div>
```

### Error Alert (role="alert" implies assertive)
```jsx
<div role="alert">
  <strong>Error:</strong> {errorMessage}
</div>
```

## Rollback (if needed)

```bash
git apply -R patches/patch-shared-components-a11y.diff
git apply -R patches/patch-admin-settings-a11y.diff
git apply -R patches/patch-admin-auditlogs-a11y.diff
git apply -R patches/patch-admin-notifications-a11y.diff
git apply -R patches/patch-admin-users-a11y.diff
git apply -R patches/patch-admin-dashboard-a11y.diff
```

## ARIA Hygiene Checklist

- ✅ Use `aria-labelledby` when visible text exists
- ✅ Use `aria-label` only for icon-only buttons
- ✅ Don't add `aria-live` to `role="alert"` (redundant)
- ✅ Focus moves to first invalid field on error
- ✅ All icons have `aria-hidden="true"`

## Success Criteria

- ✅ Lighthouse Accessibility ≥ 95
- ✅ axe Violations = 0 critical
- ✅ All pages keyboard accessible
- ✅ All pages screen reader compatible
- ✅ Focus visible on all elements
- ✅ Forms announce errors
- ✅ Visible text matches accessible name

## Support

- Full docs: `PATCH_APPLICATION_GUIDE.md`
- Audit: `ADMIN_AUDIT_REMEDIATION_PLAN.md`
- Status: `IMPLEMENTATION_COMPLETE.md`
- Help: `make a11y`
