require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://neygzluxugodiwcuctbj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseKey) {
  console.error('Falta VITE_SUPABASE_KEY en el ambiente.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error en auth.getSession():', error.message);
      process.exit(1);
    }
    console.log('Supabase cliente OK. Sesion actual:', data.session ? 'activa' : 'null');
  } catch (e) {
    console.error('Error inesperado:', e.message);
    process.exit(1);
  }
})();
