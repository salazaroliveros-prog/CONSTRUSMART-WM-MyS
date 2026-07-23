# Script para ejecutar migraciones pendientes (120-135) en Supabase local
param(
    [string]$MigrationsDir = "supabase\migrations",
    [string]$ContainerName = "supabase_db_CONSTRUSMART"
)

Write-Host "=== CONSTRUSMART DB - Migraciones Pendientes 120-135 ===" -ForegroundColor Cyan
Write-Host ""

$pending = @(
    "000000000120_create_erp_ventas_paquetes.sql",
    "000000000121_fix_missing_columns_and_rls.sql",
    "000000000122_fix_rls_if_tables_exist.sql",
    "000000000123_create_erp_audit_log.sql",
    "000000000124_create_missing_tables.sql",
    "000000000125_create_missing_tables_and_fix_rls.sql",
    "000000000126_complete_schema_alignment.sql",
    "000000000127_strategic_composite_indexes.sql",
    "000000000128_db_app_full_alignment.sql",
    "000000000129_additional_indexes_and_fixes.sql",
    "000000000130_final_db_app_alignment.sql",
    "000000000131_create_missing_tables_and_clean_legacy.sql",
    "000000000132_cleanup_unused_objects.sql",
    "000000000133_harden_rls_policies.sql",
    "000000000134_harden_weather_and_clean_duplicates.sql",
    "000000000135_harden_new_tables_rls.sql"
)

$successCount = 0
$failCount = 0

foreach ($file in $pending) {
    $filePath = Join-Path $MigrationsDir $file
    $tmpName = $file -replace '\.sql$', ''
    
    if (-not (Test-Path $filePath)) {
        Write-Host "⚠️  No se encuentra: $file" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "▶️  Aplicando $($file.Substring(0,15)) — $($file.Substring(16).Replace('.sql',''))..." -ForegroundColor Green
    
    # Copiar archivo al contenedor
    $copyResult = docker cp $filePath "${ContainerName}:/tmp/${tmpName}.sql" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Error copiando: $copyResult" -ForegroundColor Red
        $failCount++
        continue
    }
    
    # Registrar migración en la tabla de control
    $version = $file.Split('_')[0]
    $name = $file.Replace('.sql','')
    docker exec $ContainerName sh -c "PGPASSWORD=postgres psql -U postgres -c \"INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('$version', '$name') ON CONFLICT (version) DO NOTHING;\"" 2>&1 | Out-Null
    
    # Ejecutar SQL
    $result = docker exec $ContainerName sh -c "PGPASSWORD=postgres psql -U postgres -f /tmp/${tmpName}.sql" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Completado" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "  ❌ Falló:" -ForegroundColor Red
        $result | ForEach-Object { Write-Host "     $_" -ForegroundColor DarkRed }
        $failCount++
    }
    
    # Limpiar archivo temporal
    docker exec $ContainerName sh -c "rm -f /tmp/${tmpName}.sql" 2>&1 | Out-Null
}

Write-Host ""
Write-Host "=== RESUMEN ===" -ForegroundColor Cyan
Write-Host "✅ Exitosas: $successCount" -ForegroundColor Green
if ($failCount -gt 0) { Write-Host "❌ Fallidas: $failCount" -ForegroundColor Red }

# Verificar estado final
Write-Host "`n=== MIGRACIONES REGISTRADAS ===" -ForegroundColor Cyan
docker exec $ContainerName sh -c "PGPASSWORD=postgres psql -U postgres -c 'SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;'" 2>&1