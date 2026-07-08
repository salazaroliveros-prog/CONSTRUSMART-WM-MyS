# Fix de Security Advisor — 230 Warnings

**Migración:** `supabase/migrations/000000000089_security_advisor_complete_fix.sql`
**Commit:** `8fd98e2`

---

## Qué hace esta migración

1. **Habilita RLS** en todas las tablas `erp_*` (39 tablas operacionales)
2. **Elimina políticas permisivas** `USING (true)` / `WITH CHECK (true)` restantes
3. **Crea políticas RLS específicas** por tabla usando `proyecto_id`
4. **Revoca acceso `anon`** de TODAS las tablas operacionales
5. **Garantiza acceso `authenticated`** solo via RLS (no directo)
6. **Revoca EXECUTE** de funciones `SECURITY DEFINER` a roles públicos
7. **Crea RPC `security_advisor_check()`** para monitoreo continuo
8. **Agrega triggers de auditoría** en tablas sensibles
9. **Documenta** comentarios de seguridad en tablas y schema

---

## Cómo aplicar

### Opción A: Supabase CLI (recomendado)

```bash
cd /ruta/a/CONSTRUSMART
supabase db push
```

### Opción B: Supabase Dashboard

1. Ir a https://supabase.com/dashboard/project/neygzluxugodiwcuctbj/editor
2. Abrir **SQL Editor**
3. Copiar contenido de `supabase/migrations/000000000089_security_advisor_complete_fix.sql`
4. Pegar y ejecutar
5. Verificar que no haya errores

### Opción C: Supabase CLI local + remote

```bash
# Vincular proyecto (si no está vinculado)
supabase link --project-id neygzluxugodiwcuctbj

# Aplicar migración
supabase db push
```

---

## Verificación post-migración

### 1. Ejecutar RPC de verificación

```sql
SELECT * FROM security_advisor_check();
```

Debería mostrar:
- `rls_enabled = true` en todas las tablas
- `policies_count > 0`
- `has_permissive_policy = false`
- `anon_can_select = false`

### 2. Verificar en Dashboard

1. Ir a **Security Advisor** en Supabase Dashboard
2. Verificar que los warnings bajen de 230 a 0 (o接近 0)
3. Los warnings restantes deberían ser solo:
   - Backup/PITR no configurado (requiere configuración manual)
   - MFA/2FA no habilitado (requiere acción en Auth settings)

### 3. Probar aplicación

1. Abrir https://construsmart-wm2026.vercel.app/
2. Verificar que el login funcione
3. Verificar que los datos se carguen correctamente
4. Verificar que no haya errores 500 en consola

---

## Troubleshooting

### Error: "relation already exists"
- La migración es idempotente, usa `DROP POLICY IF EXISTS`
- Si hay error, verificar que la tabla existe antes de ejecutar

### Error: "permission denied for schema public"
- Asegurarse de ejecutar como superusuario o service_role
- En dashboard, usar SQL Editor con credenciales de admin

### App no carga datos después de la migración
- Verificar que las políticas RLS permitan acceso al usuario autenticado
- Verificar que `auth.uid()` esté disponible en el contexto
- Revisar logs de Supabase para errores 500/503

---

## Próximos pasos

- [ ] Aplicar migración 089 en Supabase Dashboard
- [ ] Verificar Security Advisor warnings resueltos
- [ ] Configurar PITR/backups automáticos en Supabase Dashboard
- [ ] Habilitar MFA/2FA en Auth settings
- [ ] Monitorear `security_advisor_check()` periódicamente

---

**Nota:** Esta migración no se aplica automáticamente. Debes ejecutarla manualmente en Supabase Dashboard o CLI.