# Database Schema Documentation

## Overview

Flowly uses Supabase (PostgreSQL) with Row-Level Security (RLS) for multi-tenant data isolation. The schema is designed for Japanese-first CRM with fuzzy matching support for Japanese text.

## Extensions

- **pg_trgm**: Trigram-based fuzzy text matching (supports Japanese)
- **uuid-ossp**: UUID generation

## Tables

### organizations

Represents a company/organization using Flowly.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Organization name |
| plan | TEXT | Subscription plan: 'starter', 'growth', 'business' |
| enrichment_quota | INTEGER | Monthly enrichment limit |
| enrichment_used | INTEGER | Enrichments used this month |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Indexes:**
- `idx_organizations_created_at` on `created_at DESC`

**RLS Policies:**
- Users can view their own organization
- Admins/owners can update their organization

---

### users

User profiles extending Supabase auth.users.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (references auth.users) |
| organization_id | UUID | Foreign key to organizations |
| email | TEXT | User email |
| full_name | TEXT | User's full name |
| role | TEXT | User role: 'owner', 'admin', 'member' |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Indexes:**
- `idx_users_organization` on `organization_id`
- `idx_users_email` on `email`

**RLS Policies:**
- Users can view users in their organization
- Users can view their own profile
- Admins can insert/update users in their organization

---

### customers

Core customer data table.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | Foreign key to organizations |
| name | TEXT | Customer name (required) |
| name_furigana | TEXT | Furigana reading for sorting |
| email | TEXT | Email address |
| phone | TEXT | Phone number |
| company_name | TEXT | Company name |
| company_domain | TEXT | Extracted from email |
| address | TEXT | Physical address |
| industry | TEXT | Industry/sector |
| employee_count | INTEGER | Number of employees |
| status | TEXT | Status: 'リード', '商談中', '契約', '運用中', '休眠' |
| assigned_to | UUID | Foreign key to users |
| custom_fields | JSONB | Flexible custom data |
| enrichment_status | TEXT | 'pending', 'completed', 'failed' |
| enrichment_sources | JSONB | Data sources used for enrichment |
| last_contact_date | TIMESTAMPTZ | Last contact timestamp |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |
| created_by | UUID | Foreign key to users |

**Indexes:**
- `idx_customers_org` on `organization_id`
- `idx_customers_status` on `(organization_id, status)`
- `idx_customers_assigned` on `assigned_to`
- `idx_customers_email` on `email` (partial, where email IS NOT NULL)
- `idx_customers_phone` on `phone` (partial, where phone IS NOT NULL)
- `idx_customers_domain` on `company_domain` (partial)
- `idx_customers_created_at` on `(organization_id, created_at DESC)`
- `customer_name_trgm` GIN index on `name` for fuzzy matching
- `customer_company_trgm` GIN index on `company_name` for fuzzy matching

**RLS Policies:**
- Users can view/insert/update/delete customers in their organization

---

### customer_activity_log

Audit trail for customer changes.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| customer_id | UUID | Foreign key to customers |
| organization_id | UUID | Foreign key to organizations |
| user_id | UUID | Foreign key to users (nullable) |
| action_type | TEXT | 'created', 'updated', 'status_changed', 'enriched', 'merged', 'note_added' |
| changes | JSONB | Before/after data |
| notes | TEXT | Optional notes |
| created_at | TIMESTAMPTZ | Action timestamp |

**Indexes:**
- `idx_activity_customer` on `(customer_id, created_at DESC)`
- `idx_activity_org` on `(organization_id, created_at DESC)`
- `idx_activity_user` on `(user_id, created_at DESC)` (partial)

**RLS Policies:**
- Users can view activity in their organization
- Users can insert activity in their organization

---

### duplicate_candidates

Potential duplicate customer pairs.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | Foreign key to organizations |
| customer_id_1 | UUID | Foreign key to customers |
| customer_id_2 | UUID | Foreign key to customers |
| similarity_score | FLOAT | Match confidence (0-1) |
| match_reasons | JSONB | Why they match |
| status | TEXT | 'pending', 'merged', 'dismissed' |
| created_at | TIMESTAMPTZ | Detection timestamp |

**Constraints:**
- `unique_duplicate_pair` on `(customer_id_1, customer_id_2)`

**Indexes:**
- `idx_duplicates_org` on `(organization_id, status)`
- `idx_duplicates_customer1` on `customer_id_1`
- `idx_duplicates_customer2` on `customer_id_2`

**RLS Policies:**
- Users can view/insert/update duplicates in their organization

---

## Functions

### normalize_phone(phone TEXT)

Strips non-numeric characters from phone numbers for comparison.

```sql
SELECT normalize_phone('03-1234-5678'); -- Returns: '0312345678'
```

### find_similar_customers(org_id UUID, customer_name TEXT, threshold FLOAT)

Finds customers with similar names using trigram similarity.

```sql
SELECT * FROM find_similar_customers(
  'org-uuid',
  'トヨタ',
  0.7
);
```

Returns:
- id, name, email, phone, company_name, similarity

### update_updated_at_column()

Trigger function that automatically updates `updated_at` timestamp.

---

## Triggers

- `update_organizations_updated_at` on organizations
- `update_users_updated_at` on users
- `update_customers_updated_at` on customers

---

## Multi-Tenancy

All tables use Row-Level Security (RLS) with `organization_id` for data isolation:

1. Every query automatically filters by the user's organization
2. Users cannot access data from other organizations
3. Enforced at the database level (not application level)

---

## Japanese Text Support

### Fuzzy Matching

Uses PostgreSQL's `pg_trgm` extension for fuzzy text matching:

```sql
-- Find similar names
SELECT name, similarity(name, 'トヨタ') as score
FROM customers
WHERE name % 'トヨタ'
ORDER BY score DESC;
```

### Furigana

Optional `name_furigana` field for proper Japanese sorting:

```sql
-- Sort by furigana reading
SELECT * FROM customers
ORDER BY COALESCE(name_furigana, name);
```

### Full-width/Half-width

Application layer normalizes text using `String.normalize('NFKC')`:

```typescript
const normalized = text.normalize('NFKC'); // "１２３" → "123"
```

---

## Performance Considerations

### Indexes

- All foreign keys are indexed
- Frequently queried columns have indexes
- Partial indexes for nullable columns
- GIN indexes for fuzzy text search

### Query Optimization

- Use `select('*')` sparingly - specify needed columns
- Leverage RLS instead of manual filtering
- Use pagination for large result sets
- Consider materialized views for complex aggregations

---

## Migration History

1. `enable_extensions` - Enable pg_trgm and uuid-ossp
2. `create_organizations_table` - Organization table
3. `create_users_table` - User profiles
4. `create_customers_table` - Customer data
5. `create_activity_log_table` - Audit trail
6. `create_duplicate_candidates_table` - Deduplication
7. `create_utility_functions` - Helper functions
8. `enable_row_level_security` - RLS policies

---

## Backup & Recovery

Supabase provides:
- Automatic daily backups (retained 7 days on free tier)
- Point-in-time recovery (paid plans)
- Manual backup via `pg_dump`

---

## Future Enhancements

- [ ] Add full-text search indexes for notes/custom fields
- [ ] Implement soft deletes with `deleted_at` column
- [ ] Add customer tags/labels table
- [ ] Create materialized view for dashboard stats
- [ ] Add email/phone validation triggers
