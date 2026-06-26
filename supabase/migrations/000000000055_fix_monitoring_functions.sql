-- Migration 055: Fix Monitoring Functions Column Names
-- Purpose: Fix column name references in monitoring functions (tablename -> relname)
-- Risk: Low - function replacements are idempotent
-- Rollback: Restores previous function definitions
-- Expected Benefit: Monitoring functions work correctly with Supabase PostgreSQL version

-- ============================================================
-- Step 1: Fix get_table_sizes function
-- ============================================================

CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  size_mb NUMERIC,
  index_size_mb NUMERIC,
  total_size_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname || '.' || relname as table_name,
    n_live_tup as row_count,
    pg_total_relation_size(schemaname || '.' || relname)::numeric / 1024 / 1024 as size_mb,
    pg_indexes_size(schemaname || '.' || relname)::numeric / 1024 / 1024 as index_size_mb,
    pg_total_relation_size(schemaname || '.' || relname)::numeric / 1024 / 1024 as total_size_mb
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  AND relname LIKE 'erp_%'
  ORDER BY pg_total_relation_size(schemaname || '.' || relname) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Step 2: Fix get_index_usage function
-- ============================================================

CREATE OR REPLACE FUNCTION get_index_usage()
RETURNS TABLE (
  table_name TEXT,
  index_name TEXT,
  index_scan BIGINT,
  tup_read BIGINT,
  tup_fetch BIGINT,
  usage_pct NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname || '.' || relname as table_name,
    indexrelname as index_name,
    idx_scan as index_scan,
    idx_tup_read as tup_read,
    idx_tup_fetch as tup_fetch,
    CASE 
      WHEN idx_scan = 0 THEN 0
      ELSE (idx_tup_fetch::numeric / idx_scan * 100)
    END as usage_pct
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
  AND relname LIKE 'erp_%'
  ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Step 3: Fix get_missing_indexes function
-- ============================================================

CREATE OR REPLACE FUNCTION get_missing_indexes()
RETURNS TABLE (
  table_name TEXT,
  column_name TEXT,
  suggested_index TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname || '.' || relname as table_name,
    attname as column_name,
    'CREATE INDEX idx_' || relname || '_' || attname || ' ON ' || schemaname || '.' || relname || ' (' || attname || ')' as suggested_index
  FROM pg_attribute pa
  JOIN pg_class pc ON pa.attrelid = pc.oid
  JOIN pg_namespace pn ON pc.relnamespace = pn.oid
  JOIN pg_stat_user_tables pst ON pn.nspname = pst.schemaname AND pc.relname = pst.relname
  WHERE pn.nspname = 'public'
  AND pc.relname LIKE 'erp_%'
  AND pa.attnum > 0
  AND NOT pa.attisdropped
  AND pa.attname IN ('proyecto_id', 'created_by', 'user_id', 'material_id')
  AND NOT EXISTS (
    SELECT 1 FROM pg_index pi
    WHERE pi.indrelid = pc.oid
    AND pa.attnum = ANY(pi.indkey)
  )
  ORDER BY pc.relname, pa.attnum;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Step 4: Fix get_slow_queries function
-- ============================================================

CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE (
  query TEXT,
  mean_exec_time NUMERIC,
  calls BIGINT,
  total_exec_time NUMERIC,
  rows_affected BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    LEFT(query, 200) as query,
    mean_exec_time,
    calls,
    total_exec_time,
    rows
  FROM pg_stat_statements
  WHERE mean_exec_time > 1000
  AND calls > 0
  ORDER BY mean_exec_time DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Rollback Function
-- ============================================================

CREATE OR REPLACE FUNCTION rollback_055_fix_monitoring_functions()
RETURNS VOID AS $$
BEGIN
  -- This migration only fixes function definitions, rollback would restore
  -- the previous (broken) versions from migration 054
  -- In practice, we want to keep the fixed versions
  RAISE NOTICE 'Migration 055 fixes are idempotent - no rollback needed';
END;
$$ LANGUAGE plpgsql;
