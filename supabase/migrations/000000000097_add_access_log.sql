-- Migration: Access audit log (login/logout events)
CREATE TABLE IF NOT EXISTS public.erp_access_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email       text,
  event       text NOT NULL CHECK (event IN ('sign_in', 'sign_out', 'session_refresh', 'sign_in_failed')),
  provider    text,
  ip_hint     text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_access_log_user_id  ON public.erp_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_access_log_created  ON public.erp_access_log(created_at DESC);

-- RLS: admins can read all; users can insert their own
ALTER TABLE public.erp_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "access_log_insert_own" ON public.erp_access_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "access_log_select_admin" ON public.erp_access_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.erp_usuarios u
      WHERE u.id = auth.uid() AND u.rol = 'administrador'
    )
  );

-- Anon cannot access
REVOKE ALL ON public.erp_access_log FROM anon;
