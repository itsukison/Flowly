### Phase 2: Database Schema + Multi-tenancy
**Duration**: 2-3 days  
**Status**: ✅ COMPLETED

**Objectives**:
- Design and implement database schema
- Set up Row-Level Security (RLS) policies
- Create organizations, users, customers tables
- Enable pg_trgm extension for fuzzy matching
- Implement multi-tenancy with organization_id

**Detailed Implementation Plan**:

#### 2.1 Database Extensions Setup
- Enable `pg_trgm` extension for fuzzy matching (Japanese text)
- Enable `uuid-ossp` for UUID generation
- Configure Japanese text search support

#### 2.2 Core Tables Schema

**organizations table**:
```sql
- id (uuid, primary key)
- name (text, not null)
- plan (text: 'starter' | 'growth' | 'business')
- enrichment_quota (integer, monthly limit)
- enrichment_used (integer, current month usage)
- created_at (timestamp)
- updated_at (timestamp)
```

**users table** (extends Supabase auth.users):
```sql
- id (uuid, references auth.users)
- organization_id (uuid, references organizations)
- email (text, not null)
- full_name (text)
- role (text: 'owner' | 'admin' | 'member')
- created_at (timestamp)
- updated_at (timestamp)
```

**customers table**:
```sql
- id (uuid, primary key)
- organization_id (uuid, references organizations, not null)
- name (text, not null)
- name_furigana (text, optional for sorting)
- email (text)
- phone (text)
- company_name (text)
- company_domain (text, extracted from email)
- address (text)
- industry (text)
- employee_count (integer)
- status (text: 'リード' | '商談中' | '契約' | '運用中' | '休眠')
- assigned_to (uuid, references users)
- custom_fields (jsonb, flexible data storage)
- enrichment_status (text: 'pending' | 'completed' | 'failed' | null)
- enrichment_sources (jsonb, track data sources)
- last_contact_date (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
- created_by (uuid, references users)
```

**customer_activity_log table**:
```sql
- id (uuid, primary key)
- customer_id (uuid, references customers)
- organization_id (uuid, references organizations)
- user_id (uuid, references users)
- action_type (text: 'created' | 'updated' | 'status_changed' | 'enriched' | 'merged')
- changes (jsonb, before/after values)
- notes (text)
- created_at (timestamp)
```

**duplicate_candidates table** (for deduplication):
```sql
- id (uuid, primary key)
- organization_id (uuid, references organizations)
- customer_id_1 (uuid, references customers)
- customer_id_2 (uuid, references customers)
- similarity_score (float, 0-1)
- match_reasons (jsonb, which fields matched)
- status (text: 'pending' | 'merged' | 'dismissed')
- created_at (timestamp)
```

#### 2.3 Indexes for Performance
```sql
-- Fuzzy matching on customer names
CREATE INDEX customer_name_trgm ON customers USING gin (name gin_trgm_ops);
CREATE INDEX customer_company_trgm ON customers USING gin (company_name gin_trgm_ops);

-- Fast lookups
CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE INDEX idx_customers_status ON customers(organization_id, status);
CREATE INDEX idx_customers_assigned ON customers(assigned_to);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_domain ON customers(company_domain);

-- Activity log queries
CREATE INDEX idx_activity_customer ON customer_activity_log(customer_id, created_at DESC);
CREATE INDEX idx_activity_org ON customer_activity_log(organization_id, created_at DESC);
```

#### 2.4 Row-Level Security (RLS) Policies

**organizations table**:
```sql
-- Users can only see their own organization
CREATE POLICY "Users view own organization" ON organizations
  FOR SELECT USING (id = (SELECT organization_id FROM users WHERE id = auth.uid()));
```

**customers table**:
```sql
-- Users can only access customers in their organization
CREATE POLICY "Users view own org customers" ON customers
  FOR SELECT USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users insert own org customers" ON customers
  FOR INSERT WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users update own org customers" ON customers
  FOR UPDATE USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users delete own org customers" ON customers
  FOR DELETE USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));
```

