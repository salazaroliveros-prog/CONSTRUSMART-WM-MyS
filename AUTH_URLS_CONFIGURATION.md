# 🔐 Configuración de URLs para Google Auth y Supabase

**Fecha:** 2026-07-10  
**Proyecto:** CONSTRUSMART ERP  
**Método de Autenticación:** Supabase Auth con Google OAuth

---

## 📋 Estado Confirmado

### Google Cloud Console
- Orígenes JS autorizados presentes y confirmados:
  - `https://construsmart-wm2026.vercel.app`
  - `https://construsmart-wm2026.vercel.app`
  - `http://localhost:5173`
  - `http://localhost:8080`

- Redirect URIs presentes y confirmados:
  - `https://neygzluxugodiwcuctbj.supabase.co/auth/v1/callback`
  - `https://construsmart-wm2026.vercel.app/auth/v1/callback`
  - `https://construsmart-wm2026.vercel.app/auth/v1/callback`

### Supabase Auth
- Google Provider:
  - Client ID: `173954740912-8ln9635hlu86t991j19qdn4mkn9jvuhp.apps.googleusercontent.com`
  - Client Secret: Configurado
- Site URL: `https://construsmart-wm2026.vercel.app/`
- Redirect URLs: Configuradas por el usuario
- Passkeys RP: Configurado por el usuario

---

## 📝 Notas
- Google no requiere wildcards; usar URLs exactas cuando se agreguen nuevas variantes.
- Supabase soporta patrones `/**` para redirects.
- Mantener sincronizada cualquier URL despliegue nueva tanto en Google como en Supabase.

---

**Última actualización:** 2026-07-10  
**Estado:** Configuración aplicada y pendiente solo de pruebas reales de login.