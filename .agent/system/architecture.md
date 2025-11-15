# Database Architecture - Custom Tables System

**Last Updated**: 2024-11-15  
**Status**: ✅ Production Design Approved

---

## The Core Problem

You need to support:
- Multiple organizations (multi-tenant)
- Each organization has multiple tables (lists/databases)
- Each table has custom columns defined by users
- Secure data isolation between organizations
- High performance for queries and filtering

---

## Architecture Decision: Hybrid JSONB Approach ✅

After analyzing Clay, Airtable, and Notion's architecture, we're implementing a **Hybrid Approach** that combines:
- **Indexed common fields** for fast queries (name, email, company, status)
- **JSONB data field** for unlimited flexibility
- **Proper RLS** for multi-tenant security
- **GIN indexes** for JSONB performance

### Why Hybrid Over Pure EAV?

**Pure EAV (Entity-Attribute-Value):**
```
records
├── id
├── table_id
├── organization_id
└── data (JSONB) - ALL fields here
```
❌ Slower queries on common fields  
❌ Can't use B-tree indexes effectively  
❌ Full table scans for simple filters  

**Hybrid Approach (Our Choice):**
```
records
├── id
├── table_id
├── organization_id
├── name (indexed)
├── email (indexed)
├── company (indexed)
├── status (indexed)
└── data (JSONB + GIN index) - custom fields
```
✅ Fast queries on common fields  
✅ Flexible for custom fields  
✅ Best of both worlds  

---

## Database Schema

### 1. Core Tables Structure
```sql
-- Organizations (already exists)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'starter',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tables (enhanced with schema JSONB)
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  template_type TEXT,
  schema JSONB DEFAULT '{}'::jsonb, -- ✨ NEW: Stores column definitions
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

-- Records (NEW: Generic table for all custom table data)
CREATE TABLE records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Common indexed fields for fast queries
  name TEXT,
  email TEXT,
  company TEXT,
  status TEXT,
  
  -- All custom data in JSONB
  data JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  
  -- Full-text search
  search_vector tsvector
);

-- Table Columns (kept for UI, synced with tables.schema)
CREATE TABLE table_columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  options JSONB,
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table Statuses (kept for UI, synced with tables.schema)
CREATE TABLE table_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. Schema Storage Format

The `tables.schema` JSONB field stores the complete table definition:

```json
{
  "version": 1,
  "columns": [
    {
      "id": "col_1",
      "name": "name",
      "label": "名前",
      "type": "text",
      "required": true,
      "indexed": true
    },
    {
      "id": "col_2",
      "name": "email",
      "label": "メールアドレス",
      "type": "email",
      "required": false,
      "indexed": true
    },
    {
      "id": "col_3",
      "name": "linkedin_url",
      "label": "LinkedIn URL",
      "type": "url",
      "required": false
    }
  ],
  "statuses": [
    {
      "id": "status_1",
      "name": "リード",
      "color": "#3B82F6",
      "order": 1
    },
    {
      "id": "status_2",
      "name": "商談中",
      "color": "#10B981",
      "order": 2
    }
  ]
}
```

---

## Performance Optimization

### 1. Indexes Strategy
```sql
-- B-tree indexes for common fields (fast equality/range queries)
CREATE INDEX idx_records_table_id ON records(table_id);
CREATE INDEX idx_records_org_id ON records(organization_id);
CREATE INDEX idx_records_email ON records(email) WHERE email IS NOT NULL;
CREATE INDEX idx_records_company ON records(company) WHERE company IS NOT NULL;
CREATE INDEX idx_records_status ON records(status) WHERE status IS NOT NULL;
CREATE INDEX idx_records_created_at ON records(created_at DESC);

-- GIN index for JSONB (fast containment/existence queries)
CREATE INDEX idx_records_data_gin ON records USING GIN (data);

-- GIN index for full-text search
CREATE INDEX idx_records_search ON records USING GIN (search_vector);

