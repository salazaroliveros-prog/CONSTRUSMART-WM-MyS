# Blocker de Red - Supabase

## Fecha
17/7/2026, 12:41 p.m.

## Síntoma
Todas las conexiones salientes al proyecto Supabase `neygzluxugodiwcuctbj` fallan por timeout en puerto 5432.

## Intentos realizados
1. `npx supabase db remote changes --db-url postgresql://...` → timeout
2. `psql` cliente local → timeout
3. `docker run postgres:latest psql --version` → TLS handshake timeout descargando imagen

## Direcciones resueltas
- Hostname: `neygzluxugodiwcuctbj.supabase.co`
- IPv4: `172.64.149.246`
- CDN: `104.18.38.10`

## Error
```
falló la conexión al servidor en «neygzluxugodiwcuctbj.supabase.co» (172.64.149.246), puerto 5432: Connection timed out
```

## Causa raíz
Red local/proxy/firewall bloqueando tráfico hacia Supabase en puerto 5432.

## Impacto
No se puede aplicar ni verificar la migration automáticamente.

## Mitigación
- Aplicar `supabase/migrations/000000000121_fix_missing_columns_and_rls.sql` manualmente desde Supabase Dashboard → SQL Editor.
- Si el bloqueo persiste, usar SQL Editor en dashboard o VPN/red sin restricciones.

## Estado
Pendiente aplicación manual de migration.