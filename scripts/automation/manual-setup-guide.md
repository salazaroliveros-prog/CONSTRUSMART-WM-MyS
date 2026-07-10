# 🎯 Guía Interactiva de Configuración Manual

**Fecha:** 2026-07-10  
**Estado:** ✅ **GUÍA CREADA**  
**Tiempo estimado:** 5-10 minutos

---

## 📋 Resumen

Dado que ya estás logueado en Google, Supabase y Vercel en tu Chrome normal, esta guía te llevará paso a paso para completar la configuración manualmente usando tus sesiones existentes.

---

## 🌐 Paso 1: Google Cloud Console OAuth

### Objetivo
Configurar Authorized JavaScript Origins y Authorized Redirect URIs

### URLs a Configurar
```
http://localhost:8080
http://localhost:5173
https://construsmart-wm2026.vercel.app
https://construsmart-wm2026-proyectoswm.vercel.app
https://construsmart-wm2026-salazaroliveros-prog-proyectoswm.vercel.app
```

### Instrucciones
1. **Abre en tu Chrome:** https://console.cloud.google.com/apis/credentials
2. **Busca el Client ID:** `173954740912-tn6iib9i3179ulv1mn81j3tmarh2ouf4.apps.googleusercontent.com`
3. **Click en el Client ID** para abrir la configuración
4. **Click en "Edit"** para editar las credenciales OAuth
5. **Authorized JavaScript Origins:**
   - Busca el campo "Authorized JavaScript origins"
   - Agrega las 5 URLs de arriba (una por línea)
   - Si ya existen algunas, solo agrega las que faltan
6. **Authorized Redirect URIs:**
   - Busca el campo "Authorized redirect URIs"
   - Agrega las mismas 5 URLs (una por línea)
   - Si ya existen algunas, solo agrega las que faltan
7. **Click en "Save"** para guardar los cambios

### ✅ Verificación
- [ ] Las 5 URLs están en Authorized JavaScript Origins
- [ ] Las 5 URLs están en Authorized Redirect URIs
- [ ] Los cambios fueron guardados exitosamente

---

## 🔷 Paso 2: Supabase Authentication

### Objetivo
Configurar Site URL y Redirect URLs

### Site URL
```
https://construsmart-wm2026.vercel.app
```

### Redirect URLs
```
http://localhost:8080
http://localhost:5173
https://construsmart-wm2026.vercel.app
https://construsmart-wm2026-proyectoswm.vercel.app
https://construsmart-wm2026-salazaroliveros-prog-proyectoswm.vercel.app
```

### Instrucciones
1. **Abre en tu Chrome:** https://supabase.com/dashboard/project/neygzluxugodiwcuctbj/auth/url-configuration
2. **Configurar Site URL:**
   - Busca el campo "Site URL"
   - Ingresa: `https://construsmart-wm2026.vercel.app`
3. **Configurar Redirect URLs:**
   - Busca el campo "Redirect URLs"
   - Agrega las 5 URLs de arriba (una por línea)
   - Si ya existen algunas, solo agrega las que faltan
4. **Click en "Save"** para guardar los cambios
5. **Verificar Google Provider:**
   - Navega a: https://supabase.com/dashboard/project/neygzluxugodiwcuctbj/auth/providers
   - Busca "Google" en la lista de providers
   - Verifica que esté habilitado (toggle en ON)
   - Verifica que tenga Client ID y Client Secret configurados

### ✅ Verificación
- [ ] Site URL está configurado correctamente
- [ ] Las 5 URLs están en Redirect URLs
- [ ] Google Provider está habilitado
- [ ] Google Provider tiene credenciales configuradas

---

## 🌐 Paso 3: Vercel Environment Variables

### Objetivo
Configurar VITE_OPENWEATHER_API_KEY en ambiente Preview

### Variable a Configurar
```
Nombre: VITE_OPENWEATHER_API_KEY
Valor: OPENWEATHER_API_KEY_PLACEHOLDER
Ambientes: Preview y Production
```

### Instrucciones
1. **Abre en tu Chrome:** https://vercel.com/proyectoswm/construsmart/settings/environment-variables
2. **Click en "Add New"** para agregar una nueva variable
3. **Configurar la variable:**
   - Name: `VITE_OPENWEATHER_API_KEY`
   - Value: `OPENWEATHER_API_KEY_PLACEHOLDER`
   - Environments: Selecciona "Preview" y "Production"
4. **Click en "Save"** para guardar los cambios

### ✅ Verificación
- [ ] VITE_OPENWEATHER_API_KEY está configurado
- [ ] Está habilitado para Preview
- [ ] Está habilitado para Production

---

## 📊 Checklist Final

### Google Cloud Console
- [ ] Authorized JavaScript Origins configurados (5 URLs)
- [ ] Authorized Redirect URIs configurados (5 URLs)
- [ ] Client ID: `173954740912-tn6iib9i3179ulv1mn81j3tmarh2ouf4.apps.googleusercontent.com`

### Supabase Authentication
- [ ] Site URL: `https://construsmart-wm2026.vercel.app`
- [ ] Redirect URLs configurados (5 URLs)
- [ ] Google Provider habilitado
- [ ] Google Provider con credenciales

### Vercel Environment Variables
- [ ] VITE_OPENWEATHER_API_KEY configurado
- [ ] Habilitado para Preview y Production

---

## 🎉 Completado

Una vez que hayas completado todos los pasos anteriores:

1. **Verifica la configuración:**
   - Google Cloud Console: https://console.cloud.google.com/apis/credentials
   - Supabase Auth: https://supabase.com/dashboard/project/neygzluxugodiwcuctbj/auth/url-configuration
   - Vercel Env Vars: https://vercel.com/proyectoswm/construsmart/settings/environment-variables

2. **Prueba la autenticación:**
   - Abre tu aplicación local: `http://localhost:8080`
   - Intenta iniciar sesión con Google
   - Verifica que funcione correctamente

3. **Despliega a producción:**
   - Los cambios ya deberían estar sincronizados
   - Verifica el despliegue en Vercel

---

## 🆘 Troubleshooting

### Error: "redirect_uri_mismatch"
**Causa:** La URL de redirección no está configurada en Google Cloud Console  
**Solución:** Verifica que todas las URLs estén en Authorized Redirect URIs

### Error: "unauthorized_client"
**Causa:** El Client ID de Google no está configurado en Supabase  
**Solución:** Verifica que el Google Provider en Supabase tenga las credenciales correctas

### Error: "Invalid redirect_uri"
**Causa:** La URL no está en la lista de Redirect URLs de Supabase  
**Solución:** Agrega la URL en Supabase → Authentication → Redirect URLs

---

**Última actualización:** 2026-07-10  
**Estado:** Guía interactiva creada  
**Próximo paso:** Completar configuración manual usando esta guía
