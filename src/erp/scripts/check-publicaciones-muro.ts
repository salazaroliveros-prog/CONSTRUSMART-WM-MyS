import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPublicacionesMuro() {
  console.log('🔍 Checking erp_publicaciones_muro table status...\n');

  try {
    // Intento 1: SELECT simple
    console.log('1. Testing SELECT access...');
    const { data, error } = await supabase
      .from('erp_publicaciones_muro')
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ SELECT Error: ${error.code} - ${error.message}`);
      
      if (error.code === '42P01') {
        console.log('🔴 Table does NOT exist - needs to be created');
        console.log('\n📋 Required table structure from SUPABASE_ALIGNMENT_AUDIT.md:');
        console.log(`
CREATE TABLE public.erp_publicaciones_muro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  autor_id UUID,
  usuario_id UUID,
  contenido TEXT NOT NULL,
  tipo_publicacion TEXT DEFAULT 'general',
  likes INTEGER DEFAULT 0,
  comentarios INTEGER DEFAULT 0,
  imagenes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.erp_publicaciones_muro ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own proyecto publicaciones"
  ON public.erp_publicaciones_muro FOR SELECT
  USING (proyecto_id IN (
    SELECT id FROM public.erp_proyectos WHERE usuario_id = auth.uid()
  ));

CREATE POLICY "Users can insert own publicaciones"
  ON public.erp_publicaciones_muro FOR INSERT
  WITH CHECK (proyecto_id IN (
    SELECT id FROM public.erp_proyectos WHERE usuario_id = auth.uid()
  ));

CREATE POLICY "Users can update own publicaciones"
  ON public.erp_publicaciones_muro FOR UPDATE
  USING (autor_id = auth.uid());

CREATE POLICY "Users can delete own publicaciones"
  ON public.erp_publicaciones_muro FOR DELETE
  USING (autor_id = auth.uid());

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.erp_publicaciones_muro;

-- Create index
CREATE INDEX idx_erp_publicaciones_muro_proyecto_id ON public.erp_publicaciones_muro(proyecto_id);
CREATE INDEX idx_erp_publicaciones_muro_autor_id ON public.erp_publicaciones_muro(autor_id);
        `);
      } else {
        console.log('🟡 Table exists but has permission issues');
      }
    } else {
      console.log('✅ SELECT works - table exists and is accessible');
      console.log(`📊 Sample data: ${data.length > 0 ? 'Yes' : 'Empty table'}`);
    }
  } catch (e) {
    console.log(`❌ Exception: ${e}`);
  }

  // Intento 2: Verificar si es un VIEW
  console.log('\n2. Checking if it might be a VIEW...');
  try {
    const { data: viewData, error: viewError } = await supabase
      .from('erp_muro')
      .select('*')
      .limit(1);

    if (!viewError) {
      console.log('✅ erp_muro (VIEW) exists and is accessible');
      console.log('📝 Note: erp_muro is a VIEW, erp_publicaciones_muro should be the base table');
    }
  } catch (e) {
    console.log('⚠️  Could not check erp_muro view');
  }

  console.log('\n✅ Check complete');
}

checkPublicacionesMuro().catch(console.error);