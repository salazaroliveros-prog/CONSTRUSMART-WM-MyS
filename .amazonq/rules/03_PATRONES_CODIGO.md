# 🔧 PATRONES DE CÓDIGO — ERP CONSTRUSMART
> Copy-paste ready. Usar estos patrones para mantener consistencia.
> Última actualización: 2026-06-05

---

## Nueva pantalla (patrón estándar)

### 1. Crear `src/erp/screens/MiPantalla.tsx`
```typescript
import { useState } from 'react'
import { useErp } from '@/erp/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
})
type FormData = z.infer<typeof schema>

export default function MiPantalla() {
  const { proyectos } = useErp()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold">Mi Pantalla</h1>
      {/* contenido */}
    </div>
  )
}
```

### 2. Agregar a `AppLayout.tsx`
```typescript
const MiPantalla = lazy(() => import('@/erp/screens/MiPantalla'))
// En el switch de vistas:
case 'mi-pantalla': return <MiPantalla />
```

### 3. Agregar VIEW type en `store.tsx`
```typescript
// Buscar: type ErpView = ... y agregar 'mi-pantalla'
```

### 4. Agregar al `Sidebar.tsx`
```typescript
{ icon: IconName, label: 'Mi Pantalla', view: 'mi-pantalla', group: 'GRUPO' }
```

---

## Validación Zod (formulario completo)

```typescript
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  nombre:  z.string().min(1, 'Requerido').max(100, 'Máx 100 chars'),
  monto:   z.coerce.number().positive('Debe ser > 0'),
  fecha:   z.string().min(1, 'Requerido'),
  estado:  z.enum(['activo', 'inactivo']),
})
type FormData = z.infer<typeof schema>

// Uso en componente:
const form = useForm<FormData>({ resolver: zodResolver(schema) })
const onSubmit = (data: FormData) => { /* data es type-safe */ }

// En JSX — mostrar error:
{form.formState.errors.nombre && (
  <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
)}
```

---

## Acceso al store

```typescript
const {
  proyectos, movimientos, empleados, materiales,
  ordenes, proveedores, presupuestos, licitaciones,
  avances, valesSalida, notificaciones,
  addProyecto, updateProyecto, deleteProyecto,
  addMovimiento, updateMovimiento,
  setView, selectedProyectoId, setSelectedProyectoId,
} = useErp()
```

---

## Debounce en búsqueda

```typescript
import { useDebounce } from '@/hooks/useDebounce'

const [search, setSearch] = useState('')
const debouncedSearch = useDebounce(search, 400)

const filtered = items.filter(i =>
  i.nombre.toLowerCase().includes(debouncedSearch.toLowerCase())
)
```

---

## Rate limiting en formulario

```typescript
import { useRateLimit } from '@/hooks/useRateLimit'

const { checkLimit, isBlocked } = useRateLimit({ maxAttempts: 5, windowMs: 60000 })

const onSubmit = () => {
  if (!checkLimit()) return // bloqueado
  // continuar
}
```

---

## Sanitización antes de guardar

```typescript
import { sanitizarTexto, sanitizarObjeto } from '@/lib/security'

// Un campo:
const nombreLimpio = sanitizarTexto(formData.nombre)

// Objeto completo:
const dataLimpia = sanitizarObjeto(formData)
```

---

## KPI Card (patrón visual)

```typescript
<Card className="bg-card border border-border">
  <CardContent className="p-4 sm:p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Label</p>
        <p className="text-2xl font-bold text-foreground">{valor}</p>
      </div>
      <Icon className="w-8 h-8 text-primary" aria-hidden="true" />
    </div>
  </CardContent>
</Card>
```

---

## Toast / notificación

```typescript
import { useToast } from '@/hooks/use-toast'
const { toast } = useToast()

toast({ title: 'Guardado', description: 'Cambios aplicados', variant: 'default' })
toast({ title: 'Error', description: mensaje, variant: 'destructive' })
```

---

## Constantes de estilo (de ui.ts)

```typescript
import { INPUT, LABEL, BTN_PRIMARY, BTN_SECONDARY, CARD } from '@/erp/ui'
// Usar en className para consistencia visual
```

---

## Supabase — operación CRUD

```typescript
import { supabase } from '@/lib/supabase'

// INSERT
const { error } = await supabase.from('erp_proyectos').insert({ ...data })

// UPDATE
const { error } = await supabase.from('erp_proyectos').update({ campo: valor }).eq('id', id)

// DELETE (soft — usar RPC)
const { error } = await supabase.rpc('eliminar_cliente_admin', { p_id: id })

// SELECT con RLS activo (automático por auth.uid())
const { data, error } = await supabase.from('erp_proyectos').select('*')
```
