import pg from 'pg';

const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54260/postgres';

async function applyMigration() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Connected to local Supabase');

    const sql = `
      -- Si la tabla ya existía con el esquema viejo (migración 064), añadir columnas faltantes
      ALTER TABLE public.erp_destajos ADD COLUMN IF NOT EXISTS renglon_codigo text;
      ALTER TABLE public.erp_destajos ADD COLUMN IF NOT EXISTS cuadrilla text;
      ALTER TABLE public.erp_destajos ADD COLUMN IF NOT EXISTS cantidad_ejecutada numeric(10,2);
      ALTER TABLE public.erp_destajos ADD COLUMN IF NOT EXISTS unidad text;
      ALTER TABLE public.erp_destajos ADD COLUMN IF NOT EXISTS horas_trabajadas numeric(10,2);
      ALTER TABLE public.erp_destajos ADD COLUMN IF NOT EXISTS rendimiento_teorico numeric(10,2);
      ALTER TABLE public.erp_destajos ADD COLUMN IF NOT EXISTS rendimiento_real numeric(10,2) DEFAULT 0;
      ALTER TABLE public.erp_destajos ADD COLUMN IF NOT EXISTS eficiencia numeric(5,2) DEFAULT 0;
      ALTER TABLE public.erp_destajos ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

      -- Migrar datos del esquema viejo al nuevo si es necesario
      UPDATE public.erp_destajos 
      SET 
        renglon_codigo = COALESCE(concepto, ''),
        cuadrilla = COALESCE(trabajador, ''),
        cantidad_ejecutada = COALESCE(cantidad, 0),
        unidad = COALESCE(unidad, ''),
        horas_trabajadas = 0,
        rendimiento_teorico = 0,
        rendimiento_real = 0,
        eficiencia = 0
      WHERE renglon_codigo IS NULL;

      -- Eliminar columnas del esquema viejo que no se usan en la app
      ALTER TABLE public.erp_destajos DROP COLUMN IF EXISTS trabajador;
      ALTER TABLE public.erp_destajos DROP COLUMN IF EXISTS concepto;
      ALTER TABLE public.erp_destajos DROP COLUMN IF EXISTS cantidad;
      ALTER TABLE public.erp_destajos DROP COLUMN IF EXISTS precio_unitario;
      ALTER TABLE public.erp_destajos DROP COLUMN IF EXISTS total;

      -- Ahora sí: RLS e índices
      ALTER TABLE public.erp_destajos ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "erp_destajos_select" ON public.erp_destajos;
      CREATE POLICY "erp_destajos_select" ON public.erp_destajos FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
      );

      DROP POLICY IF EXISTS "erp_destajos_insert" ON public.erp_destajos;
      CREATE POLICY "erp_destajos_insert" ON public.erp_destajos FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
      );

      DROP POLICY IF EXISTS "erp_destajos_update" ON public.erp_destajos;
      CREATE POLICY "erp_destajos_update" ON public.erp_destajos FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
      );

      CREATE INDEX IF NOT EXISTS idx_destajos_proyecto ON public.erp_destajos(proyecto_id);
      CREATE INDEX IF NOT EXISTS idx_destajos_fecha ON public.erp_destajos(fecha);
      CREATE INDEX IF NOT EXISTS idx_destajos_renglon ON public.erp_destajos(renglon_codigo);
      CREATE INDEX IF NOT EXISTS idx_destajos_cuadrilla ON public.erp_destajos(cuadrilla);

      DROP TRIGGER IF EXISTS trg_erp_destajos_updated ON public.erp_destajos;
      CREATE TRIGGER trg_erp_destajos_updated
        BEFORE UPDATE ON public.erp_destajos
        FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
    `;

    await client.query(sql);
    console.log('✅ Migration applied successfully');

    const renglonCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'erp_destajos'
        AND column_name = 'renglon_codigo'
    `);
    console.log('renglon_codigo exists:', renglonCheck.rows.length > 0 ? 'YES' : 'NO');

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch (endError) {
      console.error('Error closing client:', endError);
    }
    process.exit(1);
  }
}

applyMigration();