-- Specific JSONB path indexes (add as needed based on usage)
CREATE INDEX idx_records_phone ON records ((data->>'phone')) WHERE data->>'phone' IS NOT NULL;
```

### 2. Query Performance Examples

```sql
-- Fast: Uses B-tree index on email
SELECT * FROM records WHERE email = 'sato@example.com';

-- Fast: Uses GIN index on JSONB
SELECT * FROM records WHERE data @> '{"industry": "IT"}';

-- Fast: Uses JSONB path index
SELECT * FROM records WHERE data->>'phone' = '03-1234-5678';

-- Fast: Combined with organization filter
SELECT * FROM records 
WHERE organization_id = 'xxx' 
  AND data @> '{"status": "active"}';
```

### 3. Materialized Views for Analytics

```sql
CREATE MATERIALIZED VIEW table_statistics AS
SELECT 
  t.id as table_id,
  t.name as table_name,
  t.organization_id,
  COUNT(r.id) as total_records,
  COUNT(DISTINCT r.created_by) as unique_contributors,
  MAX(r.created_at) as last_record_added
FROM tables t
LEFT JOIN records r ON r.table_id = t.id
GROUP BY t.id, t.name, t.organization_id;

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY table_statistics;
```

---

## Security: Row Level Security (RLS)

### Multi-Tenant Isolation

```sql
-- Enable RLS on records table
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view records from their organization
CREATE POLICY "Users can view own org records"
ON records FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

-- Policy 2: Users can insert records into their org's tables
CREATE POLICY "Users can insert own org records"
ON records FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid()
  )
  AND
  table_id IN (
    SELECT id FROM tables 
    WHERE organization_id = records.organization_id
  )
);

-- Policy 3: Users can update their org's records
CREATE POLICY "Users can update own org records"
ON records FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

-- Policy 4: Users can delete their org's records
CREATE POLICY "Users can delete own org records"
ON records FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);
```

**Security Benefits:**
- ✅ Database-level isolation (not just app-level)
- ✅ Prevents cross-organization data leaks
- ✅ Works automatically with Supabase client
- ✅ No need to add WHERE clauses in every query

---

## Implementation Flow

### 1. User Creates a Table

```typescript
// 1. Create table with schema
const { data: table } = await supabase
  .from('tables')
  .insert({
    organization_id: orgId,
    name: "営業リスト",
    schema: {
      version: 1,
      columns: [
        { id: "col_1", name: "name", label: "名前", type: "text", required: true },
        { id: "col_2", name: "email", label: "メール", type: "email" }
      ],
      statuses: [
        { id: "status_1", name: "リード", color: "#3B82F6" }
      ]
    }
  })
  .select()
  .single();

// 2. Create column definitions (for UI)
await supabase.from('table_columns').insert([
  { table_id: table.id, name: "name", label: "名前", type: "text", display_order: 1 },
  { table_id: table.id, name: "email", label: "メール", type: "email", display_order: 2 }
]);

// 3. Create status options (for UI)
await supabase.from('table_statuses').insert([
  { table_id: table.id, name: "リード", color: "#3B82F6", display_order: 1 }
]);
```

### 2. User Adds a Record

```typescript
// Transform form data to record structure
function transformToRecord(formData: any, schema: any) {
  const commonFields = ['name', 'email', 'company', 'status'];
  const record: any = {
    name: null,
    email: null,
    company: null,
    status: null,
    data: {}
  };
  
  // Separate common fields from custom fields
  Object.entries(formData).forEach(([key, value]) => {
    if (commonFields.includes(key)) {
      record[key] = value;
    } else {
      record.data[key] = value;
    }
  });
  
  return record;
}

// Insert record
const recordData = transformToRecord(formData, tableSchema);
const { data: record } = await supabase
  .from('records')
  .insert({
    table_id: tableId,
    organization_id: orgId,
    ...recordData
  })
  .select()
  .single();
```

### 3. User Queries Records

```typescript
// Simple query
const { data: records } = await supabase
  .from('records')
  .select('*')
  .eq('table_id', tableId)
  .order('created_at', { ascending: false });

