#!/bin/bash

# Script para ejecutar migraciones en Supabase local
# Usa el archivo de migración creado

DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Leer archivo SQL
SQL_FILE="supabase/migrations/0100_tier1_critical_fixes.sql"

echo "✅ Conectando a Supabase local en: $DB_URL"
echo "📝 Ejecutando migraciones desde: $SQL_FILE"
echo ""

# Crear conexión y ejecutar SQL
docker exec -i supabase_db_CONSTRUSMART psql "$DB_URL" -f "$SQL_FILE" 2>&1

echo ""
echo "✅ Migraciones ejecutadas"
