-- =====================================================
-- Migration: Cleanup Legacy CRM Tables
-- Date: 2024-11-15
-- Description: Remove old customers-specific tables that are
--              no longer needed after migration to generic records table
-- =====================================================

-- Drop dependent tables first (foreign key constraints)
DROP TABLE IF EXISTS customer_activity_log CASCADE;
DROP TABLE IF EXISTS duplicate_candidates CASCADE;

-- Drop the old customers table
DROP TABLE IF EXISTS customers CASCADE;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Legacy tables cleanup completed successfully!';
  RAISE NOTICE 'Dropped: customer_activity_log, duplicate_candidates, customers';
END $$;
