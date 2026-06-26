-- Migration 059: Fix audit trigger JSONB cast
-- Purpose: Fix jsonb_object_keys type casting issue in audit trigger
-- Risk: Low - updating trigger function
-- Rollback: Revert to previous function definition

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO erp_audit_log (table_name, record_id, action, old_data, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), auth.uid());
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO erp_audit_log (table_name, record_id, action, old_data, new_data, changed_by, changed_fields)
    VALUES (
      TG_TABLE_NAME,
      NEW.id,
      'UPDATE',
      row_to_json(OLD),
      row_to_json(NEW),
      auth.uid(),
      NULL
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO erp_audit_log (table_name, record_id, action, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