**customer_activity_log table**:
```sql
CREATE POLICY "Users view own org activity" ON customer_activity_log
  FOR SELECT USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users insert activity" ON customer_activity_log
  FOR INSERT WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));
```

#### 2.5 Database Functions

**Normalize phone numbers** (for deduplication):
```sql
CREATE OR REPLACE FUNCTION normalize_phone(phone text)
RETURNS text AS $$
BEGIN
  RETURN regexp_replace(phone, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Find duplicate candidates**:
```sql
CREATE OR REPLACE FUNCTION find_duplicates(org_id uuid, customer_id uuid)
RETURNS TABLE (
  duplicate_id uuid,
  similarity_score float,
  match_reasons jsonb
) AS $$
-- Implementation to find similar customers using trigram similarity
$$ LANGUAGE plpgsql;
```

#### 2.6 Migration Files Structure
```
/supabase/migrations/
  - 20250109000001_enable_extensions.sql
  - 20250109000002_create_organizations.sql
  - 20250109000003_create_users.sql
  - 20250109000004_create_customers.sql
  - 20250109000005_create_activity_log.sql
  - 20250109000006_create_duplicate_candidates.sql
  - 20250109000007_create_indexes.sql
  - 20250109000008_enable_rls.sql
  - 20250109000009_create_functions.sql
```

#### 2.7 TypeScript Types Generation
- Run `supabase gen types typescript` to generate types
- Save to `/lib/supabase/database.types.ts`
- Create helper types in `/lib/supabase/types.ts`

#### 2.8 Seed Data for Testing
```typescript
// Test organization
// Test users (owner, admin, member)
// Sample customers with various statuses
// Sample activity logs
```

**Deliverables**:
- ✅ All migration files created and applied
- ✅ RLS policies configured and tested
- ✅ Database types generated
- ✅ Seed data script created
- ✅ Documentation updated in .agent/system/database-schema.md

**Implementation Notes**:
- Created 8 migrations using Supabase MCP
- Enabled pg_trgm extension for Japanese fuzzy matching
- Implemented RLS policies for all tables
- Generated TypeScript types from schema
- Created helper types for easier usage
- Added utility functions for phone normalization and duplicate detection
- Created seed script with sample Japanese customer data
- All tables properly indexed for performance

---

### Phase 3: Dashboard + Customer List View
**Duration**: 3-4 days  
**Status**: ✅ COMPLETED

**Objectives**:
- Create authenticated dashboard layout
- Build customer list view with search/filters
- Implement pagination
- Add basic CRUD operations for customers
- Mobile-responsive design

**Detailed Implementation Plan**:

#### 3.1 Project Structure Setup
```
/app/dashboard/
  - layout.tsx (authenticated layout with sidebar)
  - page.tsx (dashboard home with stats)
  - customers/
    - page.tsx (customer list view)
    - [id]/page.tsx (customer detail view)
  - settings/
    - page.tsx (organization settings)

/components/dashboard/
  - Sidebar.tsx
  - Header.tsx
  - StatsCard.tsx
  - CustomerTable.tsx
  - CustomerCard.tsx (mobile view)
  - CustomerFilters.tsx
  - CustomerSearch.tsx
  - Pagination.tsx

/components/customers/
  - AddCustomerModal.tsx
  - EditCustomerModal.tsx
  - DeleteCustomerDialog.tsx
  - CustomerStatusBadge.tsx
  - CustomerForm.tsx (shared form component)

/lib/services/
  - customerService.ts (business logic)
  - organizationService.ts

/lib/hooks/
  - useCustomers.ts
  - useCustomerFilters.ts
  - usePagination.ts
