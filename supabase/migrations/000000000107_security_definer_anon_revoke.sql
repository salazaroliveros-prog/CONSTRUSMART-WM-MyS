-- ============================================================================
-- MIGRACIÓN: Security Advisor - SECURITY DEFINER fixes
-- Revoca EXECUTE de anon/authenticated segun tipo de funcion
-- ============================================================================

DO $$
DECLARE
  r record;
BEGIN
  -- 1. Revoke EXECUTE from anon on ALL SECURITY DEFINER functions
  FOR r IN 
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname NOT IN ('exec_sql', 'exec_sql_returning')
  LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM anon', r.proname, r.args);
    EXCEPTION WHEN undefined_function THEN
      NULL;
    END;
  END LOOP;

  -- 2. Revoke EXECUTE from authenticated on admin-only functions
  FOR r IN 
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname IN (
        'assign_user_role',
        'document_backup_restore',
        'enforce_single_admin',
        'exec_sql_returning',
        'execute_automated_backup',
        'fn_force_administrator_unique',
        'get_index_usage',
        'get_missing_indexes',
        'get_slow_queries',
        'get_user_role_by_email',
        'log_deadlock_event',
        'rls_auto_enable',
        'update_app_config',
        'audit_trigger_func',
        'fn_log_audit',
        'set_updated_at',
        'begin_transaction',
        'commit_transaction',
        'rollback_transaction',
        'try_advisory_lock',
        'release_advisory_lock'
      )
  LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM authenticated', r.proname, r.args);
    EXCEPTION WHEN undefined_function THEN
      NULL;
    END;
  END LOOP;
END $$;
