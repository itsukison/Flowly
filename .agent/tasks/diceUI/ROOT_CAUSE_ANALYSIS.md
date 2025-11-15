# JSONB Fields Not Saving - Root Cause Analysis

## Problem Statement
JSONB fields (phone, name_furigana, etc.) are not being saved to the database, while direct fields (name, email, company, status) work correctly.

## Current Implementation Flow

### 1. Cell Edit
User edits a JSONB field (e.g., phone) → Cell variant calls:
```typescript
meta.onDataUpdate({ rowIndex: 0, columnId: "phone", value: "123-456" })
```

### 2. handleDataUpdate (Custom)
```typescript
const handleDataUpdate = useCallback((updates) => {
  // Creates newData with updates applied
  const newData = data.map((row, index) => {
    const updatedRow = { ...row, data: { ...row.data } };
    // For JSONB fields:
    updatedRow.data[columnId] = value;  // ✅ Correct
    return updatedRow;
  });
  
  handleDataChange(newData);  // Calls with updated data
}, [data, handleDataChange]);
```

### 3. handleDataChange
```typescript
const handleDataChange = useCallback(async (newData) => {
  // Compares newData with current data state
  newData.forEach((newRecord, index) => {
    const oldRecord = data[index];
    
    // Checks JSONB changes
    Object.keys(newDataObj).forEach(key => {
      if (oldData[key] !== newDataObj[key]) {
        dataChanges[key] = newDataObj[key];
      }
    });
    
    // If changes found, sends to API
    if (hasDataChanges) {
      payload.data = { ...oldData, ...dataChanges };
      // PATCH /api/records/[id]
    }
  });
  
  setData(newData);  // Updates state
}, [data]);
```

## Potential Issues Identified

### Issue #1: Dependency Chain (LIKELY CULPRIT)
```typescript
handleDataChange depends on [data]
handleDataUpdate depends on [data, handleDataChange]
```

**Problem:** Both functions are recreated on every data change. This might cause:
- Stale closures
- Race conditions
- The meta.onDataUpdate reference becoming stale

### Issue #2: Comparison Timing
When `handleDataUpdate` calls `handleDataChange(newData)`:
- `newData` is created from current `data` state
- `handleDataChange` compares `newData` with `data`
- This should work, but if `data` is stale in the closure, comparison fails

### Issue #3: State Update Timing
```typescript
setData(newData);  // Updates state
// But API call happens AFTER state update
// Next edit might use the new state before API completes
```

### Issue #4: Reference Equality
JSONB data objects might have reference equality issues:
```typescript
if (oldData[key] !== newDataObj[key])  // Might fail for objects/arrays
```

## Debugging Steps Added

I've added comprehensive logging to trace the flow:
1. "Cell updates:" - Shows what cell variant sends
2. "Current data before update:" - Shows state before update
3. "New data after update:" - Shows state after update
4. "Comparing record:" - Shows old vs new data objects
5. "JSONB field changed:" - Shows detected changes
6. "Preparing update for record:" - Shows API payload

## Next Steps

### Step 1: Test with Logging
Edit a JSONB field and check console logs to identify where the flow breaks.

### Step 2: Potential Fixes

**Fix A: Use Refs for Stable References**
```typescript
const dataRef = useRef(data);
useEffect(() => { dataRef.current = data; }, [data]);

const handleDataChange = useCallback(async (newData) => {
  const oldData = dataRef.current;  // Always current
  // ... comparison logic
}, []);  // No dependencies
```

**Fix B: Simplify Dependency Chain**
Remove `handleDataChange` from `handleDataUpdate` dependencies and use a ref.

**Fix C: Direct API Call from handleDataUpdate**
Skip `handleDataChange` entirely and call API directly from `handleDataUpdate`.

**Fix D: Use Reducer Pattern**
Replace useState with useReducer for more predictable state updates.

## Claude's Suggestion Analysis

Claude suggested using PostgreSQL's `jsonb_set()` function. This is a good optimization but doesn't solve our root cause:
- Our API already merges JSONB correctly: `{ ...existingData, ...body.data }`
- The problem is that the API isn't being called at all (or with wrong data)
- `jsonb_set()` would help with partial updates but we need to fix the data flow first

## Hypothesis

**Most Likely:** The dependency chain causes `handleDataUpdate` to use a stale `handleDataChange` reference, which compares against stale `data`, finds no changes, and doesn't call the API.

**Test:** Check if "JSONB field changed:" log appears. If not, the comparison is failing.
