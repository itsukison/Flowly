# JSONB Field Debugging

## Current Status
JSONB fields are not saving correctly. Direct fields (name, email, company, status) work fine.

## Debug Steps

### 1. Check Console Logs
When you edit a JSONB field (like phone), check the browser console for these logs:

```
Cell updates: [{ rowIndex: X, columnId: "phone", value: "..." }]
Current data before update: [...]
New data after update: [...]
Data changed: [...]
JSONB field changed: phone { old: "...", new: "..." }
Preparing update for record XXX: { data: { ... } }
Successfully saved X record(s)
```

### 2. Check Network Tab
Look at the PATCH request to `/api/records/[id]`:
- Request payload should have: `{ data: { phone: "new value", ...other fields } }`
- Response should return the updated record

### 3. Verify Database
After editing, check if the data was saved:
```sql
SELECT id, name, data FROM records WHERE id = 'your-record-id';
```

## Potential Issues to Check

### Issue 1: Data Not Reaching handleDataUpdate
- Check if "Cell updates:" log appears
- If not, the cell variant isn't calling `meta.onDataUpdate`

### Issue 2: Data Structure Wrong
- Check "New data after update:" log
- Verify JSONB fields are in `row.data[fieldName]`, not `row[fieldName]`

### Issue 3: Change Detection Failing
- Check if "JSONB field changed:" log appears
- If not, the comparison `oldData[key] !== newDataObj[key]` is failing
- This could be due to reference equality issues

### Issue 4: API Request Failing
- Check "Preparing update for record:" log
- Check network tab for the PATCH request
- Check API route logs in terminal

### Issue 5: Database Update Failing
- Check Supabase logs
- Verify the JSONB merge is working: `{ ...existingData, ...body.data }`

## Expected Flow

1. User edits phone field → value "123-456"
2. Cell variant calls `meta.onDataUpdate({ rowIndex: 0, columnId: "phone", value: "123-456" })`
3. `handleDataUpdate` receives update
4. Creates new data: `updatedRow.data["phone"] = "123-456"`
5. Calls `handleDataChange(newData)`
6. Detects change in JSONB field
7. Sends PATCH `/api/records/[id]` with `{ data: { phone: "123-456", ...existing } }`
8. API merges with existing data
9. Database updated
10. UI shows "保存完了"

## Next Steps
1. Add the logging (already done)
2. Test editing a JSONB field
3. Check console logs to identify where the flow breaks
4. Report findings
