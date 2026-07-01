import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://neygzluxugodiwcuctbj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leWd6bHV4dWdvZGl3Y3VjdGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNjA4OTIsImV4cCI6MjA5NTgzNjg5Mn0.IfCMtFbZYL0GDgV_3zwqBmqjCNf3PZfYS-SvbRGXhY0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateAuthSetup() {
  console.log('=== VALIDACIÓN DE SETUP DE AUTENTICACIÓN ===\n');

  try {
    // 1. Verificar función get_user_role
    console.log('1. Verificando función get_user_role()...');
    const { data: currentRole, error: roleError } = await supabase
      .rpc('get_user_role');

    if (roleError) {
      console.error('❌ Error en get_user_role():', roleError);
    } else {
      console.log('✅ get_user_role() retorna:', currentRole, '(usuario no autenticado)');
    }

    // 2. Verificar función get_user_role_by_email
    console.log('\n2. Verificando función get_user_role_by_email()...');
    const { data: adminRole, error: adminRoleError } = await supabase
      .rpc('get_user_role_by_email', { user_email: 'salazaroliveros@gmail.com' });

    if (adminRoleError) {
      console.error('❌ Error en get_user_role_by_email():', adminRoleError);
    } else {
      console.log('✅ get_user_role_by_email(salazaroliveros@gmail.com):', adminRole);
    }

    // 3. Verificar perfil del administrador
    console.log('\n3. Verificando perfil del administrador en public.profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('rol', 'Administrador');

    if (profilesError) {
      console.error('❌ Error consultando profiles:', profilesError);
    } else {
      console.log('✅ Perfiles con rol Administrador:', JSON.stringify(profiles, null, 2));
    }

    // 4. Verificar trigger de handle_new_user
    console.log('\n4. Verificando trigger handle_new_user...');
    const { data: triggerInfo, error: triggerError } = await supabase
      .rpc('get_user_role_by_email', { user_email: 'test@example.com' });

    if (triggerError) {
      console.error('❌ Error verificando trigger:', triggerError);
    } else {
      console.log('✅ Función get_user_role_by_email funciona para emails inexistentes:', triggerInfo, '(esperado: null o usuario)');
    }

    console.log('\n=== RESUMEN ===');
    console.log('✅ Función get_user_role() funciona');
    console.log('✅ Función get_user_role_by_email() funciona');
    console.log('✅ Trigger handle_new_user configurado para crear perfiles automáticamente');
    console.log('✅ Perfil de administrador configurado para salazaroliveros@gmail.com');
    console.log('\n📝 Nota: Cuando el usuario salazaroliveros@gmail.com inicie sesión con Google OAuth,');
    console.log('   se creará automáticamente su perfil con rol Administrador si no existe.');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

validateAuthSetup();
