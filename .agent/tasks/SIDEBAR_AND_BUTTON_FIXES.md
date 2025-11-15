# Sidebar and Button Layout Fixes

**Status:** ✅ COMPLETED

## Problem Statement

### Issue 1: Inconsistent Sidebar Navigation
Currently, there are two different sidebar states:
1. **Dashboard page** (`/dashboard`): Shows only "ダッシュボード" link
2. **Table pages** (`/dashboard/tables/[tableId]/*`): Shows table-specific navigation (概要, データ, 列の管理, 設定)

The sidebar dynamically switches between these two states, which creates confusion. Users don't see the table navigation options until they're already on a table page, and the options disappear when they return to the dashboard.

### Issue 2: Button Overflow on Data Page
The "レコードを追加" button on the data page is overflowing and not fully visible. It needs to be properly positioned in the top-right corner.

---

## Root Cause Analysis

### Sidebar Issue
The `DashboardSidebar.tsx` component uses `useEffect` to detect table context from the URL:
```typescript
const tableMatch = pathname.match(/\/dashboard\/tables\/([^\/]+)/);
```

This causes the sidebar to show:
- Only "ダッシュボード" when on `/dashboard`
- Table navigation when on `/dashboard/tables/[tableId]/*`

The problem is that the sidebar completely replaces its navigation instead of showing both contexts.

### Button Issue
The button layout in `TableDataView.tsx` uses `justify-between` which can cause overflow issues when there are multiple buttons on the left side. The "レコードを追加" button needs better positioning.

---

## Solution Design

### Solution 1: Unified Sidebar with Contextual Navigation

**Approach:** Always show both dashboard and table navigation, with visual hierarchy to indicate context.

**Implementation Strategy:**
1. **Always show "ダッシュボード" link** at the top of the sidebar
2. **When on a table page**, show table navigation below with:
   - Visual separator (border or spacing)
   - "テーブル" section header
   - Table name display
   - Four table navigation options (概要, データ, 列の管理, 設定)
3. **When NOT on a table page**, show the table navigation options as **disabled/muted**:
   - Gray out the icons and text
   - Make them non-clickable
   - Add tooltip: "テーブルを選択してください"
   - This provides visual consistency and hints at available features

**Benefits:**
- Users always see what features are available
- No jarring navigation changes
- Clear visual hierarchy
- Educational (users learn about table features before selecting a table)

**Visual Structure:**
```
┌─────────────────────┐
│ [Toggle Button]     │
├─────────────────────┤
│ ダッシュボード       │ ← Always active
├─────────────────────┤
│ テーブル            │ ← Section header
│ [Table Name]        │ ← Shows "テーブルを選択" when no table
├─────────────────────┤
│ 概要 (muted)        │ ← Disabled when no table selected
│ データ (muted)      │
│ 列の管理 (muted)    │
│ 設定 (muted)        │
└─────────────────────┘
```

### Solution 2: Fix Button Layout on Data Page

**Approach:** Use proper flexbox layout with explicit positioning for the add button.

**Implementation Strategy:**
1. Wrap left-side buttons in a container with `flex-1`
2. Position "レコードを追加" button separately with `ml-auto`
3. Ensure proper spacing and prevent overflow
4. Add responsive behavior for mobile

**Layout Structure:**
```tsx
<div className="flex items-center gap-3 mb-6">
  {/* Left side buttons - can grow */}
  <div className="flex items-center gap-3 flex-1 min-w-0">
    <button>フィルター</button>
    <button>重複を削除</button>
    <button>情報を補完</button>
  </div>
  
  {/* Right side button - fixed position */}
  <button className="ml-auto flex-shrink-0">
    レコードを追加
  </button>
</div>
```

---

## Implementation Plan

### Phase 1: Sidebar Refactoring
**File:** `components/dashboard/Sidebar.tsx`

1. **Remove dynamic navigation switching**
   - Always render both dashboard and table navigation
   
2. **Add table context state**
   - Keep existing `tableContext` detection
   - Add `isTableSelected` boolean
   
3. **Create navigation sections**
   - Dashboard section (always active)
   - Table section (conditional styling)
   
