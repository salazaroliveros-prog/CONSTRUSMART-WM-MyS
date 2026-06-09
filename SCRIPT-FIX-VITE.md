# 🛠️ Fix para problema de Vite que desaparece

**Problema:** Vite/Vitest desaparece tras `npm install`, requiere reinstalación constante.  
**Causa:** Caché corrupta en `.vite` + lockfiles múltiples + dependencias parciales.  
**Solución:** Script automático de limpieza y reinstalación.

---

## 🔧 Ejecutar Fix

```bash
# 1. Limpieza total (Windows)
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .kilo/node_modules -ErrorAction SilentlyContinue
Remove-Item -Force .kilo/package-lock.json -ErrorAction SilentlyContinue

# 2. Limpiar caché npm
npm cache clean --force

# 3. Reinstalar todo (incluye devDependencies)
npm install --include=dev

# 4. Verificar
npx vitest run
```

---

## 🎯 Qué hace cada paso

| Comando | Propósito |
|---------|-----------|
| `Remove-Item node_modules` | Elimina carpetas corruptas |
| `Remove-Item .vite` | **Clave**: Limpia caché de Vite |
| `Remove-Item .kilo/` | Elimina lockfiles duplicados de Kilo |
| `npm cache clean` | Limpia caché global npm |
| `npm install --include=dev` | **Reinstala todo** incl. Vitest/Playwright |

---

## ⚠️ Qué evitar

- ❌ `npm install` sin `--include=dev` (pierde Vitest/Playwright)
- ❌ Conservar `.vite` o `.kilo/node_modules`
- ❌ No limpiar caché npm
- ❌ Usar `--legacy-peer-deps` (causa instalación parcial)

---

## 📊 Resultado esperado

```bash
✅ node_modules reinstalado completo
✅ .vite limpio
✅ package-lock.json único
✅ Vitest disponible: npx vitest run
✅ Playwright disponible: npx playwright test
```

**Nota:** Tras este fix, Vite/Vitest/Playwright deberían persistir entre `npm install`.

---

*Última actualización: 9 junio 2026*