#!/bin/bash

# ============================================================
# CONSTRUSMART ERP - Automated Backup Script
# ============================================================
# Este script ejecuta backups automáticos de la base de datos
# de Supabase y los almacena en S3 o localmente
# ============================================================

set -e

# Cargar variables de entorno
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Configuración
PROJECT_REF="${VITE_SUPABASE_URL##*/}"
PROJECT_REF="${PROJECT_REF%%.supabase.co}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
BACKUP_FILE="backup_${PROJECT_REF}_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"
COMPRESSED_FILE="${BACKUP_PATH}.gz"

# Crear directorio de backups
mkdir -p "${BACKUP_DIR}"

echo "========================================="
echo "CONSTRUSMART ERP - Automated Backup"
echo "========================================="
echo "Project Ref: ${PROJECT_REF}"
echo "Timestamp: ${TIMESTAMP}"
echo "Backup File: ${BACKUP_FILE}"
echo ""

# Verificar que Supabase CLI esté instalado
if ! command -v supabase &> /dev/null; then
  echo "ERROR: Supabase CLI no está instalado"
  echo "Instalar con: npm install -g supabase"
  exit 1
fi

# Verificar que el proyecto esté linkeado
echo "Verificando conexión con Supabase..."
if ! supabase projects list &> /dev/null; then
  echo "ERROR: No hay proyectos linkeados en Supabase CLI"
  echo "Linkear el proyecto con: supabase link --project-ref ${PROJECT_REF}"
  exit 1
fi

# Ejecutar backup
echo "Iniciando backup de base de datos..."
supabase db dump --linked -f "${BACKUP_PATH}" --data-only --schema public

if [ $? -eq 0 ]; then
  echo "✓ Backup completado exitosamente"
else
  echo "✗ Error al ejecutar backup"
  exit 1
fi

# Comprimir backup
echo "Comprimiendo backup..."
gzip "${BACKUP_PATH}"

if [ $? -eq 0 ]; then
  echo "✓ Backup comprimido exitosamente"
  COMPRESSED_SIZE=$(du -h "${COMPRESSED_FILE}" | cut -f1)
  echo "Tamaño comprimido: ${COMPRESSED_SIZE}"
else
  echo "✗ Error al comprimir backup"
  exit 1
fi

# Subir a S3 si está configurado
if [ -n "${AWS_S3_BUCKET}" ] && [ -n "${AWS_ACCESS_KEY_ID}" ] && [ -n "${AWS_SECRET_ACCESS_KEY}" ]; then
  echo "Subiendo backup a S3..."
  
  aws s3 cp "${COMPRESSED_FILE}" "s3://${AWS_S3_BUCKET}/backups/${BACKUP_FILE}.gz"
  
  if [ $? -eq 0 ]; then
    echo "✓ Backup subido a S3 exitosamente"
  else
    echo "✗ Error al subir a S3"
    exit 1
  fi
fi

# Limpiar backups antiguos (retención)
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
echo "Limpiando backups antiguos (más de ${RETENTION_DAYS} días)..."

find "${BACKUP_DIR}" -name "backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "✓ Limpieza completada"

# Obtener cantidad de backups actuales
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "backup_*.sql.gz" | wc -l)
echo "Backups actuales: ${BACKUP_COUNT}"

# Registro de backup en base de datos (si hay conexión)
if [ -n "${DATABASE_URL}" ]; then
  echo "Registrando backup en base de datos..."
  
  psql "${DATABASE_URL}" -c "
    INSERT INTO erp_audit_log (
      usuario_id, 
      usuario_nombre, 
      accion, 
      entidad, 
      valores_nuevos, 
      created_at
    ) VALUES (
      NULL,
      'SYSTEM',
      'backup_created',
      'database',
      jsonb_build_object(
        'backup_file', '${BACKUP_FILE}.gz',
        'backup_size', '${COMPRESSED_SIZE}',
        'backup_count', ${BACKUP_COUNT},
        'retention_days', ${RETENTION_DAYS},
        'timestamp', '${TIMESTAMP}'
      ),
      now()
    );
  " 2>/dev/null || echo "No se pudo registrar en base de datos (continuando sin registro)"
fi

echo ""
echo "========================================="
echo "Backup completado exitosamente"
echo "========================================="
echo "Archivo: ${COMPRESSED_FILE}"
echo "Tamaño: ${COMPRESSED_SIZE}"
echo "Backups actuales: ${BACKUP_COUNT}"
echo "Próximo backup: $(date -d '+1 day' '+%Y-%m-%d %H:%M:%S')"
echo ""

exit 0