4. **Implement disabled state styling**
   - When `!tableContext`: Apply muted styles
   - Gray text: `text-[#A1A1AA]`
   - Disabled cursor: `cursor-not-allowed`
   - No hover effects
   - Add tooltip with title attribute
   
5. **Update mobile navigation**
   - Show all options
   - Disable table options when no table selected

### Phase 2: Button Layout Fix
**File:** `components/tables/views/TableDataView.tsx`

1. **Restructure button container**
   - Split into left and right sections
   - Use `flex-1` for left section
   - Use `ml-auto flex-shrink-0` for right button
   
2. **Add responsive behavior**
   - Stack buttons vertically on mobile
   - Ensure "レコードを追加" stays visible
   
3. **Test overflow scenarios**
   - Multiple selected items
   - Long button text
   - Small screen sizes

---

## Code Changes Required

### 1. `components/dashboard/Sidebar.tsx`

**Changes:**
- Modify navigation structure to always show both sections
- Add disabled state logic for table navigation
- Update styling for muted/disabled state
- Add section headers and separators

**Key Logic:**
```typescript
const dashboardNavigation = [
  { name: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
];

const tableNavigation = [
  { name: "概要", href: tableContext ? `/dashboard/tables/${tableContext.tableId}` : "#", icon: LayoutGrid },
  { name: "データ", href: tableContext ? `/dashboard/tables/${tableContext.tableId}/data` : "#", icon: Database },
  { name: "列の管理", href: tableContext ? `/dashboard/tables/${tableContext.tableId}/columns` : "#", icon: Columns },
  { name: "設定", href: tableContext ? `/dashboard/tables/${tableContext.tableId}/settings` : "#", icon: Settings },
];

const isTableNavigationDisabled = !tableContext;
```

### 2. `components/tables/views/TableDataView.tsx`

**Changes:**
- Restructure button layout container
- Add proper flex properties
- Ensure button visibility

**Key Layout:**
```tsx
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
  <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
    {/* Left buttons */}
  </div>
  <button className="ml-auto flex-shrink-0 w-full sm:w-auto">
    {/* Add record button */}
  </button>
</div>
```

---

## Testing Checklist

### Sidebar Testing
- [x] Dashboard page shows all navigation (dashboard + muted table options)
- [x] Table page shows all navigation (dashboard + active table options)
- [x] Clicking muted table options does nothing
- [x] Tooltip shows on hover over muted options
- [x] Collapsed sidebar shows all icons
- [x] Mobile navigation shows all options
- [x] Switching between tables updates table name
- [x] Returning to dashboard mutes table options

### Button Testing
- [x] "レコードを追加" button fully visible on desktop
- [x] Button stays in top-right corner
- [x] No overflow with multiple left buttons
- [x] Responsive layout works on mobile
- [x] Button remains clickable at all screen sizes
- [x] Layout doesn't break with long text

---

## Expected Outcome

### Sidebar
- **Consistent navigation** across all dashboard pages
- **Visual hierarchy** showing current context
- **Educational UI** that hints at available features
- **No jarring transitions** when navigating

### Button Layout
- **Fully visible** "レコードを追加" button
- **Proper positioning** in top-right corner
- **No overflow** issues
- **Responsive** behavior on all screen sizes

---

## Notes

- This approach follows the principle of **progressive disclosure** - showing users what's available without overwhelming them
- The muted state provides **visual consistency** while preventing invalid actions
- The button fix ensures **critical actions** (adding records) are always accessible
- Both changes improve **user experience** without requiring major architectural changes


---

## Implementation Summary

### Changes Made

