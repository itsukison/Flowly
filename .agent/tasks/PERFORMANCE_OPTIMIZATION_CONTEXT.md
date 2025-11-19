# Performance Optimization Context
## Flowly Table View - Architecture & Scalability Analysis

**Date:** November 19, 2025  
**Purpose:** Provide comprehensive context for AI-assisted performance optimization  
**Current Status:** Working but needs optimization for large-scale data

---

## Executive Summary

The Flowly table view uses DiceUI's data grid component (built on TanStack Table) with virtualization. While it works well for small datasets, we need to optimize for:
- **Large datasets**: 10,000+ rows
- **Many columns**: 50+ columns (real + virtual)
- **Real-time updates**: Auto-save on every cell change
- **Concurrent users**: Multiple users editing the same table

---

## Current Architecture

### Tech Stack
- **Frontend Framework**: Next.js 14+ (App Router)
- **UI Library**: React 18+
- **Table Library**: TanStack Table v8 (formerly React Table)
- **Virtualization**: TanStack Virtual
- **Database**: Supabase (PostgreSQL)
- **State Management**: React hooks + TanStack Table state
- **Styling**: Tailwind CSS

### Key Components

#### 1. Main Table View Component
**File:** `Flowly/components/tables/views/DiceTableView.tsx`

**Responsibilities:**
- Fetches data from Supabase (server-side)
- Manages local state for data, columns, and UI
- Handles data changes and auto-save
- Generates column definitions (real + virtual columns)
- Manages modals (enrichment, deduplication, AI chat)

**Current Data Flow:**
```
Server (page.tsx) 
  → Fetch from Supabase
  → Pass to DiceTableView
  → Add placeholder rows (50)
  → Initialize useDataGrid hook
  → Render DataGrid component
```

**Key State:**
- `data`: Array of records (real + placeholder rows)
- `columns`: Column definitions from database
- `statuses`: Status options for records
- `isSaving`: Auto-save indicator

#### 2. Data Grid Hook
**File:** `Flowly/hooks/use-data-grid.tsx` (1779 lines)

**Responsibilities:**
- Manages table state (sorting, selection, focus, editing)
- Handles keyboard navigation and shortcuts
- Manages cell selection and editing
- Implements copy/paste functionality
- Handles virtualization setup
- Manages search functionality

**Key Features:**
- Custom store with subscription pattern for state management
- Virtualized rows using TanStack Virtual
- Cell-level focus and editing state
- Multi-cell selection with range support
- Keyboard shortcuts (Ctrl+C, Ctrl+V, arrows, etc.)

**Performance Considerations:**
- Uses `useSyncExternalStore` for efficient state updates
- Batches state updates to reduce re-renders
- Virtualizes rows (only renders visible rows)
- Memoizes column size calculations

#### 3. Data Grid Component
**File:** `Flowly/components/data-grid/data-grid.tsx`

**Responsibilities:**
- Renders the grid structure (header, body, footer)
- Handles row virtualization
- Manages column headers
- Provides context menu
- Handles search UI

**Rendering Strategy:**
- Only renders visible rows (virtualization)
- Uses `flexRender` from TanStack Table
- Sticky header and footer
- Absolute positioning for virtualized rows

#### 4. Cell Components
**Files:** `Flowly/components/data-grid/data-grid-cell*.tsx`

**Cell Types:**
- ShortTextCell: Single-line text input
- LongTextCell: Multi-line textarea in popover
- NumberCell: Numeric input
- SelectCell: Dropdown select
- MultiSelectCell: Multi-select with badges
- CheckboxCell: Boolean checkbox
- DateCell: Date picker

**Cell Architecture:**
- Three-layer composition (Cell → Variant → Wrapper)
- Each cell manages its own editing state
- Uses contentEditable for inline editing
- Popover for complex editors (long text, date)

---

## Current Performance Bottlenecks

### 1. Data Fetching & Initial Load
**Current Implementation:**
```typescript
// Server-side fetch in page.tsx
const { data: records } = await supabase
  .from("records")
  .select("*")
  .eq("table_id", tableId)
  .order("created_at", { ascending: false });
```

