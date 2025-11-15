-- =====================================================
-- Migration: Create Records Table & Hybrid JSONB Architecture
-- Date: 2024-11-15
-- Phase: 1 - Database Migration
-- Description: Creates the new records table with proper indexing,
--              RLS policies, and schema enhancements for custom tables
-- =====================================================

-- =====================================================
-- PART 1: Create Records Table
-- =====================================================

CREATE TABLE IF NOT EXISTS records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Common indexed fields for fast queries
  name TEXT,
  email TEXT,
  company TEXT,
  status TEXT,
  
  -- All custom data stored as JSONB
  data JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  
  -- Full-text search support
  search_vector tsvector
);

-- Add comment for documentation
COMMENT ON TABLE records IS 'Generic records table for all custom tables. Uses hybrid approach: common fields + JSONB data for flexibility.';
COMMENT ON COLUMN records.data IS 'JSONB field storing all custom fields. Indexed with GIN for fast queries.';
COMMENT ON COLUMN records.search_vector IS 'Full-text search vector. Auto-updated via trigger.';

-- =====================================================
-- PART 2: Create Indexes for Performance
-- =====================================================

-- B-tree indexes for common fields (fast equality/range queries)
CREATE INDEX idx_records_table_id ON records(table_id);
CREATE INDEX idx_records_org_id ON records(organization_id);
CREATE INDEX idx_records_created_by ON records(created_by);
CREATE INDEX idx_records_created_at ON records(created_at DESC);
CREATE INDEX idx_records_updated_at ON records(updated_at DESC);

-- Partial indexes for common fields (only when not null)
CREATE INDEX idx_records_name ON records(name) WHERE name IS NOT NULL;
CREATE INDEX idx_records_email ON records(email) WHERE email IS NOT NULL;
CREATE INDEX idx_records_company ON records(company) WHERE company IS NOT NULL;
CREATE INDEX idx_records_status ON records(status) WHERE status IS NOT NULL;

-- GIN index for JSONB (fast containment/existence queries)
CREATE INDEX idx_records_data_gin ON records USING GIN (data);

-- GIN index for full-text search
CREATE INDEX idx_records_search_gin ON records USING GIN (search_vector);

-- Composite index for common query pattern (org + table)
CREATE INDEX idx_records_org_table ON records(organization_id, table_id);

-- =====================================================
-- PART 3: Add Schema Column to Tables
-- =====================================================

-- Add schema JSONB column if it doesn't exist
ALTER TABLE tables ADD COLUMN IF NOT EXISTS schema JSONB DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN tables.schema IS 'JSONB field storing complete table schema including columns and statuses definitions.';

-- Create index for schema queries
CREATE INDEX IF NOT EXISTS idx_tables_schema_gin ON tables USING GIN (schema);

-- =====================================================
-- PART 4: Create Triggers
-- =====================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to records table
DROP TRIGGER IF EXISTS records_updated_at ON records;
CREATE TRIGGER records_updated_at
  BEFORE UPDATE ON records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger function to update search_vector
