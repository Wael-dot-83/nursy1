# Admin Area Full Professional Audit and Remediation Plan

**Nursery Management System - Complete Admin Surface Audit**

---

## Document Overview

This document provides a comprehensive, actionable audit of the entire `/admin` surface of the Nursery Management System. It covers all pages, sections, exact issues (semantic structure, accessibility, UX, data integrity, i18n, security), and step-by-step fixes that can be assigned to engineers and QA.

**Scope:** All admin routes including dashboard, users, notifications, audit logs, and settings.

**Grounding:** Based on existing frontend router configuration, backend admin endpoints, and current implementation status reports.

---

## Table of Contents

1. [/admin — Admin Dashboard](#1-admin--admin-dashboard)
2. [/admin/users — Users Management](#2-adminusers--users-management)
3. [/admin/notifications — Notifications Center](#3-adminnotifications--notifications-center)
4. [/admin/audit-logs — Audit Logs](#4-adminaudit-logs--audit-logs)
5. [/admin/settings — Settings](#5-adminsettings--settings)
6. [Cross-Cutting Concerns](#6-cross-cutting-concerns)
7. [Prioritized Remediation Roadmap](#7-prioritized-remediation-roadmap)

---

## 1. /admin — Admin Dashboard

**Route:** `/admin/dashboard`  
**Component:** `AdminDashboard.jsx`  
**Current Status:** ✅ Implemented with analytics, charts, and metrics

### 1.1 Sections Inspected

- Page title and document outline
- Global navigation and role hinting
- Summary cards (metrics) and quick actions
- Charts (user roles, children by age, nurseries by governorate)
- Recent activity feed
- Recent logins table

---

### 1.2 Issues, Impact, and Fixes

#### Issue 1.1: Missing Page-Level Semantic Structure

**Severity:** 🔴 Critical (WCAG 2.1 Level A)

**Location:** Root container in `AdminDashboard.jsx`

**Problem:**
- No `<main>` landmark wrapping the dashboard content
- H1 exists but not properly associated with main landmark
- Missing ARIA landmarks for navigation regions

**Impact:**
- Screen readers cannot build reliable document outline
- Keyboard users cannot jump between regions using landmark navigation
- Fails WCAG 2.4.1 (Bypass Blocks)

**Fix:**
```jsx
// Current (line ~200):
<div className="space-y-8">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold text-slate-800">لوحة تحكم المشرف العام</h1>

// Replace with:
<main aria-labelledby="admin-dashboard-title" role="main">
  <div className="space-y-8">
    <header className="flex items-center justify-between">
      <div>
        <h1 id="admin-dashboard-title" className="text-3xl font-bold text-slate-800">
          لوحة تحكم المشرف العام
        </h1>
```

**Acceptance Criteria:**
- [ ] Screen reader announces "main landmark" when entering page
- [ ] H1 has unique ID referenced by aria-labelledby
- [ ] Landmark navigation (NVDA: D key) lists main, header regions

**Verification Steps:**
1. Open page with NVDA/JAWS
2. Press D to navigate landmarks
3. Verify "main" and "header" are announced
4. Press H to verify heading hierarchy (H1 → H2 → H3)

**Estimated Effort:** 30 minutes

---

#### Issue 1.2: Metric Cards Lack Accessible Names and Keyboard Navigation

**Severity:** 🟡 High (WCAG 2.1 Level A)

**Location:** `MetricCard` component (line ~20)

**Problem:**
- Cards are non-interactive `<div>` elements but appear clickable
- No accessible name for screen readers
- Trend indicators lack text alternatives
- No keyboard focus management

**Impact:**
- Screen readers announce disconnected content
- Keyboard users cannot activate cards
- Trend direction not conveyed to screen readers

**Fix:**
```jsx
// Current:
function MetricCard({ label, value, icon, accent = 'bg-primary-100 text-primary-700', trend, trendValue }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border...">

// Replace with:
function MetricCard({ label, value, icon, accent = 'bg-primary-100 text-primary-700', trend, trendValue, href }) {
  const Component = href ? 'a' : 'div';
  const trendLabel = trend === 'up' ? 'ارتفاع' : 'انخفاض';
  
  return (
    <Component 
      href={href}
      className="group relative overflow-hidden rounded-2xl border..."
      aria-label={`${label}: ${value?.toLocaleString('ar-JO') || 0}${trendValue ? `, ${trendLabel} بنسبة ${trendValue}%` : ''}`}
      role={href ? undefined : "region"}
      tabIndex={href ? undefined : 0}
    >
      {/* Add sr-only text for trends */}
      {trend && trendValue && (
        <span className="sr-only">{trendLabel} بنسبة {trendValue}%</span>
      )}
```

**Acceptance Criteria:**
- [ ] Cards have accessible names announced by screen readers
- [ ] If clickable, cards are keyboard accessible (Tab + Enter)
- [ ] Trend direction announced as text ("ارتفاع" or "انخفاض")
- [ ] Focus visible with 3:1 contrast ratio

**Verification Steps:**
1. Tab through metric cards
2. Verify focus ring visible on each card
3. Screen reader announces full card content including trend
4. If href provided, Enter key navigates

**Estimated Effort:** 1 hour

---

#### Issue 1.3: Charts Missing Accessible Alternatives

**Severity:** 🟡 High (WCAG 2.1 Level A)

**Location:** Chart.js Doughnut and Bar charts (line ~150)

**Problem:**
- Charts rendered as `<canvas>` with no text alternative
- No data table fallback for screen readers
- Color-only differentiation in charts

**Impact:**
- Screen reader users cannot access chart data
- Fails WCAG 1.1.1 (Non-text Content)
- Color-blind users may not distinguish data series

**Fix:**
```jsx
// Add after each chart:
<ChartCard title="توزيع المستخدمين حسب الدور">
  <div className="h-80">
    <Doughnut 
      data={userRoleChartData} 
      options={chartOptions}
      aria-label="مخطط دائري يوضح توزيع المستخدمين"
    />
  </div>
  
  {/* Add accessible data table */}
  <details className="mt-4">
    <summary className="cursor-pointer text-sm text-primary-600 hover:text-primary-700">
      عرض البيانات في جدول
    </summary>
    <table className="mt-2 w-full text-sm">
      <caption className="sr-only">توزيع المستخدمين حسب الدور</caption>
      <thead>
        <tr>
          <th scope="col" className="text-right">الدور</th>
          <th scope="col" className="text-right">العدد</th>
        </tr>
      </thead>
      <tbody>
        {data?.usersByRole?.map(item => (
          <tr key={item.role}>
            <td>{ROLE_LABELS[item.role]}</td>
            <td>{item.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </details>
</ChartCard>
```

**Acceptance Criteria:**
- [ ] Each chart has aria-label describing content
- [ ] Data table alternative available via `<details>` element
- [ ] Table has proper caption and scope attributes
- [ ] Patterns/textures added to charts (not just color)

**Verification Steps:**
1. Navigate to chart with screen reader
2. Verify aria-label is announced
3. Expand details to reveal data table
4. Verify table structure with screen reader table navigation

**Estimated Effort:** 2 hours (all charts)

---

#### Issue 1.4: Recent Logins Table Missing Accessibility Features

**Severity:** 🟡 High (WCAG 2.1 Level A)

**Location:** Recent logins table (line ~350)

**Problem:**
- Table missing `<caption>` element
- Headers lack proper `scope` attributes
- No keyboard navigation for table rows
- Status badges use color only

**Impact:**
- Screen readers cannot announce table purpose
- Table navigation confusing for assistive tech users
- Status not conveyed to screen readers

**Fix:**
```jsx
// Current:
<table className="min-w-full divide-y divide-slate-200">
  <thead className="bg-slate-50">
    <tr>
      <th className="px-6 py-3 text-right...">المستخدم</th>

// Replace with:
<table className="min-w-full divide-y divide-slate-200">
  <caption className="sr-only">آخر تسجيلات الدخول للمستخدمين</caption>
  <thead className="bg-slate-50">
    <tr>
      <th scope="col" className="px-6 py-3 text-right...">المستخدم</th>
      <th scope="col" className="px-6 py-3 text-right...">الدور</th>
      {/* ... */}
    </tr>
  </thead>
  <tbody>
    {data.recentLogins.map((user, index) => (
      <tr 
        key={`user-${user.id || index}`}
        tabIndex={0}
        className={/* ... */}
        role="row"
      >
        <td scope="row" className="px-6 py-4...">
          {/* User info */}
        </td>
```

**Acceptance Criteria:**
- [ ] Table has visible or sr-only caption
- [ ] All `<th>` elements have `scope="col"`
- [ ] First cell in each row has `scope="row"`
- [ ] Status badges include sr-only text

**Verification Steps:**
1. Navigate to table with screen reader
2. Verify caption announced before table
3. Use table navigation (Ctrl+Alt+Arrow keys in NVDA)
4. Verify headers announced with each cell

**Estimated Effort:** 45 minutes

---

#### Issue 1.5: Loading and Error States Missing Proper ARIA

**Severity:** 🟢 Medium (WCAG 2.1 Level AA)

**Location:** `LoadingState` and error handling (line ~70, ~100)

**Problem:**
- Loading spinner lacks `role="status"` and `aria-live`
- Error message not announced to screen readers
- No focus management after error

**Impact:**
- Screen readers don't announce loading state
- Users unaware of errors without visual inspection

**Fix:**
```jsx
// Loading state:
function LoadingState() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-label="جاري تحميل البيانات">
      <span className="sr-only">جاري تحميل لوحة التحكم...</span>
      {/* skeleton content */}
    </div>
  );
}

// Error state:
if (isError) {
  return (
    <div className="space-y-6">
      {/* ... */}
      <div 
        className="rounded-2xl border border-red-200..."
        role="alert"
        aria-live="assertive"
        tabIndex={-1}
        ref={errorRef}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10..." aria-hidden="true">
            {/* icon */}
          </div>
          <div>
            <h3 className="text-sm font-medium text-red-800">خطأ في تحميل البيانات</h3>
            <p className="mt-1 text-sm text-red-700">{handleApiError(error)}</p>
          </div>
        </div>
```

**Acceptance Criteria:**
- [ ] Loading state has `role="status"` and `aria-live="polite"`
- [ ] Error state has `role="alert"` and `aria-live="assertive"`
- [ ] Focus moves to error message on error
- [ ] Retry button is keyboard accessible

**Verification Steps:**
1. Trigger loading state
2. Verify screen reader announces "جاري تحميل..."
3. Trigger error state
4. Verify screen reader announces error immediately
5. Tab to retry button and press Enter

**Estimated Effort:** 30 minutes

---

### 1.3 Dashboard Summary

**Total Issues:** 5  
**Critical:** 1 | **High:** 3 | **Medium:** 1  
**Total Estimated Effort:** 5 hours 15 minutes

**Priority Order:**
1. Issue 1.1 (Semantic structure) - Foundation for all other fixes
2. Issue 1.3 (Chart accessibility) - Highest user impact
3. Issue 1.2 (Metric cards) - Frequently used component
4. Issue 1.4 (Table accessibility) - Data integrity
5. Issue 1.5 (Loading/error states) - Polish

---

## 2. /admin/users — Users Management

**Route:** `/admin/users`  
**Component:** `UserManagement.jsx`  
**Current Status:** ✅ Fully implemented with CRUD, filtering, sorting, bulk actions

### 2.1 Sections Inspected

- Page header with title and actions
- Search and filter controls
- Sortable data table with user information
- Bulk selection and actions toolbar
- User form modal (create/edit)
- Confirmation dialogs
- Pagination controls
- Temporary password modal

---

### 2.2 Issues, Impact, and Fixes

#### Issue 2.1: Missing Main Landmark and Page Structure

**Severity:** 🔴 Critical (WCAG 2.1 Level A)

**Location:** Root element (line ~1150)

**Problem:**
- Component wrapped in `<main>` but missing proper document structure
- H1 has ID but not used consistently
- No skip link to main content

**Impact:**
- Inconsistent landmark navigation
- Screen readers may not identify page purpose immediately

**Fix:**
```jsx
// Current (line ~1150):
<main aria-labelledby="user-management-title">
  <div className="space-y-6">
    <div className="flex flex-col gap-4...">
      <div>
        <h1 id="user-management-title" className="text-2xl...">

// Add skip link at app level and ensure consistent structure:
// In DashboardLayout.jsx:
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg">
  تخطي إلى المحتوى الرئيسي
</a>

// In UserManagement.jsx:
<main id="main-content" aria-labelledby="user-management-title">
  <div className="space-y-6">
    <header>
      <h1 id="user-management-title" className="text-2xl...">
        إدارة المستخدمين والصلاحيات
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        تحكم بحسابات الفريق وتابع نشاطهم من مكان واحد.
      </p>
    </header>
```

**Acceptance Criteria:**
- [ ] Skip link visible on focus
- [ ] Main landmark has ID matching skip link href
- [ ] H1 properly associated with main via aria-labelledby
- [ ] Header wraps title and description

**Verification Steps:**
1. Tab from page load - skip link should be first focusable element
2. Press Enter on skip link - focus moves to main content
3. Screen reader announces main landmark with title

**Estimated Effort:** 45 minutes

---

#### Issue 2.2: Search Input Missing Form Semantics

**Severity:** 🟡 High (WCAG 2.1 Level A)

**Location:** Search input (line ~1160)

**Problem:**
- Search input not wrapped in `<form>` element
- No associated `<label>` (only placeholder)
- Icon decorative but not marked as such
- No search button for non-JS users

**Impact:**
- Screen readers don't announce input purpose clearly
- Form submission not accessible via Enter key in all browsers
- Search icon confusing for screen readers

**Fix:**
```jsx
// Current:
<div className="relative w-full lg:max-w-sm">
  <MagnifyingGlassIcon className="pointer-events-none absolute left-3..." />
  <input
    type="search"
    value={search}
    onChange={(event) => { /* ... */ }}
    placeholder="ابحث بالاسم أو البريد الإلكتروني..."

// Replace with:
<form 
  role="search" 
  onSubmit={(e) => e.preventDefault()}
  className="relative w-full lg:max-w-sm"
>
  <label htmlFor="user-search" className="sr-only">
    البحث عن مستخدم بالاسم أو البريد الإلكتروني أو رقم الهاتف
  </label>
  <MagnifyingGlassIcon 
    className="pointer-events-none absolute left-3..." 
    aria-hidden="true"
  />
  <input
    id="user-search"
    type="search"
    value={search}
    onChange={(event) => {
      setSearch(event.target.value);
      setPageState(1);
    }}
    placeholder="ابحث بالاسم أو البريد الإلكتروني أو رقم الهاتف"
    className="w-full rounded-2xl..."
    aria-describedby="search-hint"
  />
  <span id="search-hint" className="sr-only">
    اضغط Enter للبحث، سيتم التحديث تلقائياً أثناء الكتابة
  </span>
</form>
```

**Acceptance Criteria:**
- [ ] Search wrapped in `<form role="search">`
- [ ] Input has associated `<label>` (visible or sr-only)
- [ ] Icon marked with `aria-hidden="true"`
- [ ] Input has `aria-describedby` for usage hint

**Verification Steps:**
1. Navigate to search with screen reader
2. Verify "search" landmark announced
3. Verify label and hint announced with input
4. Type and verify debounced search works
5. Press Enter and verify form doesn't reload page

**Estimated Effort:** 30 minutes

---

#### Issue 2.3: Filter Menus Missing Keyboard Navigation and ARIA

**Severity:** 🟡 High (WCAG 2.1 Level A)

**Location:** `FilterMenu` component (line ~200)

**Problem:**
- Headless UI Menu used but missing some ARIA attributes
- Active filter not announced to screen readers
- No keyboard shortcut hints
- Filter count not conveyed

**Impact:**
- Screen readers don't announce current filter selection
- Keyboard users unaware of available shortcuts

**Fix:**
```jsx
// Enhance FilterMenu component:
function FilterMenu({ value, options, onChange, placeholder, label }) {
  const activeOption = options.find((option) => option.value === value) ?? options[0];
  const activeCount = value !== 'all' ? 1 : 0;

  return (
    <Menu as="div" className="relative inline-block text-right">
      {({ open }) => (
        <>
          <Menu.Button 
            className="inline-flex items-center gap-2..."
            aria-label={`${label}: ${activeOption?.label}`}
            aria-expanded={open}
            aria-haspopup="true"
          >
            <FunnelIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span>{activeOption?.label ?? placeholder}</span>
            {activeCount > 0 && (
              <span 
                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs text-white"
                aria-label={`${activeCount} فلتر نشط`}
              >
                {activeCount}
              </span>
            )}
          </Menu.Button>
          <Transition /* ... */>
            <Menu.Items 
              className="absolute left-0 z-20..."
              aria-label={`خيارات ${label}`}
            >
              {options.map((option) => (
                <Menu.Item key={option.value}>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() => onChange(option.value)}
                      className={clsx(/* ... */)}
                      role="menuitemradio"
                      aria-checked={option.value === value}
                    >
                      <span>{option.label}</span>
                      {option.value === value && (
                        <>
                          <CheckCircleIcon className="h-4 w-4 text-primary-500" aria-hidden="true" />
                          <span className="sr-only">(محدد)</span>
                        </>
                      )}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
}

// Update usage:
<FilterMenu
  value={filters.role}
  options={ROLE_FILTER_OPTIONS}
  onChange={(value) => { /* ... */ }}
  placeholder="الأدوار"
  label="تصفية حسب الدور"
/>
```

**Acceptance Criteria:**
- [ ] Menu button has descriptive `aria-label`
- [ ] Menu items use `role="menuitemradio"`
- [ ] Active selection has `aria-checked="true"`
- [ ] Filter count badge announced to screen readers
- [ ] Keyboard navigation works (Arrow keys, Enter, Escape)

**Verification Steps:**
1. Tab to filter button
2. Press Enter to open menu
3. Use arrow keys to navigate options
4. Verify screen reader announces checked state
5. Press Enter to select, Escape to close

**Estimated Effort:** 1 hour

---

#### Issue 2.4: Data Table Missing Critical Accessibility Features

**Severity:** 🔴 Critical (WCAG 2.1 Level A)

**Location:** Users table (line ~1200)

**Problem:**
- Table missing `<caption>` element
- Sortable headers don't announce sort state
- Checkbox column missing proper labels
- Row actions menu not keyboard accessible from table navigation
- No aria-sort on sortable columns

**Impact:**
- Screen readers cannot understand table purpose
- Sort state not conveyed to assistive tech users
- Keyboard users cannot access row actions efficiently

**Fix:**
```jsx
// Add table caption and improve structure:
<div className="relative overflow-hidden rounded-3xl...">
  <div className="overflow-x-auto" role="region" aria-labelledby="users-table-caption" tabIndex={0}>
    <table className="min-w-full divide-y divide-slate-200">
      <caption id="users-table-caption" className="sr-only">
        جدول المستخدمين - {total} مستخدم - الصفحة {currentPage} من {totalPages}
      </caption>
      <thead className="bg-slate-50 shadow-sm">
        <tr>
          <th scope="col" className="sticky top-0 z-10 w-12 px-6 py-3">
            <input
              type="checkbox"
              className="h-4 w-4..."
              checked={allSelected}
              onChange={handleToggleSelectAll}
              disabled={allSelectionDisabled}
              aria-label={allSelected ? "إلغاء تحديد جميع المستخدمين" : "تحديد جميع المستخدمين"}
            />
          </th>
          {/* Sortable headers with aria-sort */}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {users.map((user) => (
          <tr key={userId} className={clsx(/* ... */)}>
            <td className="w-12 px-6 py-4">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggleSelect(userId)}
                aria-label={`تحديد ${user.fullName ?? user.full_name}`}
              />
            </td>
            {/* ... */}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

// Update SortableHeader component:
function SortableHeader({ label, field, sort, onSort, align = 'right' }) {
  const isActive = sort.field === field;
  const direction = isActive ? sort.direction : null;
  const ariaSortValue = isActive 
    ? (direction === 'asc' ? 'ascending' : 'descending')
    : 'none';

  return (
    <th
      scope="col"
      className={clsx(/* ... */)}
      aria-sort={ariaSortValue}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-2..."
        aria-label={`ترتيب حسب ${label}${isActive ? ` - ${direction === 'asc' ? 'تصاعدي' : 'تنازلي'}` : ''}`}
      >
        <span>{label}</span>
        <BarsArrowDownIcon
          className={clsx(/* ... */)}
          aria-hidden="true"
        />
      </button>
    </th>
  );
}
```

**Acceptance Criteria:**
- [ ] Table has caption (visible or sr-only) with summary
- [ ] All checkboxes have descriptive aria-label
- [ ] Sortable headers have aria-sort attribute
- [ ] Sort buttons announce current sort state
- [ ] Table wrapper has role="region" for scrolling

**Verification Steps:**
1. Navigate to table with screen reader
2. Verify caption announced before table
3. Navigate to sort header and verify state announced
4. Click sort button and verify new state announced
5. Navigate to checkbox and verify label includes user name

**Estimated Effort:** 2 hours

---

#### Issue 2.5: User Form Modal Missing Focus Management

**Severity:** 🟡 High (WCAG 2.1 Level A)

**Location:** `UserForm` component (line ~600)

**Problem:**
- Focus not trapped within modal when open
- Focus not moved to modal on open
- Focus not returned to trigger button on close
- Close button not first focusable element
- No Escape key handler

**Impact:**
- Keyboard users can tab out of modal to background
- Screen reader users may not know modal opened
- Disorienting experience when modal closes

**Fix:**
```jsx
import { Dialog, Transition } from '@headlessui/react';
import { useEffect, useRef } from 'react';

function UserForm({ user, onClose, onSuccess, onTempCredentials }) {
  const closeButtonRef = useRef(null);
  const [formData, setFormData] = useState(/* ... */);

  // Focus close button when modal opens
  useEffect(() => {
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, []);

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        onClose={onClose}
        initialFocus={closeButtonRef}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    {user ? 'تحديث المستخدم' : 'إضافة مستخدم جديد'}
                  </Dialog.Title>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-2..."
                    aria-label="إغلاق النافذة"
                  >
                    <XCircleIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <form className="px-6 py-6" onSubmit={handleSubmit}>
                  {/* Form fields */}
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
```

**Acceptance Criteria:**
- [ ] Focus moves to close button when modal opens
- [ ] Focus trapped within modal (Tab cycles through modal only)
- [ ] Escape key closes modal
- [ ] Focus returns to trigger button on close
- [ ] Modal has Dialog.Title for screen readers

**Verification Steps:**
1. Click "إضافة مستخدم" button
2. Verify focus moves to close button in modal
3. Tab through all form fields
4. Verify Tab from last field returns to close button
5. Press Escape and verify modal closes
6. Verify focus returns to "إضافة مستخدم" button

**Estimated Effort:** 1.5 hours

---

#### Issue 2.6: Form Validation Errors Not Announced

**Severity:** 🟡 High (WCAG 2.1 Level A)

**Location:** Form field validation (line ~700)

**Problem:**
- Field errors displayed visually but not announced
- No aria-invalid on error fields
- No aria-describedby linking errors to inputs
- General error not announced immediately

**Impact:**
- Screen reader users unaware of validation errors
- Must manually discover errors by navigating form

**Fix:**
```jsx
// Update form fields with proper ARIA:
<div>
  <label htmlFor="user-fullname" className="block text-sm font-medium text-slate-700">
    الاسم الكامل
    <span className="text-red-600" aria-label="مطلوب">*</span>
  </label>
  <input
    id="user-fullname"
    type="text"
    value={formData.fullName}
    onChange={(event) => setFormData((prev) => ({ ...prev, fullName: event.target.value }))}
    className={clsx(
      'mt-1 w-full rounded-xl border px-3 py-2...',
      fieldErrors.full_name ? 'border-red-300 focus:border-red-400' : 'border-slate-300...'
    )}
    placeholder="أدخل الاسم الكامل"
    disabled={mutation.isPending}
    required
    aria-required="true"
    aria-invalid={fieldErrors.full_name ? 'true' : 'false'}
    aria-describedby={fieldErrors.full_name ? 'fullname-error' : undefined}
  />
  {fieldErrors.full_name && (
    <p 
      id="fullname-error" 
      className="mt-1 text-sm text-red-600"
      role="alert"
    >
      {fieldErrors.full_name}
    </p>
  )}
</div>

// Add live region for general errors:
{generalError && (
  <div 
    className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    role="alert"
    aria-live="assertive"
  >
    <strong className="font-medium">خطأ في الحفظ:</strong> {generalError}
  </div>
)}
```

**Acceptance Criteria:**
- [ ] All required fields have `aria-required="true"`
- [ ] Error fields have `aria-invalid="true"`
- [ ] Error messages have `role="alert"`
- [ ] Error messages linked via `aria-describedby`
- [ ] General error announced immediately via `aria-live`

**Verification Steps:**
1. Submit form with empty required field
2. Verify screen reader announces "invalid" on field
3. Navigate to field and verify error message announced
4. Verify general error announced without navigation

**Estimated Effort:** 1 hour

---

#### Issue 2.7: Bulk Actions Toolbar Missing Accessibility

**Severity:** 🟡 High (WCAG 2.1 Level A)

**Location:** `BulkToolbar` component (line ~550)

**Problem:**
- Toolbar appears/disappears without announcement
- Selected count not in live region
- Action buttons lack descriptive labels
- No keyboard shortcut to access toolbar

**Impact:**
- Screen reader users unaware toolbar appeared
- Unclear what actions will affect

**Fix:**
```jsx
function BulkToolbar({ count, onEnable, onDisable, onDelete, disabled, loading }) {
  return (
    <>
      {/* Announce toolbar appearance */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        تم تحديد {count} مستخدم. استخدم شريط الأدوات لتنفيذ إجراءات جماعية.
      </div>
      
      <div 
        className="fixed inset-x-0 bottom-6 flex justify-center px-4"
        role="toolbar"
        aria-label="إجراءات جماعية للمستخدمين المحددين"
      >
        <div className="flex items-center gap-3 rounded-full bg-white px-6 py-3 shadow-2xl ring-1 ring-slate-200">
          <span 
            className="text-sm font-medium text-slate-700"
            aria-live="polite"
            aria-atomic="true"
          >
            تم تحديد {count} مستخدم
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={onEnable}
            disabled={disabled || loading === 'enable'}
            loading={loading === 'enable'}
            aria-label={`تفعيل ${count} مستخدم محدد`}
          >
            تفعيل
          </Button>
          <Button
            size="sm"
            variant="warning"
            onClick={onDisable}
            disabled={disabled || loading === 'disable'}
            loading={loading === 'disable'}
            aria-label={`تعطيل ${count} مستخدم محدد`}
          >
            تعطيل
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={onDelete}
            disabled={disabled || loading === 'delete'}
            loading={loading === 'delete'}
            aria-label={`حذف ${count} مستخدم محدد نهائياً`}
          >
            حذف
          </Button>
        </div>
      </div>
    </>
  );
}
```

**Acceptance Criteria:**
- [ ] Toolbar has `role="toolbar"` and descriptive `aria-label`
- [ ] Appearance announced via sr-only live region
- [ ] Selected count in `aria-live="polite"` region
- [ ] Action buttons have descriptive `aria-label` with count
- [ ] Keyboard shortcut (e.g., Alt+B) to focus toolbar

**Verification Steps:**
1. Select users via checkboxes
2. Verify screen reader announces toolbar appearance
3. Verify count updates announced
4. Tab to toolbar and verify buttons accessible
5. Verify button labels include count

**Estimated Effort:** 1 hour

---

#### Issue 2.8: Pagination Controls Missing ARIA

**Severity:** 🟢 Medium (WCAG 2.1 Level AA)

**Location:** Pagination section (line ~1300)

**Problem:**
- Pagination not wrapped in `<nav>` landmark
- Current page not announced to screen readers
- Page size selector missing label
- Previous/Next buttons don't indicate disabled state clearly

**Impact:**
- Screen readers don't identify pagination controls
- Current page position unclear

**Fix:**
```jsx
<nav 
  aria-label="صفحات جدول المستخدمين"
  className="flex flex-col gap-3 rounded-3xl..."
>
  <div aria-live="polite" aria-atomic="true">
    عرض {(currentPage - 1) * pageSize + 1} إلى {Math.min(currentPage * pageSize, total)} من أصل {total} مستخدم
  </div>
  <div className="flex flex-wrap items-center gap-3">
    <label className="flex items-center gap-2">
      <span id="page-size-label">عدد الصفوف:</span>
      <select
        value={pageSize}
        onChange={(event) => { /* ... */ }}
        className="rounded-lg border..."
        aria-labelledby="page-size-label"
      >
        {PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>
    </label>
    <div className="flex items-center gap-1" role="group" aria-label="التنقل بين الصفحات">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setPageState((prev) => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        icon={ChevronRightIcon}
        aria-label="الصفحة السابقة"
        aria-disabled={currentPage === 1}
      >
        السابق
      </Button>
      <span 
        className="px-3 py-1 text-sm font-medium text-slate-700"
        aria-current="page"
        aria-label={`الصفحة ${currentPage} من ${totalPages}`}
      >
        {currentPage} / {totalPages}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setPageState((prev) => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        icon={ChevronLeftIcon}
        iconPosition="right"
        aria-label="الصفحة التالية"
        aria-disabled={currentPage === totalPages}
      >
        التالي
      </Button>
    </div>
  </div>
</nav>
```

**Acceptance Criteria:**
- [ ] Pagination wrapped in `<nav aria-label="...">`
- [ ] Current page has `aria-current="page"`
- [ ] Page range in `aria-live="polite"` region
- [ ] Disabled buttons have `aria-disabled="true"`
- [ ] Page size selector has associated label

**Verification Steps:**
1. Navigate to pagination with screen reader
2. Verify "navigation" landmark announced
3. Verify current page announced with aria-current
4. Change page and verify range update announced
5. Verify disabled state announced on buttons

**Estimated Effort:** 45 minutes

---

### 2.3 Users Management Summary

**Total Issues:** 8  
**Critical:** 2 | **High:** 5 | **Medium:** 1  
**Total Estimated Effort:** 9 hours 30 minutes

**Priority Order:**
1. Issue 2.4 (Table accessibility) - Core functionality
2. Issue 2.5 (Modal focus management) - Critical UX
3. Issue 2.6 (Form validation) - Data integrity
4. Issue 2.3 (Filter menus) - Frequent use
5. Issue 2.7 (Bulk actions) - Power user feature
6. Issue 2.2 (Search semantics) - Discoverability
7. Issue 2.1 (Page structure) - Foundation
8. Issue 2.8 (Pagination) - Polish

---

## 3. /admin/notifications — Notifications Center

**Route:** `/admin/notifications`  
**Component:** `NotificationCenter.jsx`  
**Current Status:** ✅ Implemented with filtering, creation, and management

### 3.1 Issues, Impact, and Fixes

#### Issue 3.1: Missing Semantic Structure and ARIA

**Severity:** 🔴 Critical (WCAG 2.1 Level A)

**Location:** Root container and notification items

**Problem:**
- No main landmark or H1
- Notification items lack proper ARIA roles
- Unread count badge not announced
- Filter form missing proper semantics

**Fix:**
```jsx
<main aria-labelledby="notifications-title">
  <div className="space-y-6">
    <header className="flex items-center justify-between">
      <div>
        <h1 id="notifications-title" className="text-2xl font-semibold text-slate-800">
          مركز الإشعارات
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          إدارة ومتابعة جميع الإشعارات في النظام
        </p>
      </div>
      <div className="flex items-center gap-3">
        {unreadCount > 0 && (
          <span 
            className="inline-flex items-center gap-1..."
            role="status"
            aria-live="polite"
            aria-label={`${unreadCount} إشعار غير مقروء`}
          >
            <BellIcon className="h-4 w-4" aria-hidden="true" />
            {unreadCount} غير مقروءة
          </span>
        )}
```

**Estimated Effort:** 1 hour

---

#### Issue 3.2: Notification Items Missing Accessibility

**Severity:** 🟡 High (WCAG 2.1 Level A)

**Location:** `NotificationItem` component

**Problem:**
- Items not keyboard accessible
- Action buttons lack descriptive labels
- Priority/type badges use color only
- No focus management

**Fix:**
```jsx
function NotificationItem({ notification, onMarkAsRead, onArchive }) {
  return (
    <article 
      className={`rounded-lg border p-4...`}
      aria-labelledby={`notification-${notification.id}-title`}
      aria-describedby={`notification-${notification.id}-message`}
      tabIndex={0}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10..." aria-hidden="true">
          {getNotificationIcon(notification.type, notification.priority)}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 
                  id={`notification-${notification.id}-title`}
                  className="font-medium text-slate-800"
                >
                  {notification.title}
                </h3>
                <span 
                  className={`inline-flex items-center px-2 py-1...`}
                  role="status"
                  aria-label={`الأولوية: ${PRIORITY_LABELS[notification.priority]}`}
                >
                  {PRIORITY_LABELS[notification.priority]}
                </span>
```

**Estimated Effort:** 1.5 hours

---

#### Issue 3.3: Create Form Modal Missing Focus Trap

**Severity:** 🟡 High (WCAG 2.1 Level A)

**Location:** `CreateNotificationForm` component

**Problem:**
- No focus trap in modal
- Focus not managed on open/close
- Form validation errors not announced

**Fix:** Use Headless UI Dialog (same pattern as UserForm in Issue 2.5)

**Estimated Effort:** 1.5 hours

---

### 3.2 Notifications Summary

**Total Issues:** 3  
**Critical:** 1 | **High:** 2  
**Total Estimated Effort:** 4 hours

---

## 4. /admin/audit-logs — Audit Logs

**Route:** `/admin/audit-logs`  
**Component:** `AuditLogs.jsx`  
**Current Status:** ✅ Implemented with filtering and details view

### 4.1 Issues, Impact, and Fixes

#### Issue 4.1: Missing Semantic Structure

**Severity:** 🔴 Critical (WCAG 2.1 Level A)

**Location:** Root container

**Problem:**
- No main landmark or H1
- Log entries not marked as articles
- Filter form missing fieldset/legend

**Fix:**
```jsx
<main aria-labelledby="audit-logs-title">
  <div className="space-y-6">
    <header>
      <h1 id="audit-logs-title" className="text-2xl font-semibold text-slate-800">
        سجلات النظام (Audit Logs)
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        متابعة جميع الأنشطة والتغييرات في النظام
      </p>
    </header>
```

**Estimated Effort:** 45 minutes

---

#### Issue 4.2: Log Entries Missing Accessibility

**Severity:** 🟡 High (WCAG 2.1 Level A)

**Location:** `AuditLogEntry` component

**Problem:**
- Entries not keyboard accessible
- Details toggle not announced
- Action icons decorative but not marked
- Timestamp format not accessible

**Fix:**
```jsx
function AuditLogEntry({ log }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <article 
      className="rounded-lg border border-slate-100 p-4"
      aria-labelledby={`log-${log.id}-action`}
      tabIndex={0}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8..." aria-hidden="true">
          {getActionIcon(log.action)}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span 
                id={`log-${log.id}-action`}
                className="font-medium text-slate-800"
              >
                {ACTION_LABELS[log.action] || log.action}
              </span>
              <span className="text-sm text-slate-500">
                {ENTITY_LABELS[log.entity] || log.entity}
              </span>
            </div>
            <time 
              className="flex items-center gap-2 text-sm text-slate-500"
              dateTime={log.createdAt}
            >
              <ClockIcon className="h-4 w-4" aria-hidden="true" />
              {new Date(log.createdAt).toLocaleString('ar-JO')}
            </time>
          </div>

          {log.changes && Object.keys(log.changes).length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-primary-600 hover:text-primary-700"
                aria-expanded={showDetails}
                aria-controls={`log-${log.id}-details`}
              >
                {showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
              </button>
              {showDetails && (
                <div 
                  id={`log-${log.id}-details`}
                  className="mt-2 rounded-md bg-slate-50 p-3 text-sm"
                  role="region"
                  aria-label="تفاصيل التغييرات"
                >
```

**Estimated Effort:** 1 hour

---

#### Issue 4.3: Filter Form Missing Accessibility

**Severity:** 🟡 High (WCAG 2.1 Level A)

**Location:** `AuditLogFilters` component

**Problem:**
- Date inputs missing proper labels
- Selects missing associated labels
- Clear button not descriptive

**Fix:**
```jsx
function AuditLogFilters({ filters, onFiltersChange, users }) {
  return (
    <div className="card">
      <h3 className="mb-4 font-medium text-slate-800">تصفية السجلات</h3>
      <form role="search" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="grid gap-4 md:grid-cols-5">
          <legend className="sr-only">معايير تصفية سجلات النظام</legend>
          
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-slate-700">
              تاريخ البداية
            </label>
            <input
              id="start-date"
              type="date"
              value={filters.startDate}
              onChange={(e) => onFiltersChange(prev => ({ ...prev, startDate: e.target.value }))}
              className="mt-1 block w-full..."
              aria-describedby="date-range-hint"
            />
          </div>
          
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-slate-700">
              تاريخ النهاية
            </label>
            <input
              id="end-date"
              type="date"
              value={filters.endDate}
              onChange={(e) => onFiltersChange(prev => ({ ...prev, endDate: e.target.value }))}
              className="mt-1 block w-full..."
              aria-describedby="date-range-hint"
            />
          </div>
          <span id="date-range-hint" className="sr-only">
            اختر نطاق التاريخ لتصفية السجلات
          </span>
```

**Estimated Effort:** 45 minutes

---

#### Issue 4.4: Statistics Cards Missing Accessibility

**Severity:** 🟢 Medium (WCAG 2.1 Level AA)

**Location:** Summary statistics section

**Problem:**
- Statistics not in proper semantic structure
- Numbers not associated with labels for screen readers

**Fix:**
```jsx
<section aria-labelledby="stats-title" className="card">
  <h2 id="stats-title" className="mb-4 font-medium text-slate-800">
    إحصائيات السجلات
  </h2>
  <div className="grid gap-4 md:grid-cols-4">
    <div className="text-center" role="group" aria-labelledby="create-stat">
      <div className="text-2xl font-bold text-green-600" aria-label="عدد عمليات الإنشاء">
        {auditLogs.filter(log => log.action === 'create').length}
      </div>
      <div id="create-stat" className="text-sm text-slate-500">عمليات إنشاء</div>
    </div>
```

**Estimated Effort:** 30 minutes

---

### 4.2 Audit Logs Summary

**Total Issues:** 4  
**Critical:** 1 | **High:** 2 | **Medium:** 1  
**Total Estimated Effort:** 3 hours

---

## 5. /admin/settings — Settings

**Route:** `/admin/settings`  
**Component:** `Settings.jsx`  
**Current Status:** ✅ Implemented with governorates, age categories, and report templates

### 5.1 Issues, Impact, and Fixes

#### Issue 5.1: Missing Semantic Structure and ARIA

**Severity:** 🔴 Critical (WCAG 2.1 Level A)

**Location:** Root container and tabs

**Problem:**
- No main landmark or H1
- Tabs missing proper ARIA tablist pattern
- Tab panels not associated with tabs
- No keyboard navigation for tabs

**Fix:**
```jsx
<main aria-labelledby="settings-title">
  <div className="space-y-6">
    <header>
      <h1 id="settings-title" className="text-2xl font-semibold text-slate-800">
        الإعدادات
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        إدارة المحافظات والفئات العمرية وقوالب التقارير
      </p>
    </header>

    {/* Tabs with proper ARIA */}
    <div className="border-b border-slate-200">
      <nav 
        role="tablist" 
        aria-label="إعدادات النظام"
        className="-mb-px flex space-x-8"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              id={`${tab.id}-tab`}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => {
                // Arrow key navigation
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const currentIndex = tabs.findIndex(t => t.id === activeTab);
                  const nextIndex = e.key === 'ArrowRight' 
                    ? (currentIndex + 1) % tabs.length
                    : (currentIndex - 1 + tabs.length) % tabs.length;
                  setActiveTab(tabs[nextIndex].id);
                }
              }}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>

    {/* Tab Panels */}
    <div>
      <div
        role="tabpanel"
        id="governorates-panel"
        aria-labelledby="governorates-tab"
        hidden={activeTab !== 'governorates'}
      >
        {activeTab === 'governorates' && <GovernoratesSettings />}
      </div>
      <div
        role="tabpanel"
        id="age-categories-panel"
        aria-labelledby="age-categories-tab"
        hidden={activeTab !== 'age-categories'}
      >
        {activeTab === 'age-categories' && <AgeCategoriesSettings />}
      </div>
      <div
        role="tabpanel"
        id="report-templates-panel"
        aria-labelledby="report-templates-tab"
        hidden={activeTab !== 'report-templates'}
      >
        {activeTab === 'report-templates' && <ReportTemplatesSettings />}
      </div>
    </div>
  </div>
</main>
```

**Acceptance Criteria:**
- [ ] Tabs use proper ARIA tablist pattern
- [ ] Arrow keys navigate between tabs
- [ ] Tab panels associated with tabs via aria-controls/aria-labelledby
- [ ] Only active tab is in tab order (tabIndex)
- [ ] Screen reader announces tab selection

**Verification Steps:**
1. Tab to tab list
2. Use arrow keys to navigate tabs
3. Verify screen reader announces "tab X of Y selected"
4. Verify panel content changes with tab selection

**Estimated Effort:** 2 hours

---

#### Issue 5.2: Governorates List Missing Accessibility

**Severity:** 🟡 High (WCAG 2.1 Level A)

**Location:** `GovernoratesSettings` component

**Problem:**
- Add form missing proper labels
- Edit mode not announced to screen readers
- Delete confirmation uses window.confirm (not accessible)
- Action buttons lack descriptive labels

**Fix:**
```jsx
function GovernoratesSettings() {
  // ... state

  return (
    <section aria-labelledby="governorates-heading">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <MapPinIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
          <h2 id="governorates-heading" className="text-lg font-semibold text-slate-800">
            إدارة المحافظات
          </h2>
        </div>

        {/* Add New Governorate */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleAdd(); }}
          className="mb-6 flex gap-2"
        >
          <label htmlFor="new-governorate" className="sr-only">
            اسم المحافظة الجديدة
          </label>
          <input
            id="new-governorate"
            type="text"
            placeholder="اسم المحافظة الجديدة"
            value={newGovernorate}
            onChange={(e) => setNewGovernorate(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2..."
            aria-describedby="governorate-hint"
          />
          <span id="governorate-hint" className="sr-only">
            أدخل اسم المحافظة واضغط إضافة
          </span>
          <button
            type="submit"
            disabled={!newGovernorate.trim() || addMutation.isPending}
            className="flex items-center gap-2..."
            aria-label="إضافة محافظة جديدة"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            إضافة
          </button>
        </form>

        {/* Governorates List */}
        <ul className="space-y-2" role="list" aria-label="قائمة المحافظات">
          {governorates?.map((governorate) => (
            <li 
              key={governorate} 
              className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
            >
              {editingGovernorate === governorate ? (
                <div className="flex flex-1 items-center gap-2" role="group" aria-label="تحرير المحافظة">
                  <label htmlFor={`edit-${governorate}`} className="sr-only">
                    تحديث اسم المحافظة
                  </label>
                  <input
                    id={`edit-${governorate}`}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 rounded-md border border-slate-300 px-3 py-1 text-sm..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                    aria-label={`تحديث ${governorate}`}
                  />
                  <button
                    onClick={handleSaveEdit}
                    className="rounded p-1 text-green-600 hover:bg-green-50"
                    aria-label="حفظ التغييرات"
                  >
                    <CheckIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingGovernorate(null);
                      setEditValue('');
                    }}
                    className="rounded p-1 text-red-600 hover:bg-red-50"
                    aria-label="إلغاء التحرير"
                  >
                    <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-slate-800">{governorate}</span>
                  <div className="flex gap-1" role="group" aria-label={`إجراءات ${governorate}`}>
                    <button
                      onClick={() => handleEdit(governorate)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      aria-label={`تحديث ${governorate}`}
                    >
                      <PencilIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(governorate)}
                      className="rounded p-1 text-red-400 hover:bg-red-100 hover:text-red-600"
                      aria-label={`حذف ${governorate}`}
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Replace window.confirm with accessible dialog */}
      {confirmDelete && (
        <ConfirmDialog
          open={true}
          title="حذف المحافظة"
          description={`هل أنت متأكد من حذف محافظة "${confirmDelete}"؟`}
          onConfirm={() => {
            deleteMutation.mutate(confirmDelete);
            setConfirmDelete(null);
          }}
          onClose={() => setConfirmDelete(null)}
          variant="danger"
        />
      )}
    </section>
  );
}
```

**Estimated Effort:** 2 hours

---

#### Issue 5.3: Age Categories Form Missing Accessibility

**Severity:** 🟡 High (WCAG 2.1 Level A)

**Location:** `AgeCategoriesSettings` component

**Problem:**
- Edit form fields missing proper labels
- Number inputs missing min/max constraints
- No validation feedback
- Cancel/Save buttons not clearly associated with form

**Fix:**
```jsx
{editingCategory === category.id ? (
  <form 
    onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}
    className="space-y-3"
    aria-label="تحديث الفئة العمرية"
  >
    <div>
      <label htmlFor={`category-name-${category.id}`} className="block text-sm font-medium text-slate-700">
        اسم الفئة العمرية
        <span className="text-red-600" aria-label="مطلوب">*</span>
      </label>
      <input
        id={`category-name-${category.id}`}
        type="text"
        placeholder="اسم الفئة العمرية"
        value={editForm.name}
        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2..."
        required
        aria-required="true"
      />
    </div>
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <label htmlFor={`min-days-${category.id}`} className="block text-sm font-medium text-slate-700">
          الحد الأدنى (بالأيام)
        </label>
        <input
          id={`min-days-${category.id}`}
          type="number"
          min="0"
          value={editForm.minDays}
          onChange={(e) => setEditForm(prev => ({ ...prev, minDays: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2..."
          aria-describedby={`min-days-hint-${category.id}`}
        />
        <span id={`min-days-hint-${category.id}`} className="sr-only">
          أدخل الحد الأدنى للعمر بالأيام
        </span>
      </div>
      <div>
        <label htmlFor={`max-months-${category.id}`} className="block text-sm font-medium text-slate-700">
          الحد الأقصى (بالأشهر)
        </label>
        <input
          id={`max-months-${category.id}`}
          type="number"
          min="0"
          value={editForm.maxMonths}
          onChange={(e) => setEditForm(prev => ({ ...prev, maxMonths: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2..."
          aria-describedby={`max-months-hint-${category.id}`}
        />
        <span id={`max-months-hint-${category.id}`} className="sr-only">
          أدخل الحد الأقصى للعمر بالأشهر، اتركه فارغاً لغير محدود
        </span>
      </div>
    </div>
    <div className="flex justify-end gap-2" role="group" aria-label="إجراءات النموذج">
      <button
        type="button"
        onClick={() => {
          setEditingCategory(null);
          setEditForm({ name: '', minDays: '', maxMonths: '' });
        }}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        إلغاء
      </button>
      <button
        type="submit"
        disabled={updateMutation.isPending}
        className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
      </button>
    </div>
  </form>
) : (
  // ... display mode
)}
```

**Estimated Effort:** 1.5 hours

---

#### Issue 5.4: Report Templates Toggle Missing Accessibility

**Severity:** 🟡 High (WCAG 2.1 Level A)

**Location:** `ReportTemplatesSettings` component

**Problem:**
- Toggle switches not keyboard accessible
- Switch state not announced to screen readers
- No proper role for switch
- Status badge uses color only

**Fix:**
```jsx
<div className="flex items-center gap-3">
  <span 
    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      template.isActive
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800'
    }`}
    aria-hidden="true"
  >
    {template.isActive ? 'فعال' : 'غير فعال'}
  </span>
  <button
    role="switch"
    aria-checked={template.isActive}
    aria-label={`${template.isActive ? 'تعطيل' : 'تفعيل'} ${template.name}`}
    onClick={() => toggleTemplate(template.id)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
      template.isActive ? 'bg-primary-600' : 'bg-slate-200'
    }`}
  >
    <span className="sr-only">
      {template.isActive ? 'تعطيل' : 'تفعيل'} {template.name}
    </span>
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        template.isActive ? 'translate-x-6' : 'translate-x-1'
      }`}
      aria-hidden="true"
    />
  </button>
</div>
```

**Estimated Effort:** 1 hour

---

### 5.2 Settings Summary

**Total Issues:** 4  
**Critical:** 1 | **High:** 3  
**Total Estimated Effort:** 6.5 hours

---

## 6. Cross-Cutting Concerns

### 6.1 Global Issues Affecting All Admin Pages

#### Issue 6.1: Inconsistent Focus Indicators

**Severity:** 🔴 Critical (WCAG 2.1 Level AA)

**Problem:**
- Focus indicators not visible on all interactive elements
- Contrast ratio below 3:1 in some cases
- Focus lost when modals open/close

**Fix:** Add global focus styles in CSS:
```css
/* In global.css or tailwind config */
*:focus-visible {
  outline: 2px solid theme('colors.primary.500');
  outline-offset: 2px;
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid theme('colors.primary.500');
  outline-offset: 2px;
  box-shadow: 0 0 0 4px theme('colors.primary.100');
}
```

**Estimated Effort:** 2 hours (testing across all pages)

---

#### Issue 6.2: Missing Skip Links

**Severity:** 🟡 High (WCAG 2.1 Level A)

**Problem:**
- No skip link to main content
- Keyboard users must tab through entire navigation

**Fix:** Add in DashboardLayout component:
```jsx
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg"
>
  تخطي إلى المحتوى الرئيسي
</a>
```

**Estimated Effort:** 1 hour

---

#### Issue 6.3: Inconsistent Error Handling

**Severity:** 🟡 High (WCAG 2.1 Level A)

**Problem:**
- Errors not consistently announced to screen readers
- No standard error component
- Focus not moved to errors

**Fix:** Create standardized ErrorAlert component:
```jsx
function ErrorAlert({ title, message, onRetry, onDismiss }) {
  const errorRef = useRef(null);

  useEffect(() => {
    errorRef.current?.focus();
  }, []);

  return (
    <div
      ref={errorRef}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      tabIndex={-1}
      className="rounded-xl border border-red-200 bg-red-50 p-4"
    >
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="h-5 w-5 text-red-600" aria-hidden="true" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
        </div>
      </div>
      {(onRetry || onDismiss) && (
        <div className="mt-3 flex gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              إعادة المحاولة
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              إغلاق
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

**Estimated Effort:** 3 hours (create component + refactor all pages)

---

#### Issue 6.4: Missing Loading States Announcements

**Severity:** 🟢 Medium (WCAG 2.1 Level AA)

**Problem:**
- Loading states not announced to screen readers
- No consistent loading component

**Fix:** Create LoadingAnnouncer component:
```jsx
function LoadingAnnouncer({ message = "جاري التحميل..." }) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      <span className="sr-only">{message}</span>
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" aria-hidden="true" />
      </div>
    </div>
  );
}
```

**Estimated Effort:** 2 hours

---

#### Issue 6.5: RTL Support Incomplete

**Severity:** 🟢 Medium (UX)

**Problem:**
- Some components not properly mirrored for RTL
- Icons and spacing inconsistent in Arabic layout

**Fix:** Audit and fix RTL issues:
- Ensure `dir="rtl"` on html element
- Use logical properties (margin-inline-start instead of margin-left)
- Test all components in RTL mode

**Estimated Effort:** 4 hours

---

#### Issue 6.6: Color Contrast Issues

**Severity:** 🟡 High (WCAG 2.1 Level AA)

**Problem:**
- Some text/background combinations below 4.5:1 ratio
- Placeholder text too light
- Disabled state text unreadable

**Fix:** Audit and update color palette:
```js
// Update colors in tailwind.config.js
colors: {
  slate: {
    400: '#94a3b8', // Ensure 4.5:1 on white
    500: '#64748b', // Ensure 4.5:1 on white
    600: '#475569', // Ensure 7:1 on white
  }
}
```

**Estimated Effort:** 3 hours (audit + fixes)

---

### 6.2 Cross-Cutting Summary

**Total Issues:** 6  
**Critical:** 1 | **High:** 3 | **Medium:** 2  
**Total Estimated Effort:** 15 hours

---

## 7. Prioritized Remediation Roadmap

### 7.1 Executive Summary

**Total Issues Identified:** 30  
**Breakdown by Severity:**
- 🔴 Critical: 7 issues (23%)
- 🟡 High: 18 issues (60%)
- 🟢 Medium: 5 issues (17%)

**Total Estimated Effort:** 52.5 hours (~6.5 developer days)

**WCAG 2.1 Compliance Status:**
- Current: ~60% compliant (estimated)
- After remediation: ~95% compliant (Level AA)

---

### 7.2 Sprint-Based Remediation Plan

#### Sprint 1: Critical Foundations (2 days / 16 hours)

**Goal:** Fix all critical semantic structure and navigation issues

**Issues:**
1. ✅ Issue 1.1 - Dashboard semantic structure (30 min)
2. ✅ Issue 2.1 - Users page structure + skip links (45 min)
3. ✅ Issue 2.4 - Users table accessibility (2 hours)
4. ✅ Issue 3.1 - Notifications semantic structure (1 hour)
5. ✅ Issue 4.1 - Audit logs semantic structure (45 min)
6. ✅ Issue 5.1 - Settings tabs ARIA pattern (2 hours)
7. ✅ Issue 6.1 - Global focus indicators (2 hours)
8. ✅ Issue 6.2 - Skip links implementation (1 hour)

**Deliverables:**
- All pages have proper main landmarks and H1
- Skip links functional on all pages
- Focus indicators visible and consistent
- Tables have proper semantic structure

**Acceptance Criteria:**
- Screen reader can navigate all pages via landmarks
- Keyboard users can skip navigation
- All interactive elements have visible focus
- Tables announce structure correctly

---

#### Sprint 2: Forms and Modals (2 days / 16 hours)

**Goal:** Fix all form validation and modal accessibility

**Issues:**
1. ✅ Issue 2.5 - User form modal focus management (1.5 hours)
2. ✅ Issue 2.6 - Form validation errors (1 hour)
3. ✅ Issue 3.3 - Notification form modal (1.5 hours)
4. ✅ Issue 5.2 - Governorates form accessibility (2 hours)
5. ✅ Issue 5.3 - Age categories form (1.5 hours)
6. ✅ Issue 6.3 - Standardized error handling (3 hours)
7. ✅ Issue 2.2 - Search form semantics (30 min)

**Deliverables:**
- All modals trap focus properly
- Form errors announced to screen readers
- All inputs have proper labels
- Standardized ErrorAlert component

**Acceptance Criteria:**
- Focus trapped in modals
- Escape closes modals
- Form errors announced immediately
- All inputs keyboard accessible

---

#### Sprint 3: Interactive Components (1.5 days / 12 hours)

**Goal:** Fix all interactive widgets and controls

**Issues:**
1. ✅ Issue 1.2 - Metric cards accessibility (1 hour)
2. ✅ Issue 2.3 - Filter menus ARIA (1 hour)
3. ✅ Issue 2.7 - Bulk actions toolbar (1 hour)
4. ✅ Issue 3.2 - Notification items (1.5 hours)
5. ✅ Issue 4.2 - Audit log entries (1 hour)
6. ✅ Issue 4.3 - Audit log filters (45 min)
7. ✅ Issue 5.4 - Report template toggles (1 hour)
8. ✅ Issue 2.8 - Pagination controls (45 min)

**Deliverables:**
- All menus keyboard navigable
- Toggles use proper switch role
- Bulk actions announced
- Filters accessible

**Acceptance Criteria:**
- Arrow keys navigate menus
- Switches announce state
- Toolbar appearance announced
- Pagination keyboard accessible

---

#### Sprint 4: Data Visualization and Polish (1 day / 8.5 hours)

**Goal:** Fix charts, tables, and remaining UX issues

**Issues:**
1. ✅ Issue 1.3 - Charts accessible alternatives (2 hours)
2. ✅ Issue 1.4 - Recent logins table (45 min)
3. ✅ Issue 1.5 - Loading/error states (30 min)
4. ✅ Issue 4.4 - Statistics cards (30 min)
5. ✅ Issue 6.4 - Loading announcements (2 hours)
6. ✅ Issue 6.5 - RTL support (4 hours)
7. ✅ Issue 6.6 - Color contrast (3 hours)

**Deliverables:**
- Charts have data table alternatives
- All tables properly structured
- Loading states announced
- RTL fully supported
- Color contrast meets WCAG AA

**Acceptance Criteria:**
- Chart data accessible without vision
- All text meets 4.5:1 contrast
- RTL layout correct
- Loading announced to screen readers

---

### 7.3 Testing and QA Requirements

#### Automated Testing

**Tools Required:**
- axe DevTools (browser extension)
- Pa11y CI (command line)
- WAVE (browser extension)
- Lighthouse (Chrome DevTools)

**Test Commands:**
```bash
# Run accessibility tests
npm run test:a11y

# Generate accessibility report
npm run a11y:report

# Check color contrast
npm run contrast:check
```

**Acceptance Criteria:**
- 0 critical axe violations
- Lighthouse accessibility score ≥ 95
- WAVE reports 0 errors

---

#### Manual Testing Checklist

**Keyboard Navigation:**
- [ ] Tab through all pages without mouse
- [ ] All interactive elements reachable
- [ ] Focus visible on all elements
- [ ] No keyboard traps
- [ ] Skip links work on all pages
- [ ] Modal focus management correct
- [ ] Tab order logical

**Screen Reader Testing (NVDA/JAWS):**
- [ ] All pages have proper landmarks
- [ ] Headings create logical outline
- [ ] Forms announce labels and errors
- [ ] Tables announce structure
- [ ] Dynamic content announced
- [ ] Loading states announced
- [ ] Error messages announced
- [ ] Button purposes clear

**Visual Testing:**
- [ ] Focus indicators visible (3:1 contrast)
- [ ] Text contrast ≥ 4.5:1 (normal text)
- [ ] Text contrast ≥ 3:1 (large text)
- [ ] Color not sole indicator
- [ ] RTL layout correct
- [ ] Zoom to 200% without loss

**Functional Testing:**
- [ ] All forms submittable via keyboard
- [ ] All modals closable via Escape
- [ ] All menus navigable via arrows
- [ ] All tables sortable via keyboard
- [ ] All filters operable via keyboard
- [ ] All bulk actions accessible

---

### 7.4 Implementation Guidelines

#### Code Review Checklist

Before merging any accessibility fix, verify:

**Semantic HTML:**
- [ ] Proper heading hierarchy (H1 → H2 → H3)
- [ ] Landmarks used (main, nav, header, footer)
- [ ] Lists use ul/ol/li
- [ ] Tables use thead/tbody/th/td
- [ ] Forms use label/input/fieldset/legend

**ARIA Usage:**
- [ ] ARIA only when HTML insufficient
- [ ] aria-label on icon-only buttons
- [ ] aria-labelledby for complex labels
- [ ] aria-describedby for hints/errors
- [ ] aria-live for dynamic content
- [ ] aria-invalid on error fields
- [ ] aria-required on required fields

**Keyboard Support:**
- [ ] All interactive elements focusable
- [ ] Tab order logical
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals/menus
- [ ] Arrow keys navigate menus/tabs
- [ ] No keyboard traps

**Focus Management:**
- [ ] Focus visible (outline + box-shadow)
- [ ] Focus moved to modals on open
- [ ] Focus returned on modal close
- [ ] Focus moved to errors on submit
- [ ] Focus not lost on dynamic updates

---

### 7.5 Success Metrics

#### Quantitative Metrics

**Before Remediation:**
- Lighthouse Accessibility Score: ~70
- axe Violations: ~45 critical/serious
- WCAG 2.1 Level A Compliance: ~60%
- WCAG 2.1 Level AA Compliance: ~40%

**After Remediation (Target):**
- Lighthouse Accessibility Score: ≥ 95
- axe Violations: 0 critical, < 5 moderate
- WCAG 2.1 Level A Compliance: 100%
- WCAG 2.1 Level AA Compliance: ≥ 95%

#### Qualitative Metrics

**User Experience:**
- Keyboard users can complete all tasks
- Screen reader users understand all content
- No confusion about interactive elements
- Error messages clear and actionable
- Loading states communicated clearly

**Developer Experience:**
- Reusable accessible components
- Clear accessibility documentation
- Automated testing in CI/CD
- Accessibility linting enabled

---

### 7.6 Maintenance Plan

#### Ongoing Accessibility

**Pre-Commit Hooks:**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint:a11y"
    }
  }
}
```

**CI/CD Integration:**
```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests
on: [push, pull_request]
jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: npm run build
      - run: npm run test:a11y
      - run: npm run lighthouse:ci
```

**Monthly Audits:**
- Run full axe scan on all pages
- Test with real screen reader users
- Review new components for accessibility
- Update documentation

**Training:**
- Accessibility workshop for all developers
- Screen reader demo sessions
- Keyboard navigation training
- ARIA best practices review

---

### 7.7 Risk Assessment

#### High Risk Items

**Issue 2.4 - Table Accessibility (Critical)**
- **Risk:** Complex table structure may break existing functionality
- **Mitigation:** Thorough testing with screen readers, staged rollout
- **Rollback Plan:** Feature flag to revert to old table

**Issue 5.1 - Tabs ARIA Pattern (Critical)**
- **Risk:** Arrow key navigation may conflict with existing shortcuts
- **Mitigation:** Document keyboard shortcuts, user testing
- **Rollback Plan:** Disable arrow navigation if issues found

**Issue 6.1 - Global Focus Indicators (Critical)**
- **Risk:** May affect visual design significantly
- **Mitigation:** Design review, A/B testing
- **Rollback Plan:** Adjust colors/styles while maintaining contrast

#### Medium Risk Items

**Issue 2.5 - Modal Focus Management**
- **Risk:** May break existing modal workflows
- **Mitigation:** Test all modal use cases
- **Rollback Plan:** Conditional focus trap

**Issue 6.3 - Standardized Error Handling**
- **Risk:** Large refactor across many files
- **Mitigation:** Incremental migration, backward compatibility
- **Rollback Plan:** Keep old error components temporarily

---

### 7.8 Budget and Resources

#### Developer Time

**Total Effort:** 52.5 hours (6.5 days)

**Breakdown:**
- Sprint 1 (Critical): 16 hours
- Sprint 2 (Forms): 16 hours
- Sprint 3 (Interactive): 12 hours
- Sprint 4 (Polish): 8.5 hours

**Team Allocation:**
- 1 Senior Frontend Developer (full-time)
- 1 QA Engineer (part-time, testing)
- 1 Accessibility Specialist (consulting, 8 hours)

#### Tools and Services

**Required:**
- axe DevTools Pro: $0 (free tier sufficient)
- Pa11y CI: $0 (open source)
- NVDA Screen Reader: $0 (free)
- Lighthouse: $0 (built into Chrome)

**Optional:**
- JAWS Screen Reader: $95/year (for comprehensive testing)
- Accessibility consulting: $150/hour × 8 hours = $1,200

**Total Budget:** ~$1,200 (optional consulting only)

---

### 7.9 Deliverables Checklist

#### Documentation

- [ ] Updated component documentation with accessibility notes
- [ ] Keyboard shortcuts reference guide
- [ ] Screen reader testing guide
- [ ] Accessibility statement for website
- [ ] VPAT (Voluntary Product Accessibility Template)

#### Code

- [ ] All 30 issues resolved
- [ ] Automated tests passing
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] Merged to main branch

#### Testing

- [ ] Lighthouse score ≥ 95
- [ ] axe violations = 0 critical
- [ ] Manual keyboard testing passed
- [ ] Screen reader testing passed
- [ ] Color contrast verified

#### Training

- [ ] Developer accessibility workshop completed
- [ ] QA team trained on accessibility testing
- [ ] Documentation reviewed by team
- [ ] Ongoing maintenance plan established

---

## 8. Conclusion

This comprehensive audit has identified 30 accessibility and usability issues across the admin surface of the Nursery Management System. The issues range from critical WCAG 2.1 Level A violations to medium-priority UX improvements.

**Key Findings:**
- **Semantic Structure:** Most pages lack proper landmarks and heading hierarchy
- **Keyboard Navigation:** Many interactive elements not keyboard accessible
- **Screen Reader Support:** Missing ARIA attributes and announcements
- **Form Accessibility:** Validation errors not announced, labels missing
- **Focus Management:** Inconsistent focus indicators and modal traps

**Recommended Approach:**
Follow the 4-sprint remediation plan, prioritizing critical issues first. This will bring the system from ~60% WCAG compliance to ≥95% compliance in approximately 6.5 developer days.

**Expected Outcomes:**
- Fully keyboard accessible admin interface
- Screen reader compatible
- WCAG 2.1 Level AA compliant
- Improved UX for all users
- Reduced legal/compliance risk

**Next Steps:**
1. Review and approve this audit with stakeholders
2. Allocate developer resources for Sprint 1
3. Set up automated accessibility testing in CI/CD
4. Begin implementation following the sprint plan
5. Conduct user testing with assistive technology users

---

## Appendix A: WCAG 2.1 Success Criteria Mapping

| Issue | WCAG Criterion | Level | Status |
|-------|---------------|-------|--------|
| 1.1, 2.1, 3.1, 4.1, 5.1 | 2.4.1 Bypass Blocks | A | ❌ Fail |
| 1.1, 2.1, 3.1, 4.1, 5.1 | 1.3.1 Info and Relationships | A | ❌ Fail |
| 1.2, 2.4, 3.2, 4.2, 5.2 | 4.1.2 Name, Role, Value | A | ❌ Fail |
| 1.3, 4.4 | 1.1.1 Non-text Content | A | ❌ Fail |
| 1.4, 2.4 | 1.3.1 Info and Relationships | A | ❌ Fail |
| 1.5, 6.4 | 4.1.3 Status Messages | AA | ❌ Fail |
| 2.2, 4.3 | 3.3.2 Labels or Instructions | A | ❌ Fail |
| 2.3, 5.1 | 4.1.2 Name, Role, Value | A | ❌ Fail |
| 2.5, 3.3 | 2.4.3 Focus Order | A | ❌ Fail |
| 2.6 | 3.3.1 Error Identification | A | ❌ Fail |
| 2.6 | 3.3.3 Error Suggestion | AA | ❌ Fail |
| 2.7 | 4.1.3 Status Messages | AA | ❌ Fail |
| 2.8 | 2.4.1 Bypass Blocks | A | ❌ Fail |
| 5.4 | 4.1.2 Name, Role, Value | A | ❌ Fail |
| 6.1 | 2.4.7 Focus Visible | AA | ❌ Fail |
| 6.2 | 2.4.1 Bypass Blocks | A | ❌ Fail |
| 6.6 | 1.4.3 Contrast (Minimum) | AA | ❌ Fail |

---

## Appendix B: Testing Tools and Resources

### Browser Extensions
- **axe DevTools** - https://www.deque.com/axe/devtools/
- **WAVE** - https://wave.webaim.org/extension/
- **Lighthouse** - Built into Chrome DevTools
- **Accessibility Insights** - https://accessibilityinsights.io/

### Screen Readers
- **NVDA** (Windows, Free) - https://www.nvaccess.org/
- **JAWS** (Windows, Paid) - https://www.freedomscientific.com/products/software/jaws/
- **VoiceOver** (macOS/iOS, Built-in) - Native to Apple devices
- **TalkBack** (Android, Built-in) - Native to Android

### Command Line Tools
```bash
# Install Pa11y
npm install -g pa11y pa11y-ci

# Run Pa11y on a page
pa11y http://localhost:5174/admin/dashboard

# Run Pa11y CI on multiple pages
pa11y-ci --config .pa11yci.json
```

### Online Resources
- **WCAG 2.1 Guidelines** - https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices** - https://www.w3.org/WAI/ARIA/apg/
- **WebAIM** - https://webaim.org/
- **A11y Project** - https://www.a11yproject.com/

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Author:** Amazon Q Developer  
**Review Status:** Pending Stakeholder Approval