**Issues:**
- Fetches ALL records at once (no pagination)
- No limit on query results
- Loads all data into memory on client
- Large JSONB `data` field loaded for every record

**Impact:**
- Slow initial page load with 1000+ records
- High memory usage on client
- Network transfer time increases linearly with data size

### 2. Auto-Save on Every Change
**Current Implementation:**
```typescript
const handleDataChange = useCallback(async (newData) => {
  // Compare old vs new data
  // Find changes
  // Make API call for each changed record
  await fetch(`/api/records/${record.id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}, [data, columns]);
```

**Issues:**
- API call on every cell edit
- No debouncing or batching
- Multiple simultaneous edits = multiple API calls
- Each API call includes full record update

**Impact:**
- Network congestion with frequent edits
- Database write load
- Potential race conditions with concurrent edits

### 3. Virtual Columns & Placeholder Rows
**Current Implementation:**
```typescript
// Add 20 virtual columns
for (let i = 0; i < 20; i++) {
  cols.push({ id: `col_${i}`, ... });
}

// Add 50 placeholder rows
for (let i = 0; i < 50; i++) {
  placeholders.push({ id: `temp-${i}`, ... });
}
```

**Issues:**
- Virtual columns increase column count (affects rendering)
- Placeholder rows increase row count (affects virtualization)
- All columns rendered even if empty
- Data comparison runs on all rows (including placeholders)

**Impact:**
- Increased memory usage
- More DOM nodes to manage
- Slower data change detection

### 4. Column Definitions Regeneration
**Current Implementation:**
```typescript
const diceColumns = useMemo(() => {
  // Generate columns from database columns
  // Add virtual columns
  // Add status column
  return cols;
}, [columns, statuses]);
```

**Issues:**
- Regenerates all column definitions when columns or statuses change
- No column-level memoization
- Virtual columns regenerated every time

**Impact:**
- Unnecessary re-renders when columns change
- Memory allocation for new column objects

### 5. Data Change Detection
**Current Implementation:**
```typescript
// Compare every field of every record
fixedData.forEach((newRecord, index) => {
  const oldRecord = data[index];
  // Check direct fields
  directFields.forEach((field) => {
    if (oldValue !== newValue) {
      directChanges[field] = newValue;
    }
  });
  // Check JSONB data
  Object.keys(newDataObj).forEach((key) => {
    if (oldData[key] !== newDataObj[key]) {
      dataChanges[key] = newDataObj[key];
    }
  });
});
```

**Issues:**
- O(n * m) complexity (n = rows, m = fields)
- Runs on every data change
- Compares all rows even if only one changed
- No change tracking at cell level

**Impact:**
- Slow with large datasets
- CPU intensive
- Blocks UI during comparison

---

## Database Schema

### Tables

#### `tables`
```sql
CREATE TABLE tables (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `table_columns`
```sql
CREATE TABLE table_columns (
  id UUID PRIMARY KEY,
  table_id UUID REFERENCES tables(id),
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL, -- 'text', 'number', 'select', etc.
  options JSONB, -- For select options, validation rules, etc.
  is_required BOOLEAN,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `records`
```sql
CREATE TABLE records (
  id UUID PRIMARY KEY,
  table_id UUID REFERENCES tables(id),
  organization_id UUID REFERENCES organizations(id),
  name TEXT,
  email TEXT,
  company TEXT,
  status TEXT,
  data JSONB, -- Flexible data storage for custom columns
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  search_vector TSVECTOR, -- For full-text search
  is_ai_generated BOOLEAN DEFAULT FALSE,
  ai_generation_job_id UUID
);

-- Indexes
CREATE INDEX idx_records_table_id ON records(table_id);
CREATE INDEX idx_records_organization_id ON records(organization_id);
CREATE INDEX idx_records_search_vector ON records USING GIN(search_vector);
```

### Data Storage Strategy

**Direct Properties:**
- `name`, `email`, `company`, `status` stored as columns
- Fast to query and filter
- Indexed for performance

**JSONB Data:**
- Custom column data stored in `data` JSONB field
- Flexible schema
- Slower to query than direct columns
- No indexes on JSONB keys (potential optimization)

---

## API Endpoints

### GET `/dashboard/tables/[tableId]/data`
**Purpose:** Fetch table data (server-side)

**Current Implementation:**
```typescript
const { data: records } = await supabase
  .from("records")
  .select("*")
  .eq("table_id", tableId)
  .order("created_at", { ascending: false });
```

**Issues:**
- No pagination
- No limit
- Fetches all fields

### PATCH `/api/records/[id]`
**Purpose:** Update a single record

**Current Implementation:**
```typescript
const { data, error } = await supabase
  .from("records")
  .update({ ...changes, updated_at: new Date().toISOString() })
  .eq("id", id)
  .select()
  .single();
```

**Issues:**
- One API call per record update
- No batching
- Full record returned (unnecessary data transfer)

### POST `/api/records`
**Purpose:** Create a new record

**Current Implementation:**
```typescript
const { data, error } = await supabase
  .from("records")
  .insert(payload)
  .select()
  .single();
```

**Issues:**
- Creates one record at a time
- No bulk insert support

### PATCH `/api/columns/reorder`
**Purpose:** Reorder columns

**Current Implementation:**
```typescript
for (const update of updates) {
  await supabase
    .from("table_columns")
    .update({ display_order })
    .eq("id", id);
}
```

**Issues:**
- Sequential updates (not batched)
- One query per column

---

## Performance Metrics (Current)

### Initial Load
- **Small dataset (10 records):** ~500ms
- **Medium dataset (100 records):** ~1-2s
- **Large dataset (1000 records):** ~5-10s (estimated)

### Cell Edit & Save
- **Single cell edit:** ~200-500ms
- **Paste 10 cells:** ~2-5s
- **Paste 100 cells:** ~10-20s (estimated)

### Scrolling
- **Smooth scrolling:** Up to ~500 rows
- **Noticeable lag:** 500-1000 rows
- **Significant lag:** 1000+ rows

### Memory Usage
- **Small dataset:** ~50-100 MB
- **Medium dataset:** ~200-300 MB
- **Large dataset:** ~500+ MB (estimated)

---

## Optimization Opportunities

### 1. Pagination & Infinite Scroll
**Current:** Load all records at once  
**Proposed:** Load records in chunks (e.g., 100 at a time)

**Benefits:**
- Faster initial load
- Lower memory usage
- Better perceived performance

**Implementation:**
- Use cursor-based pagination
- Implement infinite scroll or "Load More" button
- Prefetch next page while user scrolls

**Challenges:**
- Virtualization needs total row count
- Search/filter across pages
- Maintaining scroll position

### 2. Debounced Auto-Save
**Current:** Save on every change immediately  
**Proposed:** Debounce saves (e.g., 500ms after last change)

**Benefits:**
- Fewer API calls
- Better user experience (less network activity)
- Reduced database load

**Implementation:**
- Use debounce utility (lodash or custom)
- Batch multiple changes into single API call
- Show "saving..." indicator

**Challenges:**
- Handling conflicts (multiple users)
- Ensuring data isn't lost on page close
- Managing pending changes state

### 3. Optimistic Updates
**Current:** Wait for API response before updating UI  
**Proposed:** Update UI immediately, rollback on error

**Benefits:**
- Instant feedback
- Better perceived performance
- Smoother editing experience

**Implementation:**
- Update local state immediately
- Queue API call in background
- Rollback on error with notification

**Challenges:**
- Handling conflicts
- Error recovery
- Maintaining consistency

### 4. Virtual Column Optimization
**Current:** 20 virtual columns always rendered  
**Proposed:** Lazy-load virtual columns or reduce count

**Benefits:**
- Fewer columns to render
- Lower memory usage
- Faster column operations

**Implementation:**
- Start with 5-10 virtual columns
- Add more on demand (when user scrolls right)
- Or remove virtual columns entirely (use "Add Column" button)

**Challenges:**
- User expectations (spreadsheet-like experience)
- Horizontal scrolling behavior

### 5. Incremental Data Change Detection
**Current:** Compare all rows on every change  
**Proposed:** Track changes at cell level

**Benefits:**
- O(1) instead of O(n*m) complexity
- Faster change detection
- Lower CPU usage

**Implementation:**
- Maintain a "dirty cells" set
- Only compare dirty cells
- Clear dirty flag after save

**Challenges:**
- More complex state management
- Ensuring all changes are captured

### 6. Database Query Optimization
**Current:** `SELECT *` with no pagination  
**Proposed:** Optimized queries with pagination

**Benefits:**
- Faster queries
- Lower database load
- Reduced network transfer

**Implementation:**
```sql
-- Paginated query
SELECT id, name, email, company, status, data
FROM records
WHERE table_id = $1
ORDER BY created_at DESC
LIMIT 100 OFFSET 0;

-- Count query (for total)
SELECT COUNT(*) FROM records WHERE table_id = $1;
```

**Additional Optimizations:**
- Add indexes on frequently queried JSONB keys
- Use partial indexes for common filters
- Consider materialized views for aggregations

### 7. Batch API Operations
**Current:** One API call per record update  
**Proposed:** Batch multiple updates into single call

**Benefits:**
- Fewer network round trips
- Lower API overhead
- Faster bulk operations

**Implementation:**
```typescript
// New endpoint: PATCH /api/records/batch
const updates = [
  { id: '1', changes: { name: 'John' } },
  { id: '2', changes: { email: 'jane@example.com' } },
];

await fetch('/api/records/batch', {
  method: 'PATCH',
  body: JSON.stringify({ updates }),
});
```

**Challenges:**
- Handling partial failures
- Transaction management
- Error reporting

### 8. Web Workers for Heavy Computation
**Current:** All computation on main thread  
**Proposed:** Offload heavy tasks to Web Workers

**Benefits:**
- Non-blocking UI
- Better responsiveness
- Utilize multiple CPU cores

**Implementation:**
- Move data change detection to worker
- Move search/filter logic to worker
- Move data transformation to worker

**Challenges:**
- Data serialization overhead
- Communication complexity
- Browser compatibility

### 9. Memoization & React Optimization
**Current:** Some memoization, but not comprehensive  
**Proposed:** Aggressive memoization and optimization

**Benefits:**
- Fewer re-renders
- Lower CPU usage
- Smoother UI

**Implementation:**
- Use `React.memo` for cell components
- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers
- Implement custom equality checks

**Challenges:**
- Over-optimization can hurt performance
- Debugging memoization issues
- Maintaining code readability

### 10. Server-Side Rendering & Streaming
**Current:** Client-side data fetching  
**Proposed:** Server-side rendering with streaming

**Benefits:**
- Faster initial render
- Better SEO (if needed)
- Progressive loading

**Implementation:**
- Use Next.js Server Components
- Stream data as it loads
- Show skeleton UI while loading

**Challenges:**
- Interactivity limitations
- State management complexity
- Caching strategy

---

## Recommended Optimization Priority

### Phase 1: Quick Wins (1-2 days)
1. **Debounced auto-save** - Immediate impact on API calls
2. **Reduce virtual columns** - Already done (20 → could go to 10)
3. **Reduce placeholder rows** - Already done (200 → 50 → could go to 20)
4. **Add pagination** - Limit initial load to 100 records

### Phase 2: Medium Effort (3-5 days)
1. **Optimistic updates** - Better UX
2. **Batch API operations** - Reduce network overhead
3. **Incremental change detection** - Faster data comparison
4. **Database query optimization** - Add indexes, optimize queries

### Phase 3: Major Refactor (1-2 weeks)
1. **Infinite scroll** - True scalability
2. **Web Workers** - Offload heavy computation
3. **Server-side streaming** - Progressive loading
4. **Real-time collaboration** - Supabase Realtime for multi-user

---

## Testing Strategy

### Performance Benchmarks
- **Load time:** Measure time from navigation to interactive
- **Cell edit latency:** Time from keystroke to save complete
- **Scroll FPS:** Frames per second during scrolling
- **Memory usage:** Heap size over time
- **API call count:** Number of requests per action

### Test Scenarios
1. **Small dataset:** 10 records, 10 columns
2. **Medium dataset:** 100 records, 20 columns
3. **Large dataset:** 1,000 records, 30 columns
4. **Extra large dataset:** 10,000 records, 50 columns

### Tools
- Chrome DevTools Performance tab
- React DevTools Profiler
- Lighthouse
- Network tab (API call monitoring)
- Memory profiler

---

## Code Files to Review

### Core Components
1. `Flowly/components/tables/views/DiceTableView.tsx` (1029 lines)
2. `Flowly/hooks/use-data-grid.tsx` (1779 lines)
3. `Flowly/components/data-grid/data-grid.tsx` (200 lines)
4. `Flowly/components/data-grid/data-grid-cell.tsx`
5. `Flowly/components/data-grid/data-grid-cell-wrapper.tsx`

### Cell Variants
1. `Flowly/components/data-grid/cells/short-text-cell.tsx`
2. `Flowly/components/data-grid/cells/long-text-cell.tsx`
3. `Flowly/components/data-grid/cells/number-cell.tsx`
4. `Flowly/components/data-grid/cells/select-cell.tsx`
5. `Flowly/components/data-grid/cells/date-cell.tsx`

### API Routes
1. `Flowly/app/api/records/[id]/route.ts`
2. `Flowly/app/api/records/route.ts`
3. `Flowly/app/api/columns/reorder/route.ts`

### Server Components
1. `Flowly/app/dashboard/tables/[tableId]/data/page.tsx`

---

## Questions for AI Optimization Analysis

1. **Pagination Strategy:**
   - Should we use cursor-based or offset-based pagination?
   - How to handle virtualization with pagination?
   - How to maintain scroll position across page loads?

2. **Auto-Save Strategy:**
   - What's the optimal debounce delay?
   - Should we batch updates or save individually?
   - How to handle conflicts in multi-user scenarios?

3. **Data Structure:**
   - Should we move more fields out of JSONB into columns?
   - Should we add indexes on JSONB keys?
   - Should we use a separate table for custom column data?

4. **Virtualization:**
   - Is TanStack Virtual the best choice?
   - Should we implement column virtualization?
   - How to optimize virtual row rendering?

5. **State Management:**
   - Is the current custom store optimal?
   - Should we use Zustand, Jotai, or Redux?
   - How to minimize re-renders?

6. **Caching:**
   - Should we implement client-side caching?
   - Should we use React Query or SWR?
   - What's the cache invalidation strategy?

7. **Real-time Updates:**
   - Should we implement Supabase Realtime?
   - How to handle concurrent edits?
   - What's the conflict resolution strategy?

8. **Architecture:**
   - Should we split the table into smaller components?
   - Should we use Server Components more?
   - Should we implement a separate data layer?

---

## Additional Context

### User Behavior Patterns
- Users typically work with 10-100 records at a time
- Frequent copy/paste from Excel/Google Sheets
- Multiple users may edit the same table simultaneously
- Users expect instant feedback (no loading spinners)
- Users expect data to be saved automatically

### Business Requirements
- Support up to 10,000 records per table
- Support up to 50 columns per table
- Support 100+ concurrent users per organization
- 99.9% uptime SLA
- Data must be consistent across users

### Technical Constraints
- Must work on modern browsers (Chrome, Firefox, Safari, Edge)
- Must work on mobile devices (responsive)
- Must be accessible (WCAG 2.1 AA)
- Must support keyboard navigation
- Must work offline (future requirement)

---

## Next Steps

1. **Profile current performance** with realistic datasets
2. **Identify top 3 bottlenecks** based on profiling
3. **Implement Phase 1 optimizations** (quick wins)
4. **Measure improvement** and compare to baseline
5. **Iterate** on Phase 2 and 3 optimizations

---

## Contact & Resources

- **TanStack Table Docs:** https://tanstack.com/table/latest
- **TanStack Virtual Docs:** https://tanstack.com/virtual/latest
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Performance:** https://nextjs.org/docs/app/building-your-application/optimizing

---

**End of Document**