CREATE OR REPLACE FUNCTION update_records_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('simple', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.email, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.company, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.data::text, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply search vector trigger
DROP TRIGGER IF EXISTS records_search_vector_update ON records;
CREATE TRIGGER records_search_vector_update
  BEFORE INSERT OR UPDATE ON records
  FOR EACH ROW
  EXECUTE FUNCTION update_records_search_vector();

-- =====================================================
-- PART 5: Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on records table
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own org records" ON records;
DROP POLICY IF EXISTS "Users can insert own org records" ON records;
DROP POLICY IF EXISTS "Users can update own org records" ON records;
DROP POLICY IF EXISTS "Users can delete own org records" ON records;

-- Policy 1: SELECT - Users can view records from their organization
CREATE POLICY "Users can view own org records"
ON records FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

-- Policy 2: INSERT - Users can insert records into their org's tables
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

-- Policy 3: UPDATE - Users can update their org's records
CREATE POLICY "Users can update own org records"
ON records FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

-- Policy 4: DELETE - Users can delete their org's records
CREATE POLICY "Users can delete own org records"
ON records FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- PART 6: Helper Functions
-- =====================================================

-- Function to sync table_columns to tables.schema
CREATE OR REPLACE FUNCTION sync_table_schema()
RETURNS TRIGGER AS $$
DECLARE
  table_schema JSONB;
  columns_array JSONB;
  statuses_array JSONB;
BEGIN
  -- Get columns for this table
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id::text,
      'name', name,
      'label', label,
      'type', type,
      'options', options,
      'required', COALESCE(is_required, false),
      'order', display_order
    ) ORDER BY display_order
  ) INTO columns_array
  FROM table_columns
  WHERE table_id = COALESCE(NEW.table_id, OLD.table_id);

  -- Get statuses for this table
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id::text,
      'name', name,
      'color', color,
      'order', display_order
    ) ORDER BY display_order
  ) INTO statuses_array
  FROM table_statuses
  WHERE table_id = COALESCE(NEW.table_id, OLD.table_id);

  -- Build complete schema
  table_schema := jsonb_build_object(
    'version', 1,
    'columns', COALESCE(columns_array, '[]'::jsonb),
    'statuses', COALESCE(statuses_array, '[]'::jsonb),
    'updated_at', now()
  );

  -- Update tables.schema
  UPDATE tables
  SET schema = table_schema,
      updated_at = now()
  WHERE id = COALESCE(NEW.table_id, OLD.table_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply sync trigger to table_columns
DROP TRIGGER IF EXISTS sync_table_schema_on_columns ON table_columns;
CREATE TRIGGER sync_table_schema_on_columns
  AFTER INSERT OR UPDATE OR DELETE ON table_columns
  FOR EACH ROW
  EXECUTE FUNCTION sync_table_schema();

-- Apply sync trigger to table_statuses
DROP TRIGGER IF EXISTS sync_table_schema_on_statuses ON table_statuses;
CREATE TRIGGER sync_table_schema_on_statuses
  AFTER INSERT OR UPDATE OR DELETE ON table_statuses
  FOR EACH ROW
  EXECUTE FUNCTION sync_table_schema();

-- =====================================================
-- PART 7: Materialized View for Statistics
-- =====================================================

-- Create materialized view for table statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS table_statistics AS
SELECT 
  t.id as table_id,
  t.name as table_name,
  t.organization_id,
  COUNT(r.id) as total_records,
  COUNT(DISTINCT r.created_by) as unique_contributors,
  MAX(r.created_at) as last_record_added,
  MIN(r.created_at) as first_record_added,
  COUNT(CASE WHEN r.created_at > now() - interval '7 days' THEN 1 END) as records_last_7_days,
  COUNT(CASE WHEN r.created_at > now() - interval '30 days' THEN 1 END) as records_last_30_days
FROM tables t
LEFT JOIN records r ON r.table_id = t.id
GROUP BY t.id, t.name, t.organization_id;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_table_stats_table_id ON table_statistics(table_id);
CREATE INDEX IF NOT EXISTS idx_table_stats_org_id ON table_statistics(organization_id);

-- Add comment
COMMENT ON MATERIALIZED VIEW table_statistics IS 'Aggregated statistics for tables. Refresh periodically for up-to-date metrics.';

-- =====================================================
-- PART 8: Initial Schema Sync
-- =====================================================

-- Sync existing table_columns and table_statuses to tables.schema
DO $$
DECLARE
  table_record RECORD;
  columns_array JSONB;
  statuses_array JSONB;
  table_schema JSONB;
BEGIN
  FOR table_record IN SELECT id FROM tables LOOP
    -- Get columns
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id::text,
        'name', name,
        'label', label,
        'type', type,
        'options', options,
        'required', COALESCE(is_required, false),
        'order', display_order
      ) ORDER BY display_order
    ) INTO columns_array
    FROM table_columns
    WHERE table_id = table_record.id;

    -- Get statuses
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id::text,
        'name', name,
        'color', color,
        'order', display_order
      ) ORDER BY display_order
    ) INTO statuses_array
    FROM table_statuses
    WHERE table_id = table_record.id;

    -- Build and update schema
    table_schema := jsonb_build_object(
      'version', 1,
      'columns', COALESCE(columns_array, '[]'::jsonb),
      'statuses', COALESCE(statuses_array, '[]'::jsonb),
      'updated_at', now()
    );

    UPDATE tables
    SET schema = table_schema
    WHERE id = table_record.id;
  END LOOP;
END $$;

-- =====================================================
-- PART 9: Grant Permissions
-- =====================================================

-- Grant necessary permissions (adjust based on your Supabase setup)
-- These are typically handled by Supabase, but included for completeness

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON records TO authenticated;
GRANT SELECT ON table_statistics TO authenticated;

-- =====================================================
-- Migration Complete
-- =====================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Created: records table with % indexes', (
    SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'records'
  );
  RAISE NOTICE 'Created: % RLS policies on records', (
    SELECT COUNT(*) FROM pg_policies WHERE tablename = 'records'
  );
  RAISE NOTICE 'Created: % triggers', (
    SELECT COUNT(*) FROM pg_trigger WHERE tgrelid = 'records'::regclass
  );
END $$;