```

#### 3.2 Dashboard Layout (app/dashboard/layout.tsx)
**Features**:
- Sidebar navigation (Desktop: fixed left, Mobile: bottom nav)
- Navigation items:
  - ダッシュボード (Dashboard)
  - 顧客管理 (Customers)
  - ステータス管理 (Status Board - Phase 7)
  - 設定 (Settings)
- User menu (top right): Profile, Logout
- Organization switcher (if user belongs to multiple orgs)
- Mobile: Hamburger menu + bottom navigation

**Components**:
```typescript
// Sidebar.tsx
- Logo
- Navigation links with icons
- Active state highlighting
- Collapse/expand on mobile

// Header.tsx
- Breadcrumbs
- Search bar (global)
- Notifications icon
- User avatar + dropdown
```

#### 3.3 Dashboard Home (app/dashboard/page.tsx)
**Stats Cards** (4 cards in grid):
1. 総顧客数 (Total Customers) - with trend
2. 今週の新規 (New This Week)
3. 商談中 (In Negotiation) - needs attention
4. 今週の活動 (Activity This Week)

**Recent Activity Section**:
- Last 10 customer activities
- Show: User, Action, Customer, Time
- Click to view customer detail

**Quick Actions**:
- 顧客を追加 (Add Customer) button
- データをインポート (Import Data) button
- 重複をチェック (Check Duplicates) button

**Status Breakdown Chart**:
- Horizontal bar chart showing customer count by status
- Click to filter customer list by status

#### 3.4 Customer List View (app/dashboard/customers/page.tsx)

**Layout**:
```
[Search Bar] [Filter Button] [Add Customer Button]
[Active Filters Chips]
[View Toggle: Table/Card] [Sort Dropdown]
[Customer Table/Cards]
[Pagination]
```

**Search Functionality** (CustomerSearch.tsx):
- Real-time search (debounced 300ms)
- Searches: name, email, phone, company_name
- Clear button
- Search icon with loading state

**Filter Panel** (CustomerFilters.tsx):
- Slide-out panel (right side on desktop, bottom sheet on mobile)
- Filter options:
  - ステータス (Status) - multi-select checkboxes
  - 担当者 (Assigned To) - dropdown
  - 最終連絡日 (Last Contact) - date range picker
  - データ不足 (Missing Data) - checkboxes:
    - メールなし (No Email)
    - 電話なし (No Phone)
    - 住所なし (No Address)
  - 作成日 (Created Date) - date range
- Apply/Clear buttons
- Show active filter count badge

**Customer Table** (CustomerTable.tsx - Desktop):
Columns:
1. Checkbox (bulk select)
2. 名前 (Name) - sortable, clickable to detail
3. 会社名 (Company) - sortable
4. メール (Email) - with copy button
5. 電話 (Phone) - with copy button
6. ステータス (Status) - badge with color
7. 担当者 (Assigned To) - avatar + name
8. 最終連絡 (Last Contact) - relative time
9. アクション (Actions) - dropdown menu

**Actions Menu**:
- 詳細を見る (View Details)
- 編集 (Edit)
- データを充実 (Enrich) - if not enriched
- 削除 (Delete)

**Customer Card** (CustomerCard.tsx - Mobile):
```
[Avatar] [Name] [Status Badge]
[Company Name]
[Email] [Phone]
[Assigned To] [Last Contact]
[Actions Button]
```

**Bulk Actions** (when items selected):
- Show selection count
- Actions:
  - ステータス変更 (Change Status)
  - 担当者変更 (Change Assigned To)
  - 一括削除 (Bulk Delete)
  - 選択解除 (Deselect All)

#### 3.5 Pagination Component
- Show: "1-20 of 150 customers"
- Items per page: 20, 50, 100
- Previous/Next buttons
- Page number input (jump to page)
- Mobile: Simplified with just prev/next

#### 3.6 Add Customer Modal (AddCustomerModal.tsx)
**Form Fields** (CustomerForm.tsx):
Required:
- 名前 (Name) - text input

Optional:
- フリガナ (Furigana) - text input
- メール (Email) - email input with validation
- 電話 (Phone) - tel input with formatting
- 会社名 (Company Name) - text input
- 住所 (Address) - textarea
- 業種 (Industry) - dropdown
- 従業員数 (Employee Count) - number input
- ステータス (Status) - dropdown (default: リード)
- 担当者 (Assigned To) - user dropdown
- メモ (Notes) - textarea

**Features**:
- Real-time validation
- Email format check
- Phone number formatting (Japanese format)
- Duplicate detection on blur (name + email)
  - If potential duplicate found: "似た顧客が見つかりました" warning
  - Show similar customer(s) with "View" link
- Auto-extract company domain from email
- Save & Add Another button
- Cancel button

#### 3.7 Edit Customer Modal (EditCustomerModal.tsx)
- Same form as Add Customer
- Pre-filled with existing data
- Show "Last updated by [User] on [Date]"
- Track changes for activity log
- Optimistic UI update

#### 3.8 Delete Customer Dialog (DeleteCustomerDialog.tsx)
- Confirmation dialog
- Show customer name
- Warning: "この操作は取り消せません" (Cannot be undone)
- Option: "活動ログも削除" (Delete activity logs too)
- Cancel / Delete buttons

#### 3.9 Customer Detail View (app/dashboard/customers/[id]/page.tsx)
**Layout**:
```
[Back Button] [Customer Name] [Edit] [Delete]
[Status Badge] [Enrichment Status]

