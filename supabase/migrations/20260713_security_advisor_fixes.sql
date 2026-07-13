-- Security Advisor partial fix: v_slow_queries view + selected functions search_path
-- Date: 2026-07-13

-- Fix ERROR: security_definer_view on public.v_slow_queries (best-effort)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'v_slow_queries') THEN
    EXECUTE 'CREATE OR REPLACE VIEW public.v_slow_queries AS ' || pg_get_viewdef('public.v_slow_queries'::regclass, true);
    BEGIN
      EXECUTE 'ALTER VIEW public.v_slow_queries SET (security_invoker = true)';
    EXCEPTION
      WHEN others THEN
        NULL;
    END;
  END IF;
END $$;

-- Fix WARN: function_search_path_mutable for selected functions
-- NOTE: monitoring functions moved to 20260713_monitoring_search_path_fix.sql
CREATE OR REPLACE FUNCTION public.actualizar_timestamp_escalas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_log_audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $function$
DECLARE
  v_old jsonb := NULL;
  v_new jsonb := NULL;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    INSERT INTO public.erp_audit_log(tabla, registro_id, operacion, usuario_id, datos_anteriores, datos_nuevos)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, NULL, v_old, NULL);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    INSERT INTO public.erp_audit_log(tabla, registro_id, operacion, usuario_id, datos_anteriores, datos_nuevos)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, NULL, v_old, v_new);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    v_new := to_jsonb(NEW);
    INSERT INTO public.erp_audit_log(tabla, registro_id, operacion, usuario_id, datos_anteriores, datos_nuevos)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, NULL, NULL, v_new);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.erp_usuarios (id, email, nombre, rol)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email), 'usuario');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verificar_rol_usuario(p_user_id uuid DEFAULT NULL, p_email text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $function$
DECLARE
  v_rol text := NULL;
  v_target_id uuid := COALESCE(p_user_id, auth.uid());
BEGIN
  IF v_target_id IS NOT NULL THEN
    SELECT rol INTO v_rol FROM public.erp_usuarios WHERE id = v_target_id;
  ELSIF p_email IS NOT NULL THEN
    SELECT rol INTO v_rol FROM public.erp_usuarios WHERE email = p_email;
  END IF;
  RETURN COALESCE(v_rol, 'sin_rol');
END;
$function$;
