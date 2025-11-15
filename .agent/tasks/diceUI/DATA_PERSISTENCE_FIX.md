# Data Persistence Fix Plan

## Problem Analysis

After analyzing the codebase, I've identified the root cause:

### Current Flow:
1. ✅ Cell variants call `meta?.onDataUpdate({ rowIndex, columnId, value })`
2. ❌ **CONFLICT**: `DiceTableView` passes `meta: { onDataUpdate: handleCellUpdate }` which **OVERRIDES** the built-in `onDataUpdate` from `useDataGrid`
3. ❌ The built-in `onDataUpdate` in `useDataGrid` (line ~420) calls `onDataChange` callback
4. ❌ But our custom `handleCellUpdate` in meta **shadows** the built-in one, breaking the flow
5. ✅ `handleDataChange` is passed but never gets called because the built-in `onDataUpdate` is overridden

**The Root Cause:** We're passing a custom `onDataUpdate` in the `meta` prop, which overrides the one that `useDataGrid` creates internally. This breaks the connection between cell edits and the `onDataChange` callback.

### Database Schema:
- `records` table has:
  - Direct columns: `name`, `email`, `company`, `status`
  - JSONB column: `data` (stores custom fields)
- API route `/api/records/[id]` correctly handles both types

## Solution

### The Fix (Minimal Changes):
**REMOVE** the custom `meta: { onDataUpdate: handleCellUpdate }` to let the built-in flow work.

**Current code in DiceTableView.tsx (line ~430):**
```tsx
meta: {
  onDataUpdate: handleCellUpdate,  // ❌ This OVERRIDES the built-in onDataUpdate
},
```

**The issue:** By passing our own `onDataUpdate` in meta, we're overriding the one that `useDataGrid` creates (which calls `onDataChange`). The built-in `onDataUpdate` at line ~420 in `useDataGrid` is designed to:
1. Take cell updates
2. Merge them into the data array
3. Call `onDataChange(newData)`

But our custom meta overrides it, so `onDataChange` never gets called!

### Implementation Steps:

1. **Remove the entire `meta` object** from `useDataGrid` call (lines ~430-432)
2. **Remove the `handleCellUpdate` function** (lines ~150-220) - it's dead code
3. **Modify `handleDataChange`** to detect changes and save them to API

### Code Changes:

**File: `components/tables/views/DiceTableView.tsx`**

**STEP 1: Remove these lines (~430-432):**
```tsx
meta: {
  onDataUpdate: handleCellUpdate,
},
```

**STEP 2: Remove the entire `handleCellUpdate` function (~150-220)**

**STEP 3: Replace the current `handleDataChange` callback with:**

