CREATE TABLE IF NOT EXISTS public.erp_audit_log (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  table_name text,
  record_id text,
  action text,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,
  changed_at timestamp without time zone,
  changed_fields jsonb
);