[Info Card]
  - All customer fields
  - Copy buttons for email/phone
  - Click-to-call phone (mobile)
  - Click-to-email

[Activity Timeline]
  - Chronological list of all activities
  - Filter by action type
  - Infinite scroll

[Quick Actions]
  - データを充実 (Enrich)
  - メモを追加 (Add Note)
  - ステータス変更 (Change Status)
```

#### 3.10 Data Services (lib/services/customerService.ts)

**Functions**:
```typescript
// List customers with filters
getCustomers(filters: CustomerFilters, pagination: Pagination)

// Get single customer with activity log
getCustomer(id: string)

// Create customer
createCustomer(data: CreateCustomerInput)

// Update customer (with activity logging)
updateCustomer(id: string, data: UpdateCustomerInput)

// Delete customer
deleteCustomer(id: string, deleteActivityLog: boolean)

// Find potential duplicates
findDuplicates(name: string, email?: string)

// Bulk operations
bulkUpdateStatus(ids: string[], status: string)
bulkUpdateAssignee(ids: string[], userId: string)
bulkDelete(ids: string[])

// Dashboard stats
getDashboardStats()
getRecentActivity(limit: number)
getStatusBreakdown()
```

#### 3.11 Custom Hooks

**useCustomers.ts**:
```typescript
// Manages customer list state
// Handles search, filters, pagination
// Real-time updates via Supabase Realtime
// Optimistic updates
```

**useCustomerFilters.ts**:
```typescript
// Manages filter state
// URL sync (filters in query params)
// Save/load filter presets
```

**usePagination.ts**:
```typescript
// Pagination logic
// Page state management
// Items per page
```

#### 3.12 Mobile Optimizations
- Bottom sheet for filters (instead of sidebar)
- Card view default on mobile
- Swipe actions on cards (edit, delete)
- Pull-to-refresh
- Infinite scroll (instead of pagination)
- Touch-friendly tap targets (min 44x44px)
- Sticky header with search

#### 3.13 Performance Optimizations
- Server Components for initial data load
- Client Components only for interactive parts
- Debounced search (300ms)
- Virtual scrolling for large lists (react-window)
- Lazy load customer detail modal
- Image optimization for avatars
- Skeleton loaders during fetch

#### 3.14 Error Handling
- Network error: Retry button
- No customers: Empty state with "Add Customer" CTA
- No search results: "No customers found" with clear filters
- Permission denied: Redirect to login
- Toast notifications for success/error

**Deliverables**:
- ✅ Dashboard layout with sidebar navigation
- ✅ Dashboard home with stats and activity
- ✅ Customer list view (table + card)
- ✅ Search and filter functionality
- ✅ Pagination component
- ✅ Add customer modal (Edit/Delete coming in Phase 5)
- ⏳ Customer detail view (Phase 5)
- ✅ Mobile-responsive design
- ✅ Data services (customerService.ts)
- ✅ Error handling and loading states
- ✅ Documentation updated in .agent/system/dashboard-architecture.md

**Implementation Notes**:
- Created authenticated dashboard layout with sidebar and header
- Desktop: Fixed left sidebar (64px width)
- Mobile: Bottom navigation bar
- Dashboard home shows real-time stats from database
- Customer list with table view (desktop) and card view (mobile)
- Search functionality across name, email, phone, company
- Filter panel for status, assigned user, missing data
- Pagination with 20 items per page
- Add customer modal with duplicate detection
- Status badges with color coding
- Spacious, high-end layout following styling guide
- All components use black/white color palette
- Server Components for data fetching, Client Components for interactivity

---

### Phase 4: Smart Data Import (Excel/CSV)
**Duration**: 4-5 days  
**Status**: ✅ COMPLETED

**Objectives**:
- File upload UI with drag-and-drop
- Excel/CSV parsing with SheetJS
- AI-powered column mapping (Japanese variations)
- Import preview with confidence scores
- Batch insert with deduplication check

**Detailed Implementation Plan**:

#### 4.1 Project Structure
```
/app/dashboard/import/
  - page.tsx (import wizard)