```tsx
const handleDataChange = useCallback(
  async (newData: NormalizedTableRecord[]) => {
    console.log("Data changed:", newData);
    
    // Find what changed by comparing with current data
    const updates: Array<{ record: NormalizedTableRecord; changes: any }> = [];
    
    newData.forEach((newRecord, index) => {
      const oldRecord = data[index];
      if (!oldRecord || oldRecord.id !== newRecord.id) return;
      
      // Check for changes in direct fields
      const directFields = ['name', 'email', 'company', 'status'];
      const directChanges: any = {};
      let hasDirectChanges = false;
      
      directFields.forEach(field => {
        if (oldRecord[field] !== newRecord[field]) {
          directChanges[field] = newRecord[field];
          hasDirectChanges = true;
        }
      });
      
      // Check for changes in JSONB data
      const dataChanges: any = {};
      let hasDataChanges = false;
      
      const oldData = oldRecord.data || {};
      const newDataObj = newRecord.data || {};
      
      Object.keys(newDataObj).forEach(key => {
        if (oldData[key] !== newDataObj[key]) {
          dataChanges[key] = newDataObj[key];
          hasDataChanges = true;
        }
      });
      
      if (hasDirectChanges || hasDataChanges) {
        const payload: any = { ...directChanges };
        if (hasDataChanges) {
          payload.data = { ...oldData, ...dataChanges };
        }
        updates.push({ record: newRecord, changes: payload });
      }
    });
    
    // Update local state immediately for responsive UI
    setData(newData);
    
    // Save changes to API
    if (updates.length > 0) {
      setIsSaving(true);
      setSaveStatus("saving");
      
      try {
        await Promise.all(
          updates.map(({ record, changes }) =>
            fetch(`/api/records/${record.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(changes),
            }).then(res => {
              if (!res.ok) throw new Error("Failed to save");
              return res.json();
            })
          )
        );
        
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Error saving changes:", error);
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
        alert("変更の保存に失敗しました");
      } finally {
        setIsSaving(false);
      }
    }
  },
  [data]
);
```

**That's it!** No other changes needed.

## Why This Works:

1. **Dice UI's built-in flow**: 
   - Cell variants call `meta.onDataUpdate({ rowIndex, columnId, value })`
   - `useDataGrid` creates its own `onDataUpdate` function (line ~420) that merges changes into data
   - Then calls `onDataChange(newData)` callback
   
2. **Our implementation**:
   - We provide `handleDataChange` as the `onDataChange` callback
   - It compares old vs new data to detect changes
   - Saves changes to API via PATCH requests
   - Updates local state for responsive UI

3. **The fix**: By removing our custom `meta.onDataUpdate`, we let the built-in flow work as designed

## JSONB Handling:

The solution correctly handles JSONB fields because:
- `useDataGrid.onDataUpdate` merges changes into the data object
- Our `handleDataChange` detects changes in `record.data`
- API route merges JSONB data: `{ ...existingData, ...body.data }`

## Testing Checklist:

- [ ] Edit direct fields (name, email, company, status)
- [ ] Edit JSONB fields (custom columns)
- [ ] Edit multiple cells rapidly
- [ ] Check network tab for API calls
- [ ] Verify data persists after page refresh
- [ ] Test with different cell types (text, number, select, date, etc.)

## Implementation Status: ✅ COMPLETE (v4 - Final JSONB Fix)

### Changes Applied:

1. ✅ **Enhanced** `handleDataChange` to fix JSONB field placement
2. ✅ **Removed** custom `handleDataUpdate` (wasn't being used due to meta override)
3. ✅ **Removed** `meta: { onDataUpdate }` (was being overwritten by useDataGrid)
4. ✅ **Added** JSONB field relocation logic in `handleDataChange`
5. ✅ **Fixed** condition to move JSONB fields even when they already exist in data
6. ✅ **Removed** all debug console.log statements

### The JSONB Problem & Solution:

**Problem:** The built-in `useDataGrid.onDataUpdate` does:
```typescript
updatedRow[columnId] = value;  // e.g., updatedRow["phone"] = "123"
```

For JSONB fields, this creates `{ phone: "123" }` instead of `{ data: { phone: "123" } }`.

**Why our custom meta didn't work:** In `useDataGrid`, the meta is merged like this:
```typescript
meta: {
  ...dataGridPropsRef.current.meta,  // Our custom meta spread first
  onDataUpdate,  // Built-in onDataUpdate OVERWRITES ours!
}
```

**Solution v4:** Instead of trying to override `onDataUpdate`, we fix the data structure in `handleDataChange`:
1. Built-in `onDataUpdate` runs and puts JSONB fields at root level
2. `onDataChange` callback is called with misplaced data
3. Our `handleDataChange` detects misplaced JSONB fields and moves them to `data` object
4. **Key fix:** Always move JSONB fields from root to data, even if they already exist (the new value is at root)
5. Compares and saves correctly structured data

**Bug fixed in v4:** The condition `!(column.name in record.data)` prevented updating existing JSONB fields. Changed to always move JSONB fields from root level, regardless of whether they already exist in the data object.

### Files Modified:
- `components/tables/views/DiceTableView.tsx`
  - Removed: `handleDataUpdate` function (wasn't being called)
  - Removed: `meta: { onDataUpdate }` (was being overwritten)
  - Enhanced: `handleDataChange` with JSONB field relocation logic
  - Added: Column-aware field placement detection

### How It Works Now:

1. User edits a cell → Cell variant calls `meta.onDataUpdate({ rowIndex, columnId, value })`
2. Built-in `useDataGrid.onDataUpdate` runs: `updatedRow[columnId] = value` (wrong for JSONB)
3. Built-in calls `onDataChange(newData)` with misplaced JSONB fields
4. Our `handleDataChange` receives the data and:
   - Detects JSONB fields at root level (by checking column definitions)
   - Moves them to `data` object: `fixed.data[columnId] = record[columnId]`
   - Deletes from root level
5. Compares fixed data with old data to find changes
6. Saves changes to API via PATCH `/api/records/[id]`
7. Updates UI with save status (saving → saved/error)

### Next Steps:
- Test editing direct fields (name, email, company, status)
- Test editing JSONB fields (custom columns)
- Verify data persists after page refresh


## Testing Results ✅

### What Works Now:
- ✅ Direct fields (name, email, company, status) save correctly
- ✅ JSONB fields with empty values can be filled and saved
- ✅ JSONB fields with existing values can be updated and saved
- ✅ Save indicator shows: 保存中... → 保存完了
- ✅ Data persists correctly in database after page refresh
- ✅ All debug logs removed for clean production code

### The Final Bug Fix:
**Problem:** Users could add data to empty JSONB fields but couldn't update existing JSONB data.

**Root Cause:** The condition `!(column.name in record.data)` only moved fields that didn't already exist in the data object. When updating an existing JSONB field, the built-in `onDataUpdate` put the new value at root level, but our code didn't move it because it saw the field already existed in `record.data`.

**Solution:** Changed the condition from:
```typescript
if (!isDirectProperty && column.name in record && !(column.name in record.data))
```

To:
```typescript
if (!isDirectProperty && column.name in record)
```

Now JSONB fields are ALWAYS moved from root to data object, regardless of whether they already exist.
