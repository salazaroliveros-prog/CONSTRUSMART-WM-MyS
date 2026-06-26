-- Migration 056: Deadlock Prevention Functions
-- This migration adds helper functions for transaction management and deadlock prevention

-- Function to begin a transaction with specified isolation level
CREATE OR REPLACE FUNCTION begin_transaction(isolation_level TEXT DEFAULT 'READ COMMITTED')
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('SET TRANSACTION ISOLATION LEVEL %s', isolation_level);
END;
$$;

-- Function to commit a transaction
CREATE OR REPLACE FUNCTION commit_transaction()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  COMMIT;
END;
$$;

-- Function to rollback a transaction
CREATE OR REPLACE FUNCTION rollback_transaction()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  ROLLBACK;
END;
$$;

-- Function to acquire an advisory lock with timeout
CREATE OR REPLACE FUNCTION try_advisory_lock(lock_id BIGINT, timeout_ms INTEGER DEFAULT 5000)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  start_time TIMESTAMP := NOW();
  locked BOOLEAN;
BEGIN
  WHILE (NOW() - start_time) * 1000 < timeout_ms LOOP
    locked := pg_try_advisory_xact_lock(lock_id);
    IF locked THEN
      RETURN TRUE;
    END IF;
    PERFORM pg_sleep(0.1);
  END LOOP;
  RETURN FALSE;
END;
$$;

-- Function to release an advisory lock
CREATE OR REPLACE FUNCTION release_advisory_lock(lock_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN pg_advisory_unlock(lock_id);
END;
$$;

-- Function to log deadlock events
CREATE OR REPLACE FUNCTION log_deadlock_event(
  operation TEXT,
  table_name TEXT,
  lock_key TEXT,
  error_message TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO erp_auditoria (
    tabla,
    operacion,
    usuario_id,
    detalles,
    created_at
  ) VALUES (
    table_name,
    'DEADLOCK',
    auth.uid(),
    jsonb_build_object(
      'operation', operation,
      'lock_key', lock_key,
      'error_message', error_message,
      'timestamp', NOW()
    ),
    NOW()
  );
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION begin_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION commit_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION rollback_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION try_advisory_lock TO authenticated;
GRANT EXECUTE ON FUNCTION release_advisory_lock TO authenticated;
GRANT EXECUTE ON FUNCTION log_deadlock_event TO authenticated;

-- Rollback function
CREATE OR REPLACE FUNCTION rollback_056_deadlock_prevention()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  DROP FUNCTION IF EXISTS begin_transaction(TEXT);
  DROP FUNCTION IF EXISTS commit_transaction();
  DROP FUNCTION IF EXISTS rollback_transaction();
  DROP FUNCTION IF EXISTS try_advisory_lock(BIGINT, INTEGER);
  DROP FUNCTION IF EXISTS release_advisory_lock(BIGINT);
  DROP FUNCTION IF EXISTS log_deadlock_event(TEXT, TEXT, TEXT, TEXT);
END;
$$;