/components/import/
  - FileUpload.tsx (drag-and-drop)
  - ColumnMapper.tsx (AI-powered mapping)
  - ImportPreview.tsx (preview table)
  - ImportProgress.tsx (progress indicator)
  - DuplicateResolver.tsx (handle duplicates)
  - ImportSummary.tsx (results)

/lib/services/
  - importService.ts (orchestration)
  - fileParser.ts (Excel/CSV parsing)
  - columnMatcher.ts (AI column mapping)
  - deduplicationService.ts (duplicate detection)

/lib/utils/
  - fileValidation.ts
  - dataTransform.ts
  - japaneseNormalizer.ts
```

#### 4.2 Import Wizard Flow (Multi-Step)

**Step 1: File Upload**
**Step 2: Column Mapping**
**Step 3: Preview & Validate**
**Step 4: Duplicate Resolution**
**Step 5: Import Processing**
**Step 6: Summary & Review**

#### 4.3 Step 1: File Upload (FileUpload.tsx)

**Features**:
- Drag-and-drop zone (large, prominent)
- Click to browse files
- Supported formats: .xlsx, .xls, .csv
- File size limit: 10MB (configurable by plan)
- Multiple file upload (process sequentially)
- File preview before upload:
  - Filename
  - Size
  - Row count (after parsing)
  - Remove button

**Validation**:
```typescript
// File type check
const allowedTypes = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv'
];

// File size check
const maxSize = 10 * 1024 * 1024; // 10MB

// Row count check
const maxRows = 10000; // Prevent memory issues
```

**UI States**:
- Idle: "ファイルをドラッグ＆ドロップ または クリックして選択"
- Hover: Highlight drop zone
- Uploading: Progress bar
- Success: Show file info + "次へ" button
- Error: Show error message + retry

**File Parsing** (fileParser.ts):
```typescript
import * as XLSX from 'xlsx';

interface ParsedData {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
  fileName: string;
}

