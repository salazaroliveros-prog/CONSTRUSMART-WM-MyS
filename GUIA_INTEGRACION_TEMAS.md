# 🔧 GUÍA DE INTEGRACIÓN - SISTEMA DE TEMAS

## Status Actual

**Build**: ✅ Funcionando  
**Tests**: ✅ 76/76 pasando  
**Temas**: ✅ 5 implementados  

---

## 📋 CHECKLIST DE INTEGRACIÓN

### Paso 1: Verificar Importaciones

Si ves error: `Cannot find module './lib/themes'`

✅ **Solución**: El archivo ya existe en `src/lib/themes.ts`

Verifica:
```bash
ls -la src/lib/themes.ts  # Debe existir
```

### Paso 2: Compilación Local

```bash
# Limpiar caché
rm -rf node_modules package-lock.json
npm install

# Compilar
npm run build

# Si hay error, ejecutar:
npm run typecheck
```

### Paso 3: Testing

```bash
npm run test

# Resultado esperado: 76/76 pasando
```

### Paso 4: Dev Server

```bash
npm run dev

# Abre http://localhost:8080
# Verifica que Login tenga botón 🎨 en esquina superior
```

---

## 🚀 DEPLOYMENT

### GitHub Workflow

El archivo `.github/workflows/ci-cd.yml` ejecuta:

1. ✅ ESLint (lint, continue-on-error)
2. ✅ TypeScript check (typecheck)
3. ✅ Vitest (test)
4. ✅ Vercel deploy (build)

**Si falla typecheck**:
```bash
npm run typecheck
# Revisar errores y corregir
```

**Si falla tests**:
```bash
npm run test
# Revisar qué test falló
```

### Vercel Deploy

El workflow automáticamente despliega a Vercel.

**URL de preview**: Visible en GitHub PR  
**URL de producción**: https://erp-construsmart-wm.vercel.app/

**Si Vercel falla**:
1. Verifica que `.env` tenga:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_KEY`
2. Ve a Vercel → Project Settings → Environment Variables
3. Asegúrate que estén configuradas

---

## 📂 ARCHIVOS NUEVOS

```
✅ src/lib/themes.ts                   → Sistema de temas
✅ src/styles/themes.css               → Estilos por tema
✅ src/components/ThemeSelector.tsx    → Selector UI
✅ src/erp/screens/LoginNew.tsx        → Login mejorado
✅ src/main.tsx                        → ACTUALIZADO
✅ TEMA_SYSTEM_DOCUMENTATION.md        → Documentación
✅ RESUMEN_SISTEMA_TEMAS.md            → Resumen ejecutivo
```

---

## ⚠️ ERRORES COMUNES

### Error 1: "Cannot find module './lib/themes'"

**Causa**: Archivo no existe en ruta esperada  
**Solución**: Verifica `src/lib/themes.ts` existe

```bash
test -f src/lib/themes.ts && echo "✅ Existe" || echo "❌ No existe"
```

### Error 2: "TypeScript error in src/main.tsx"

**Causa**: Importación dinámica  
**Solución**: Ya está corregido en versión actualizada

```bash
git pull origin main
```

### Error 3: Tema no se aplica

**Causa**: CSS no se importó  
**Solución**: Verifica que `src/main.tsx` importe:

```tsx
import './styles/themes.css'
```

### Error 4: Preview en GitHub no funciona

**Causa**: Vercel no tiene secrets configurados  
**Solución**: 

1. Ve a Vercel → Project Settings
2. Environment Variables → Production
3. Agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_KEY`
4. Retrigger deploy en GitHub

---

## 🔍 DEBUGGING

### Ver qué tema está activo

```tsx
// En console del navegador:
localStorage.getItem('wm_erp_theme')
document.documentElement.getAttribute('data-theme')
```

### Resetear tema

```tsx
// En console:
localStorage.removeItem('wm_erp_theme')
location.reload()
```

### Ver errores de build

```bash
npm run build 2>&1 | tee build.log
# Abre build.log y busca "error"
```

---

## ✅ VERIFICACIÓN FINAL

Ejecutar antes de hacer push:

```bash
#!/bin/bash

echo "🔍 Verificando..."

# 1. Archivos existen
test -f src/lib/themes.ts && echo "✅ themes.ts existe" || echo "❌ themes.ts NO existe"
test -f src/styles/themes.css && echo "✅ themes.css existe" || echo "❌ themes.css NO existe"
test -f src/components/ThemeSelector.tsx && echo "✅ ThemeSelector.tsx existe" || echo "❌ ThemeSelector.tsx NO existe"

# 2. Build
echo ""
echo "🏗️  Compilando..."
npm run build && echo "✅ Build OK" || echo "❌ Build FALLÓ"

# 3. Tests
echo ""
echo "🧪 Ejecutando tests..."
npm run test && echo "✅ Tests OK" || echo "❌ Tests FALLARON"

# 4. TypeScript
echo ""
echo "✅ Verificación de tipos..."
npm run typecheck && echo "✅ TypeScript OK" || echo "❌ TypeScript FALLÓ"

echo ""
echo "✅ Verificación completa"
```

---

## 📞 TROUBLESHOOTING

### "Build falla solo en GitHub"

Problema: Variables de entorno no configuradas en Vercel  
Solución:

```bash
# 1. Ve a Vercel.com
# 2. Selecciona proyecto
# 3. Settings → Environment Variables
# 4. Agregar VITE_SUPABASE_URL y VITE_SUPABASE_KEY
# 5. Re-trigger deploy en GitHub (push vacío)
```

### "Preview de Vercel no carga"

Problema: Build timeout en Vercel  
Solución:

```bash
# Reducir tamaño de bundle
npm run build -- --report

# Ver qué es grande y remover si no es necesario
```

### "Tema no persiste después de recargar"

Problema: localStorage deshabilitado  
Solución: Verifica que `localStorage` esté habilitado en navegador

```tsx
// En console:
try { localStorage.setItem('test', '1'); console.log('✅ localStorage OK'); } 
catch(e) { console.error('❌ localStorage deshabilitado'); }
```

---

## 🚀 PRÓXIMOS STEPS

### Inmediatos
- [ ] `npm run build` → Verificar 0 errores
- [ ] `npm run test` → Verificar 76/76
- [ ] `git push origin main` → Trigger GitHub workflow
- [ ] Esperar a que Vercel despliegue

### Si todo OK
- [ ] Abrir https://erp-construsmart-wm.vercel.app/
- [ ] Hacer login
- [ ] Click botón 🎨
- [ ] Cambiar a "Dark Pro"
- [ ] Verificar que TODA la app cambie de color/estilos

### Si algo falla
- [ ] Revisar logs en GitHub Actions
- [ ] Revisar logs en Vercel
- [ ] Ejecutar checklist arriba
- [ ] Contactar soporte

---

## 📚 REFERENCIAS

- Sistema de Temas: `TEMA_SYSTEM_DOCUMENTATION.md`
- Resumen: `RESUMEN_SISTEMA_TEMAS.md`
- API: `src/lib/themes.ts` (comentarios en código)
- Estilos: `src/styles/themes.css` (comentarios en CSS)

---

**Última actualización**: 2026-06-07  
**Versión**: 1.0  
**Status**: ✅ Listo para producción
