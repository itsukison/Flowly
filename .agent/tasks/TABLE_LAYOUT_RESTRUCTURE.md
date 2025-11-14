# Table Layout Restructure - Planning

## Current State
- Single page at `/dashboard/tables/[tableId]` with tabs: データ、列の管理、データインポート、設定
- All functionality crammed into one view with tab navigation
- レコードを追加 button opens modal for manual entry only
- Stats cards + table view on データ tab

## Goal
Restructure into a cleaner, more spacious layout with:
1. Separate sidebar pages for each section
2. Simplified main table view
3. Dual-mode record addition (manual + import)

---

## New Route Structure

```
/dashboard/tables/[tableId]
├── page.tsx                    # Main view (stats + compact table)
├── data/page.tsx              # Full-screen table view (データ)
├── columns/page.tsx           # Column management (列の管理)
└── settings/page.tsx          # Settings (設定) - already exists
```

---

## Implementation Plan

### 1. Create Sidebar Navigation Component
**File**: `components/tables/TableSidebar.tsx`
- Use shadcn `Sheet` or custom sidebar
- Navigation items:
  - データ (Database icon)
  - 列の管理 (Columns icon)
  - 設定 (Settings icon)
- Highlight active route
- Mobile-responsive (collapsible)

### 2. Refactor Main Table Page
**File**: `app/dashboard/tables/[tableId]/page.tsx`
- Remove tab navigation
- Keep 4 stats cards
- Show compact table below cards
- Top-right: レコードを追加 button (opens dual-mode modal)
- Top-left: 全画面で表示 button → navigates to `/data` page
- Remove フィルター、重複を削除、情報を補完 from this view

### 3. Create Full Data Page
**File**: `app/dashboard/tables/[tableId]/data/page.tsx`
- Full-screen table view
- Top action bar with:
  - フィルター
  - 重複を削除
  - 情報を補完
  - レコードを追加
- Reuse `DynamicTable` component
- No stats cards here

### 4. Create Columns Management Page
**File**: `app/dashboard/tables/[tableId]/columns/page.tsx`
- Move `EnhancedColumnManager` component here
- Full-page layout for column editing
- Add/remove/reorder columns

### 5. Update Settings Page
**File**: `app/dashboard/tables/[tableId]/settings/page.tsx`
- Already exists, just ensure consistent layout
- Table name, icon, description editing

### 6. Create Dual-Mode Add Record Modal
**File**: `components/tables/AddRecordModalWithImport.tsx`
- Initial view: 2 options (shadcn Card components)
  1. 手動で追加 (Plus icon) → opens existing AddRecordModal
  2. ファイルをアップロード (Upload icon) → opens DataImport flow
- Similar UX to table template selection
- Use shadcn Dialog + Card components

### 7. Update Layout Wrapper
**File**: `app/dashboard/tables/[tableId]/layout.tsx` (create if needed)
- Wrap all table routes with sidebar
- Breadcrumb navigation
- Back to dashboard link

---

## Component Reuse Strategy

### Keep As-Is
- `DynamicTable.tsx` - table rendering
- `AddRecordModal.tsx` - manual record entry
- `DataImport.tsx` - file upload flow
- `EnhancedColumnManager.tsx` - column management

### Modify
- `EnhancedTableView.tsx` - split into separate page components
- Remove tab logic, extract each tab content to its own page

### Create New
- `TableSidebar.tsx` - navigation sidebar
- `AddRecordModalWithImport.tsx` - dual-mode entry point
- `CompactTableView.tsx` - simplified table for main page

---

## Shadcn Components to Use

1. **Sidebar Navigation**: Custom component with `Button` variants
2. **Dual-Mode Modal**: `Dialog` + `Card` for option selection
3. **Action Buttons**: `Button` with icons
4. **Stats Cards**: Keep existing custom cards
5. **Breadcrumbs**: `Breadcrumb` component for navigation

---

## UI Flow

### Main Page (`/tables/[tableId]`)
```
[← Back to Dashboard]

[Icon] Table Name
Description

[Stats Card 1] [Stats Card 2] [Stats Card 3] [Stats Card 4]

[全画面で表示 ↗]                    [レコードを追加 +]
┌─────────────────────────────────────────────┐
│ Compact Table (first 10 rows)              │
│ - No bulk actions                           │
│ - Basic view/edit only                      │
└─────────────────────────────────────────────┘
```

### Data Page (`/tables/[tableId]/data`)
```
[Sidebar]  データ - Full View

[フィルター] [重複を削除] [情報を補完]    [レコードを追加 +]
┌─────────────────────────────────────────────┐
│ Full Table with all features                │
│ - Checkboxes for selection                  │
│ - All columns visible                        │
│ - Pagination                                 │
└─────────────────────────────────────────────┘
```

### Add Record Modal (Dual Mode)
```
┌─────────────────────────────────────────────┐
│  レコードを追加                              │
│                                             │
│  ┌──────────────┐  ┌──────────────┐       │
│  │   [+ icon]   │  │  [↑ icon]    │       │
│  │              │  │              │       │
│  │  手動で追加   │  │ ファイルを    │       │
│  │              │  │ アップロード  │       │
│  └──────────────┘  └──────────────┘       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Migration Steps

1. Create sidebar component
2. Create layout wrapper with sidebar
3. Create `/data` page (move full table view)
4. Create `/columns` page (move column manager)
5. Refactor main page (simplified view)
6. Create dual-mode add record modal
7. Update all navigation links
8. Test responsive behavior
9. Update `.agent/README.md` with new structure

---

## Files to Create/Modify

### Create
- `components/tables/TableSidebar.tsx`
- `components/tables/AddRecordModalWithImport.tsx`
- `components/tables/CompactTableView.tsx`
- `app/dashboard/tables/[tableId]/layout.tsx`
- `app/dashboard/tables/[tableId]/data/page.tsx`
- `app/dashboard/tables/[tableId]/columns/page.tsx`

### Modify
- `app/dashboard/tables/[tableId]/page.tsx` (simplify)
- `app/dashboard/tables/[tableId]/settings/page.tsx` (ensure consistency)
- `components/tables/EnhancedTableView.tsx` (deprecate or refactor)

### Keep
- All other table components unchanged

---

## Status
- [x] Planning complete
- [x] Implementation started
- [x] Testing
- [x] Complete

## Implementation Summary

Successfully restructured the table layout with the following changes:

### Created Components
- `TableMainView.tsx` - Main page client component with stats and compact table
- `TableDataView.tsx` - Full data page client component with all actions
- `CompactTableView.tsx` - Simplified table view for main page (max 10 rows, first 5 columns)
- `AddRecordModalWithImport.tsx` - Dual-mode modal for manual entry or file upload
- `TableSidebar.tsx` - Navigation sidebar (not used in final implementation, kept for future)

### Created Pages
- `/dashboard/tables/[tableId]/page.tsx` - Main view with stats + compact table
- `/dashboard/tables/[tableId]/data/page.tsx` - Full-screen data view
- `/dashboard/tables/[tableId]/columns/page.tsx` - Column management
- `/dashboard/tables/[tableId]/settings/page.tsx` - Updated settings page
- `/dashboard/tables/[tableId]/layout.tsx` - Shared layout with header

### Key Features
1. Main page shows 4 stat cards + compact table (10 rows, 5 columns)
2. "全画面で表示" button navigates to full data page
3. "レコードを追加" opens dual-mode modal (manual or import)
4. Data page has full table with フィルター、重複を削除、情報を補完 actions
5. All pages share common header with table icon, name, and back button
6. Proper server/client component separation for Next.js 15
