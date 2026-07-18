-- Create missing tables referenced in APP but not in migrations
-- These tables already exist in production per remote verification

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'erp_ajustes_estacionales_actividad') THEN
    CREATE TABLE erp_ajustes_estacionales_actividad (
      id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      proyecto_id text,
      tipo_ajuste text,
      factor decimal,
      fecha_inicio date,
      fecha_fin date,
      created_at timestamp without time zone,
      updated_at timestamp without time zone
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'erp_aplicacion_escalas') THEN
    CREATE TABLE erp_aplicacion_escalas (
      id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      escala_id bigint,
      proyecto_id text,
      etapa text,
      valor_aplicado decimal,
      fecha_aplicacion date,
      created_at timestamp without time zone
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'erp_calculos_proyecto') THEN
    CREATE TABLE erp_calculos_proyecto (
      id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      proyecto_id text,
      tipo_calculo text,
      parametros jsonb,
      resultado jsonb,
      fecha_calculo timestamp without time zone,
      created_at timestamp without time zone
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'erp_cumplimiento_normativo') THEN
    CREATE TABLE erp_cumplimiento_normativo (
      id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      proyecto_id text,
      normativa text,
      estado text,
      fecha_verificacion date,
      observaciones text,
      created_at timestamp without time zone,
      updated_at timestamp without time zone
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'erp_publicaciones_muro') THEN
    CREATE TABLE erp_publicaciones_muro (
      id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      proyecto_id text,
      autor_id uuid,
      usuario_id text,
      contenido text,
      tipo_publicacion text,
      likes integer,
      comentarios jsonb,
      imagenes jsonb,
      created_at timestamp without time zone,
      updated_at timestamp without time zone,
      autor_avatar text,
      documento text
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'erp_ventas_paquetes') THEN
    CREATE TABLE erp_ventas_paquetes (
      id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      proyecto_id text,
      nombre text,
      descripcion text,
      precio decimal,
      activo boolean,
      created_at timestamp without time zone,
      updated_at timestamp without time zone
    );
  END IF;
END $$;