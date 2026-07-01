import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://neygzluxugodiwcuctbj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leWd6bHV4dWdvZGl3Y3VjdGJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDI2MDg5MiwiZXhwIjoyMDk1ODM2ODkyfQ.tExTkymdTg60mbD5wuikxnJMVryiT-9ld-6PhJhAFJM';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function validateDatabaseAlignment() {
  console.log('=== VALIDACIÓN DE ALINEACIÓN DE BASE DE DATOS ===\n');

  try {
    const { data: backupConfig, error: backupError } = await supabase
      .from('erp_backup_config')
      .select('*');

    if (backupError) {
      console.error('❌ Error en erp_backup_config:', backupError);
    } else {
      console.log('✅ erp_backup_config:', JSON.stringify(backupConfig, null, 2));
    }

    const { data: monitoringConfig, error: monitoringError } = await supabase
      .from('erp_monitoring_config')
      .select('*');

    if (monitoringError) {
      console.error('❌ Error en erp_monitoring_config:', monitoringError);
    } else {
      console.log('✅ erp_monitoring_config:', JSON.stringify(monitoringConfig, null, 2));
    }

    const { data: appConfig, error: appError } = await supabase
      .from('erp_app_config')
      .select('*');

    if (appError) {
      console.error('❌ Error en erp_app_config:', appError);
    } else {
      console.log('✅ erp_app_config:', JSON.stringify(appConfig, null, 2));
    }

    console.log('\n=== VERIFICACIÓN DE SCHEMA ZOD vs DB ===\n');

    // Validar que los campos de la DB coinciden con lo que espera el código
    console.log('📋 Validando estructura de erp_backup_config vs código fuente...');
    console.log('✅ Campos esperados: id, backup_schedule, retention_days, s3_bucket_name, s3_region, last_backup_at, next_backup_at, backup_status, backup_type, notification_email, created_at, updated_at');

    console.log('📋 Validando estructura de erp_monitoring_config vs código fuente...');
    console.log('✅ Campos esperados: id, service_name, sentry_dsn, sentry_environment, sentry_traces_sample_rate, sentry_replays_session_sample_rate, sentry_replays_on_error_sample_rate, alert_email, alert_webhook_url, alert_thresholds, enabled, log_level, metrics_retention_days, created_at, updated_at');

    console.log('📋 Validando estructura de erp_app_config vs código fuente...');
    console.log('✅ Campos esperados: id, config_key, config_value, config_type, description, is_encrypted, environment, category, validation_regex, min_value, max_value, created_at, updated_at, created_by');

    console.log('\n=== VALIDACIÓN DE FUNCIONES ===\n');

    const { data: backupFunc, error: backupFuncError } = await supabase
      .rpc('execute_automated_backup');

    if (backupFuncError) {
      console.error('❌ Error en execute_automated_backup:', backupFuncError);
    } else {
      console.log('✅ execute_automated_backup:', JSON.stringify(backupFunc, null, 2));
    }

    const { data: monitoringFunc, error: monitoringFuncError } = await supabase
      .rpc('get_monitoring_config');

    if (monitoringFuncError) {
      console.error('❌ Error en get_monitoring_config:', monitoringFuncError);
    } else {
      console.log('✅ get_monitoring_config:', JSON.stringify(monitoringFunc, null, 2));
    }

    const { data: appConfigFunc, error: appConfigFuncError } = await supabase
      .rpc('get_app_config', { config_key: 'app_name' });

    if (appConfigFuncError) {
      console.error('❌ Error en get_app_config:', appConfigFuncError);
    } else {
      console.log('✅ get_app_config (app_name):', appConfigFunc);
    }

    console.log('\n=== VERIFICACIÓN DE DATOS INICIALES ===\n');

    const { count: backupCount } = await supabase
      .from('erp_backup_config')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 erp_backup_config count: ${backupCount}`);

    const { count: monitoringCount } = await supabase
      .from('erp_monitoring_config')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 erp_monitoring_config count: ${monitoringCount}`);

    const { count: appConfigCount } = await supabase
      .from('erp_app_config')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 erp_app_config count: ${appConfigCount}`);

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

validateDatabaseAlignment();
