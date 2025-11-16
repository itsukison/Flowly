# Deduplication Feature Implementation

**Status**: ✅ Complete  
**Date**: 2024-11-15  
**Related Files**:
- `components/tables/modals/DeduplicationModal.tsx` (NEW)
- `components/tables/views/DiceTableView.tsx` (MODIFIED)
- `components/ui/radio-group.tsx` (NEW)
- `components/ui/label.tsx` (NEW)

---

## Requirements

Replace the Short/medium/tall button in the data table view with a deduplication button that allows users to:

1. Select one or more columns to compare
2. Choose between two deduplication methods:
   - **Complete deduplication**: Exact match on selected columns
   - **Fuzzy match**: 80%+ similarity using Fuse.js
3. Preview detected duplicates before confirming deletion
4. For exact match: Auto-select all but first record in each group
5. For fuzzy match: Show by confidence level (low to high) and let users manually select

---

## Implementation

### 1. Dependencies Added
- `fuse.js` - Fuzzy search library for similarity matching
- `@radix-ui/react-radio-group` - Radio button component
- `@radix-ui/react-label` - Label component

### 2. New Components Created

#### DeduplicationModal (`components/tables/modals/DeduplicationModal.tsx`)
A two-step modal dialog:

**Step 1: Configuration**
- Radio buttons to select match type (exact vs fuzzy)
- Checkbox grid to select columns for comparison
- Filters out system columns (id, table_id, etc.)

**Step 2: Preview**
- Shows duplicate groups found
- For exact match: First record in each group is marked as "keep", others auto-selected for deletion
- For fuzzy match: Groups sorted by confidence (lowest first), no auto-selection
- Users can toggle selection for each record
- Shows selected column values for each record

**Features**:
- Handles both direct properties (name, email, company) and JSONB data fields
- Real-time duplicate detection using Fuse.js for fuzzy matching
- Confidence scoring for fuzzy matches
- Batch deletion with error handling

#### UI Components
- `components/ui/radio-group.tsx` - Radix UI radio group wrapper
- `components/ui/label.tsx` - Radix UI label wrapper

### 3. Modified Components

#### DiceTableView (`components/tables/views/DiceTableView.tsx`)
- Removed `DataGridRowHeightMenu` import and usage
- Added `DeduplicationModal` import
- Added "重複を削除" (Remove Duplicates) button in toolbar
- Added `isDeduplicationOpen` state
- Added `handleDeduplicationConfirm` callback for batch deletion
- Passes normalized records and columns to modal

---

## Technical Details

### Exact Match Algorithm
1. Filter out placeholder records (temp-*)
2. For each record, create a key by concatenating selected column values
3. Group records by key
4. Keep only groups with 2+ records
5. Auto-select all but first record in each group

### Fuzzy Match Algorithm
1. Filter out placeholder records
2. For each unprocessed record:
   - Create search text from selected columns
   - Use Fuse.js to find similar records in remaining records
   - Threshold: 0.2 (80% similarity)
   - Calculate confidence: (1 - score) * 100
3. Sort groups by confidence (lowest first for review)
4. No auto-selection - user must review

### Data Access Pattern
The modal correctly handles both:
- Direct properties: `record.name`, `record.email`, `record.company`
- JSONB fields: `record.data[columnName]`

### Deletion Flow
1. User selects records to delete in preview
2. On confirm, calls `onConfirm` with array of record IDs
3. Parent component (`DiceTableView`) handles API calls
4. Deletes records one by one via `/api/records/:id`
5. Refreshes page to show updated data

---

## User Experience

### Japanese UI
All text is in Japanese:
- "重複データの検出" - Duplicate Data Detection
- "完全一致" - Exact Match
- "あいまい一致" - Fuzzy Match
- "比較する列を選択" - Select Columns to Compare
- "保持するレコード" - Record to Keep
- "一致度" - Confidence Level

### Workflow
1. **Select rows** using checkboxes in the table (minimum 2 rows required)
2. Click "重複を削除 (N)" button in toolbar (shows count of selected rows)
3. Modal opens showing "選択された N 件のレコードから重複を検出します"
4. Select match type (exact or fuzzy)
5. Select columns to compare (at least 1 required)
6. Click "重複を検出" to find duplicates within selected rows
7. Review duplicate groups
8. Toggle selection for records to delete
9. Click "確認して削除" to confirm
10. Records are deleted and page refreshes

### Key Features
- Button is **disabled** until at least 2 rows are selected
- Button shows **count** of selected rows: "重複を削除 (5)"
- Only analyzes **selected rows**, not entire table
- Clear feedback about how many records are being analyzed

---

## Testing Checklist

- [x] Modal opens when button clicked
- [x] Column selection works
- [x] Match type toggle works
- [x] Exact match detects duplicates correctly
- [x] Fuzzy match detects similar records
- [x] Preview shows correct data
- [x] Record selection/deselection works
- [x] Deletion API calls work
- [x] Page refreshes after deletion
- [x] Error handling for failed deletions
- [x] TypeScript types are correct
- [x] No console errors

---

## Future Enhancements

1. **Bulk operations**: Allow selecting entire groups at once
2. **Merge instead of delete**: Combine data from duplicates
3. **Custom threshold**: Let users adjust fuzzy match sensitivity
4. **Preview before detection**: Show sample matches before full scan
5. **Undo functionality**: Allow reverting deletions
6. **Export duplicates**: Download list of duplicates as CSV
7. **Scheduled deduplication**: Auto-detect and notify about new duplicates

---

**Completed**: 2024-11-15  
**Tested**: ✅ All functionality working as expected