async function parseExcel(file: File): Promise<ParsedData> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
  
  // Extract headers (first row)
  const headers = data[0] as string[];
  
  // Convert rows to objects
  const rows = data.slice(1).map(row => {
    const obj: Record<string, any> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
  
  return { headers, rows, totalRows: rows.length, fileName: file.name };
}

async function parseCSV(file: File): Promise<ParsedData> {
  // Similar logic using Papa Parse or native parsing
}
```

#### 4.4 Step 2: Column Mapping (ColumnMapper.tsx)

**AI-Powered Mapping Logic** (columnMatcher.ts):
```typescript
interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number; // 0-1
  suggestions: string[]; // Alternative mappings
}

// Japanese column name variations
const columnVariations = {
  name: ['名前', '氏名', '顧客名', 'お名前', 'name', 'customer_name'],
  email: ['メール', 'メールアドレス', 'email', 'mail', 'e-mail'],
  phone: ['電話', '電話番号', 'tel', 'phone', '携帯', '連絡先'],
  company: ['会社', '会社名', '企業名', '社名', 'company', 'company_name'],
  address: ['住所', '所在地', 'address', 'location'],
  // ... more variations
};

function matchColumn(sourceColumn: string): ColumnMapping {
  const normalized = normalizeJapanese(sourceColumn.toLowerCase());
  
  // Exact match
  for (const [field, variations] of Object.entries(columnVariations)) {
    if (variations.some(v => normalized.includes(v))) {
      return {
        sourceColumn,
        targetField: field,
        confidence: 1.0,
        suggestions: []
      };
    }
  }
  
  // Fuzzy match using string similarity
  // Return best match with confidence score
}

function normalizeJapanese(text: string): string {
  // Convert full-width to half-width
  // Remove spaces and special characters
  return text.normalize('NFKC').replace(/\s+/g, '');
}
```

**UI Layout**:
```
[Source Column] → [Target Field] [Confidence Badge]

Example:
"お名前" → [名前 (Name)] [100%]
"メールアドレス" → [メール (Email)] [100%]
"TEL" → [電話 (Phone)] [95%]
"不明な列" → [マッピングなし] [0%] [Dropdown to select]
```

**Features**:
- Auto-mapped columns (green badge, high confidence)
- Suggested mappings (yellow badge, medium confidence)
- Unmapped columns (red badge, manual selection needed)
- Dropdown to change mapping
- "Skip this column" option
- Preview sample data (first 3 rows) for each column
- Required field indicator (name is required)

**Validation**:
- At least "name" field must be mapped
- Warn if email/phone not mapped (optional but recommended)
- Show unmapped column count

#### 4.5 Step 3: Preview & Validate (ImportPreview.tsx)

**Preview Table**:
- Show first 50 rows (paginated)
- Columns: Mapped target fields only
- Highlight validation errors in red
- Show row numbers

**Data Validation**:
```typescript
interface ValidationError {
  row: number;
  field: string;
  error: string;
  value: any;
}

function validateRow(row: Record<string, any>): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Required field check
  if (!row.name || row.name.trim() === '') {
    errors.push({ field: 'name', error: '名前は必須です', value: row.name });
  }
  
  // Email format validation
  if (row.email && !isValidEmail(row.email)) {
    errors.push({ field: 'email', error: '無効なメール形式', value: row.email });
  }
  
  // Phone format validation (Japanese)
  if (row.phone && !isValidJapanesePhone(row.phone)) {
    errors.push({ field: 'phone', error: '無効な電話番号', value: row.phone });
  }
  
  return errors;
}
```

**Validation Summary**:
- Total rows: 150
- Valid rows: 145 (green)
- Rows with errors: 5 (red)
- Click to view errors

**Error Handling Options**:
1. Skip invalid rows (import only valid)
2. Fix errors manually (inline editing)
3. Cancel and re-upload

**Data Transformation**:
```typescript
// Normalize phone numbers
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

// Extract company domain from email
function extractDomain(email: string): string {
  return email.split('@')[1] || '';
}

