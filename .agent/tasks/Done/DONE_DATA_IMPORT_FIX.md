# Data Import Bug Fix

## Issue
The データインポート (data import) function in `/app/dashboard/tables/[tableId]/page.tsx` was broken, preventing users from uploading files.

## Root Cause Analysis

### Problem 1: Wrong API Endpoint
- **Component**: `components/tables/DataImport.tsx`
- **Issue**: Calling non-existent endpoint `/api/import/data`
- **Actual endpoint**: `/api/import`

### Problem 2: Wrong Data Format
- **Issue**: Sending FormData with raw file
- **Expected**: JSON with parsed data, column mapping, and options

### Problem 3: Missing File Parsing
- **Issue**: No file parsing logic in DataImport component
- **Solution**: Import and use existing `fileParser` utility

### Problem 4: Missing Column Mapping UI
- **Issue**: No interface for users to map imported columns to table columns
- **Solution**: Added column mapping interface with auto-mapping

### Problem 5: Missing GET Endpoint
- **Issue**: No GET endpoint at `/api/tables/[id]` to fetch table details
- **Solution**: Added GET handler to retrieve organization_id and created_by

## Implementation

### Files Modified

1. **components/tables/DataImport.tsx**
   - Added file parsing using `parseExcel` and `parseCSV` from `@/lib/utils/fileParser`
   - Added column mapping state and UI
   - Implemented auto-mapping logic (matches column names/labels)
   - Changed API call from `/api/import/data` to `/api/import`
   - Changed from FormData to JSON payload with proper structure
   - Added table info fetch to get organization_id and user_id

2. **app/api/tables/[id]/route.ts**
   - Added GET handler to fetch table details by ID
   - Returns full table object including organization_id and created_by

## How It Works Now

1. User drags/drops or selects Excel/CSV file
2. File is validated (size, format)
3. File is parsed using xlsx library
4. Column mapping UI appears with auto-mapped columns
5. User can adjust mappings or leave unmapped
6. User clicks "インポート開始"
7. System fetches table details to get organization_id
8. Data is sent to `/api/import` with proper format:
   ```json
   {
     "table_id": "...",
     "organization_id": "...",
     "user_id": "...",
     "data": [...],
     "mapping": {...},
     "options": {
       "deduplicate": true,
       "enrich": false
     }
   }
   ```
9. Success message shown, page reloads after 1.5s

## Testing Checklist

- [x] File validation works (size, format)
- [x] Excel files (.xlsx, .xls) parse correctly
- [x] CSV files parse correctly
- [x] Column auto-mapping works
- [x] Manual column mapping works
- [x] API endpoint exists and accepts correct format
- [x] Table GET endpoint returns required data
- [x] Import completes successfully
- [x] Page reloads after import

## Status
✅ COMPLETED - Import functionality restored and working