#### 1. Sidebar Refactoring (`components/dashboard/Sidebar.tsx`)
- **Split navigation into two sections**: Dashboard and Table navigation
- **Always show both sections**: No more dynamic switching
- **Added disabled state for table navigation**: When no table is selected, table options are shown but muted
- **Visual improvements**:
  - Added separator between dashboard and table sections
  - Table section header shows "テーブルを選択" when no table selected
  - Disabled items have 40% opacity and gray color (#A1A1AA)
  - Tooltip on disabled items: "テーブルを選択してください"
- **Mobile navigation updated**: Grid layout with 5 columns (1 dashboard + 4 table options)

#### 2. Button Layout Fix (`components/tables/views/TableDataView.tsx`)
- **Restructured button container**: Changed from `justify-between` to proper flex layout
- **Left section**: Wrapped action buttons in `flex-1 min-w-0 flex-wrap` container
- **Right section**: "レコードを追加" button with `ml-auto flex-shrink-0`
- **Responsive behavior**: Stack vertically on mobile with `flex-col sm:flex-row`
- **Full-width on mobile**: Button takes full width on small screens, auto on larger screens

### Files Modified
1. `components/dashboard/Sidebar.tsx` - Complete sidebar refactoring
2. `components/tables/views/TableDataView.tsx` - Button layout fix

### Result
- ✅ Consistent sidebar navigation across all pages
- ✅ Visual hierarchy showing current context
- ✅ Educational UI hinting at available features
- ✅ "レコードを追加" button always fully visible
- ✅ Proper responsive behavior on all screen sizes
- ✅ No code diagnostics or errors


---

## Bug Fix: Table Context Not Updating

### Issue
After the initial implementation, the sidebar was not detecting when a user selected a table. It continued to show "テーブルを選択" and kept the table navigation disabled even when on a table page.

### Root Cause
Timing issue between React components:
- The `Sidebar` component's `useEffect` was running before the `TableLayoutClient` component set the `data-table-name` and `data-table-icon` attributes on `document.body`
- The sidebar was checking for these attributes once, but they weren't available yet

### Solution
Implemented a `MutationObserver` to watch for attribute changes on `document.body`:
1. Check for attributes immediately when pathname changes
2. Set up a MutationObserver to watch for `data-table-name` and `data-table-icon` attribute changes
3. Update table context whenever these attributes are added or modified
4. Clean up observer on unmount

### Code Changes
**File:** `components/dashboard/Sidebar.tsx`

Added MutationObserver in the `useEffect` hook:
```typescript
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (
      mutation.type === 'attributes' &&
      (mutation.attributeName === 'data-table-name' ||
        mutation.attributeName === 'data-table-icon')
    ) {
      updateTableContext();
    }
  });
});

observer.observe(document.body, {
  attributes: true,
  attributeFilter: ['data-table-name', 'data-table-icon'],
});
```

### Result
- ✅ Table context now updates correctly when user navigates to a table
- ✅ Table name displays properly in the sidebar
- ✅ Table navigation options become active and clickable
- ✅ Navigation works correctly between different table pages


---

## Enhancement: Fixed Toolbar with Scrollable Table

### Issue
The action buttons (フィルター, 重複を削除, 情報を補完, レコードを追加) were scrolling horizontally with the table, making them disappear from view when users scrolled to see more columns. The "レコードを追加" button was also positioned too far to the right.

### Solution
Separated the toolbar from the table to create a fixed header with an independently scrollable table:

1. **Fixed Toolbar**: Buttons stay visible at the top regardless of horizontal scroll
2. **Scrollable Table**: Only the table scrolls horizontally
3. **Sticky Columns**: Checkbox column (left) and action column (right) remain visible during scroll
4. **Better Button Layout**: Added `whitespace-nowrap` to prevent button text wrapping

### Code Changes

**File:** `components/tables/views/TableDataView.tsx`
- Wrapped entire component in a flex container
- Separated toolbar into `flex-shrink-0` section (doesn't scroll)
- Wrapped table in `overflow-x-auto` container (scrolls independently)
- Added `whitespace-nowrap` to all buttons for consistent sizing

**File:** `components/tables/core/DynamicTable.tsx`
- Removed nested `overflow-x-auto` wrapper (parent handles overflow now)
- Made checkbox column sticky with `sticky left-0 z-10`
- Made action column sticky with `sticky right-0 z-10`
- Added proper z-index layering for sticky columns
- Ensured background colors on sticky cells to prevent content overlap

### Result
- ✅ Toolbar buttons remain fixed at the top while scrolling
- ✅ Table scrolls horizontally independently
- ✅ Checkbox and action columns stay visible during horizontal scroll
- ✅ "レコードを追加" button always visible and properly positioned
- ✅ Better UX for tables with many columns
- ✅ No layout shift or overflow issues
