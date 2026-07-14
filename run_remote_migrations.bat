@echo off
REM Script para ejecutar migraciones en Supabase remoto
REM Usa la conexión directa a la BD

setlocal enabledelayedexpansion

REM Credenciales (reemplazar con los valores reales)
set DB_HOST=db.neygzluxugodiwcuctbj.supabase.co
set DB_PORT=5432
set DB_USER=postgres
set DB_NAME=postgres
set DB_PASS=tu_contraseña_aqui

REM Obtener la contraseña de forma segura
for /f "tokens=*" %%i in ('powershell -Command "[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes('!DB_PASS!')) | % {$_ -replace '\+','%2B' -replace '\/','%2F' -replace '=','%3D'}"') do set DB_PASS_ENCODED=%%i

REM Construir URL (sin protección de caracteres especiales por ahora)
set DB_URL=postgresql://!DB_USER!:!DB_PASS!@!DB_HOST!:!DB_PORT!/!DB_NAME!

echo.
echo ============================================
echo Ejecutando migraciones en Supabase remoto
echo ============================================
echo Host: %DB_HOST%
echo Database: %DB_NAME%
echo User: %DB_USER%
echo.

REM Ejecutar push
supabase db push --db-url "%DB_URL%" --yes

echo.
echo ============================================
echo Migraciones completadas
echo ============================================

endlocal