// Query with JSONB filter
const { data: records } = await supabase
  .from('records')
  .select('*')
  .eq('table_id', tableId)
  .contains('data', { industry: 'IT' });

// Query with JSONB path
const { data: records } = await supabase
  .from('records')
  .select('*')
  .eq('table_id', tableId)
  .filter('data->>phone', 'eq', '03-1234-5678');
```

---

## Data Structure Examples

### Example 1: CRM Table

**Table Schema:**
```json
{
  "columns": [
    { "name": "name", "label": "名前", "type": "text" },
    { "name": "email", "label": "メール", "type": "email" },
    { "name": "company", "label": "会社名", "type": "text" },
    { "name": "phone", "label": "電話番号", "type": "phone" },
    { "name": "linkedin_url", "label": "LinkedIn", "type": "url" }
  ]
}
```

**Record Data:**
```json
{
  "id": "uuid",
  "table_id": "table_uuid",
  "organization_id": "org_uuid",
  "name": "佐藤太郎",
  "email": "sato@example.com",
  "company": "株式会社エムロック",
  "status": "リード",
  "data": {
    "phone": "03-1234-5678",
    "linkedin_url": "https://linkedin.com/in/sato",
    "name_furigana": "さとうたろう",
    "notes": "Important client"
  }
}
```

### Example 2: Product Inventory Table

**Table Schema:**
```json
{
  "columns": [
    { "name": "name", "label": "Product Name", "type": "text" },
    { "name": "sku", "label": "SKU", "type": "text" },
    { "name": "price", "label": "Price", "type": "number" },
    { "name": "stock", "label": "Stock", "type": "number" }
  ]
}
```

**Record Data:**
```json
{
  "id": "uuid",
  "table_id": "table_uuid",
  "organization_id": "org_uuid",
  "name": "Wireless Mouse",
  "status": "In Stock",
  "data": {
    "sku": "WM-001",
    "price": 2980,
    "stock": 150,
    "supplier": "Tech Supplies Inc",
    "last_restock": "2024-11-01"
  }
}
```

---

## Why This Architecture Works

### ✅ Flexibility
- Users can add any columns without database migrations
- Each table can have completely different schemas
- Easy to add new field types

### ✅ Performance
- Common fields (name, email, company) are indexed for fast queries
- GIN indexes make JSONB queries fast
- Partial indexes optimize specific use cases

### ✅ Scalability
- Supports unlimited tables per organization
- Supports unlimited columns per table
- Efficient storage with JSONB compression

### ✅ Security
- RLS ensures multi-tenant isolation at database level
- No risk of cross-organization data leaks
- Automatic enforcement by Supabase

### ✅ Developer Experience
- JSON everywhere (database → API → frontend)
- TypeScript-friendly
- Easy to work with in Next.js/React

---

## Migration from Old Structure

### Old Structure (customers table)
```sql
customers
├── name, email, company_name (standard columns)
├── phone, address, industry (standard columns)
└── custom_fields (JSONB) - only custom fields
```

### New Structure (records table)
```sql
records
├── name, email, company, status (indexed common fields)
└── data (JSONB) - ALL other fields
```

### Migration Strategy
1. Create `records` table with proper indexes
2. Copy data from `customers` to `records`
3. Transform data structure (standard + custom_fields → common + data)
4. Update all API routes to use `records`
5. Update all frontend components
6. Deprecate `customers` table

---

## References

- **Task Document**: `.agent/tasks/DATABASE_REDESIGN.md`
- **Supabase JSONB Docs**: https://supabase.com/docs/guides/database/json
- **PostgreSQL GIN Indexes**: https://www.postgresql.org/docs/current/gin.html
- **Clay Architecture**: Similar hybrid approach
- **Airtable Architecture**: Inspired by their flexibility

---

**Last Updated**: 2024-11-15  
**Status**: ✅ Ready for Implementation