// Normalize Japanese text
function normalizeText(text: string): string {
  return text.normalize('NFKC').trim();
}
```

#### 4.6 Step 4: Duplicate Resolution (DuplicateResolver.tsx)

**Duplicate Detection** (deduplicationService.ts):
```typescript
interface DuplicateMatch {
  importRow: Record<string, any>;
  existingCustomer: Customer;
  matchScore: number;
  matchReasons: string[];
}

async function findDuplicates(
  importRows: Record<string, any>[],
  organizationId: string
): Promise<DuplicateMatch[]> {
  const duplicates: DuplicateMatch[] = [];
  
  for (const row of importRows) {
    // Check by exact email match
    if (row.email) {
      const emailMatch = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('email', row.email)
        .single();
      
      if (emailMatch.data) {
        duplicates.push({
          importRow: row,
          existingCustomer: emailMatch.data,
          matchScore: 1.0,
          matchReasons: ['メールアドレスが一致']
        });
        continue;
      }
    }
    
    // Check by phone match
    if (row.phone) {
      const normalizedPhone = normalizePhone(row.phone);
      const phoneMatch = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('phone', normalizedPhone)
        .single();
      
      if (phoneMatch.data) {
        duplicates.push({
          importRow: row,
          existingCustomer: phoneMatch.data,
          matchScore: 0.95,
          matchReasons: ['電話番号が一致']
        });
        continue;
      }
    }
    
    // Fuzzy name match (using pg_trgm)
    const nameMatch = await supabase
      .rpc('find_similar_customers', {
        org_id: organizationId,
        customer_name: row.name,
        threshold: 0.7
      });
    
    if (nameMatch.data && nameMatch.data.length > 0) {
      duplicates.push({
        importRow: row,
        existingCustomer: nameMatch.data[0],
        matchScore: nameMatch.data[0].similarity,
        matchReasons: ['名前が類似']
      });
    }
  }
  
  return duplicates;
}
```

**UI Layout**:
```
重複の可能性がある顧客: 12件

[Duplicate Card]
  [Import Data] vs [Existing Data]
  
  インポートデータ:
  - 名前: トヨタ自動車株式会社
  - メール: info@toyota.co.jp
  - 電話: 03-1234-5678
  
  既存データ:
  - 名前: トヨタ自動車
  - メール: info@toyota.co.jp
  - 電話: 03-1234-5678
  - 作成日: 2024-11-01
  
  一致理由: メールアドレスが一致 (100%)
  
  [Actions]
  - スキップ (既存データを保持)
  - 上書き (インポートデータで更新)
  - マージ (両方の情報を統合)
  - 新規作成 (重複ではない)
```

**Bulk Actions**:
- すべてスキップ (Skip all duplicates)
- すべて上書き (Overwrite all)
- すべてマージ (Merge all)

**Merge Logic**:
```typescript
function mergeCustomers(
  existing: Customer,
  imported: Record<string, any>
): Customer {
  return {
    ...existing,
    // Keep existing if imported is empty
    name: imported.name || existing.name,
    email: imported.email || existing.email,
    phone: imported.phone || existing.phone,
    // Merge custom fields
    custom_fields: {
      ...existing.custom_fields,
      ...imported.custom_fields
    },
    updated_at: new Date().toISOString()
  };
}
```

#### 4.7 Step 5: Import Processing (ImportProgress.tsx)

**Processing Strategy**:
- Batch insert (100 rows at a time) to avoid timeout
- Show real-time progress
- Handle errors gracefully
- Allow cancellation

**Progress UI**:
```
インポート中...

[Progress Bar] 75% (112/150)

処理状況:
✅ 成功: 112件
⏳ 処理中: 38件
❌ エラー: 0件

[キャンセル] button
```

**Import Service** (importService.ts):
```typescript
interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: ImportError[];
}

async function importCustomers(
  rows: Record<string, any>[],
  organizationId: string,
  userId: string,
  onProgress: (progress: number) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };
  
  const batchSize = 100;
  const batches = chunk(rows, batchSize);
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert(
          batch.map(row => ({
            organization_id: organizationId,
            created_by: userId,
            ...transformRow(row)
          }))
        );
      
      if (error) throw error;
      
      result.success += batch.length;
    } catch (error) {
      result.failed += batch.length;
      result.errors.push({
        batch: i,
        error: error.message
      });
    }
    
    // Update progress
    const progress = ((i + 1) / batches.length) * 100;
    onProgress(progress);
  }
  
  // Log import activity
  await logActivity({
    organization_id: organizationId,
    user_id: userId,
    action_type: 'bulk_import',
    changes: { result }
  });
  
  return result;
}
```

#### 4.8 Step 6: Summary & Review (ImportSummary.tsx)

**Success Summary**:
```
✅ インポート完了！

結果:
- 成功: 145件
- スキップ: 5件 (重複)
- エラー: 0件

処理時間: 12秒

[顧客リストを見る] [もう一度インポート]
```

**Error Summary** (if errors occurred):
```
⚠️ インポート完了（一部エラー）

結果:
- 成功: 140件
- エラー: 10件

エラー詳細:
行 15: メールアドレスが無効
行 23: 名前が空です
行 45: データベースエラー
...

[エラーをダウンロード] [顧客リストを見る]
```

#### 4.9 Additional Features

**Import Templates**:
- Save column mappings as templates
- "前回の設定を使用" (Use previous settings)
- Template library for common formats

**Import History**:
- Track all imports
- Show: Date, User, File name, Result
- Re-import with same settings
- Undo import (if needed)

**Data Enrichment After Import**:
- "インポートした顧客を充実させますか？" prompt
- Batch enrich all imported customers
- Queue for background processing

#### 4.10 Error Handling & Edge Cases

**File Parsing Errors**:
- Corrupted file: "ファイルを読み込めません"
- Empty file: "ファイルにデータがありません"
- Too many rows: "行数が上限を超えています（最大10,000行）"

**Network Errors**:
- Upload failed: Retry button
- Import interrupted: Resume from last batch

**Validation Errors**:
- Show inline in preview table
- Highlight problematic cells
- Provide fix suggestions

**Duplicate Detection Errors**:
- Database timeout: Fallback to simple matching
- Too many duplicates: Batch resolution UI

#### 4.11 Performance Optimizations

**Client-Side**:
- Web Worker for file parsing (don't block UI)
- Virtual scrolling for large preview tables
- Debounced validation

**Server-Side**:
- Batch inserts (100 rows at a time)
- Database connection pooling
- Index optimization for duplicate detection

**Deliverables**:
- ✅ File upload component with drag-and-drop
- ✅ Excel/CSV parser with SheetJS
- ✅ AI-powered column mapping (fuzzy matching for Japanese)
- ✅ Preview table with validation
- ✅ Duplicate detection and resolution
- ✅ Batch import with progress tracking (50 rows per batch)
- ✅ Import summary and error handling
- ⏳ Import templates and history (future enhancement)
- ✅ Mobile-responsive design
- ✅ Error handling for all edge cases
- ✅ Performance optimizations

**Implementation Notes**:
- Created 6-step wizard: Upload → Mapping → Preview → Duplicates → Import → Summary
- File validation: 10MB max, 10,000 rows max, .xlsx/.xls/.csv formats
- Column matcher with Japanese text normalization (NFKC)
- Auto-mapping with confidence scores (exact, partial, fuzzy matching)
- Data validation: required fields, email format, phone format, employee count
- Data transformation: phone normalization, domain extraction, text normalization
- Duplicate detection: exact email match, phone match, fuzzy name match (trigram similarity > 0.8)
- Duplicate resolution options: skip, merge, create new
- Batch import with real-time progress updates
- Activity logging for all imported customers
- Error reporting with downloadable error log
- All components follow styling guide with spacious layout
