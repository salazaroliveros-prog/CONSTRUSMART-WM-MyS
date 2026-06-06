# 🚀 Plan de Migración Ant Design — CONSTRUSMART ERP

**Objetivo:** Migrar gradualmente las 34 pantallas de shadcn/ui a componentes wrapper Ant Design sin afectar el deploy.

**Status:** ✅ Componentes wrapper creados | ⏳ Inicio de migración

---

## 📊 Fases de Implementación

### FASE 1: Validación (Hoy - 2h)
```
✅ Componentes wrapper creados:
  • AntForm (formularios + Zod)
  • AntTable (tablas + búsqueda)
  • AntButton (botones reutilizables)
  • AntModal (modales)
  • AntCard (tarjetas)
  • AntInputField (inputs con validación)
  • AntSelectField (selects con validación)
  • notificationManager (notificaciones)

✅ Configuración:
  • antd-config.tsx (tema CONSTRUSMART)
  • antd-global.css (estilos globales)
  • Tema naranja #ff8c42 + dark mode

⏳ Próximos pasos:
  1. Build sin errores
  2. Probar componentes individualmente
  3. Crear pantalla de ejemplo
```

### FASE 2: Pantallas de Alto Impacto (3-4 días)
Priorizar pantallas con más transacciones CRUD:

**Prioridad 1 (lunes):**
- [ ] CRM.tsx — Integración de AntTable + AntForm + notificaciones
- [ ] Bodega.tsx — AntTable para inventario + búsqueda

**Prioridad 2 (martes):**
- [ ] Administracion.tsx — AntForm para usuarios, roles
- [ ] LogisticaCompras.tsx — AntTable para órdenes

**Prioridad 3 (miércoles):**
- [ ] RRHH.tsx — AntTable para empleados
- [ ] Financiero.tsx — AntTable para movimientos

**Prioridad 4 (jueves):**
- [ ] Resto de pantallas (lazy migration)

### FASE 3: Optimización (1-2 h)
- [ ] Consolidar estilos
- [ ] Performance testing
- [ ] Accesibilidad (WCAG AA)
- [ ] Build final

---

## 🎯 Checklist por Pantalla

### CRM.tsx — Ejemplo de Migración Completa

```typescript
// ANTES (shadcn/ui)
import { Card, Button, Input } from "@/components/ui/*"
import { Table } from "@/components/ui/table"

// DESPUÉS (Ant Design)
import {
  AntCard,
  AntButton,
  AntTable,
  AntForm,
  AntInputField,
  notificationManager,
} from '@/components/antd';

// Cambios específicos:
// 1. Formularios: shadcn Form → AntForm + Zod ✓
// 2. Tablas: shadcn Table → AntTable (auto búsqueda/filtros) ✓
// 3. Botones: Button → AntButton (misma API) ✓
// 4. Modales: Dialog → AntModal ✓
// 5. Notificaciones: toast → notificationManager ✓
```

---

## 📋 Mapeo de Componentes

| shadcn/ui | Ant Design Wrapper | Cambios Necesarios |
|-----------|-------------------|-------------------|
| Button | AntButton | Misma API, más tooltips |
| Card | AntCard | Añade hoverable y loading |
| Dialog | AntModal | Añade loading y confirmación |
| Form | AntForm | + Zod + react-hook-form |
| Input | AntInputField | + Validación automática |
| Select | AntSelectField | + Validación automática |
| Table | AntTable | + Búsqueda, filtros, paginación |
| Alert | Tag/Alert (antd) | Reutilizar directo |
| Tabs | Tabs (antd) | Reutilizar directo |
| Dropdown | Dropdown (antd) | Reutilizar directo |
| Toast | notificationManager | Reemplazar completamente |

---

## 🔧 Pasos de Migración por Pantalla

### Template para migrar CRM.tsx

1. **Importar nuevos componentes:**
```typescript
import {
  AntForm,
  AntTable,
  AntButton,
  AntModal,
  AntCard,
  AntInputField,
  AntSelectField,
  notificationManager,
  Space,
  Tag,
} from '@/components/antd';
import { z } from 'zod';
```

2. **Crear schemas Zod para cada form:**
```typescript
const schemaProspecto = z.object({
  nombre: z.string().min(1, 'Requerido'),
  empresa: z.string().min(1, 'Requerido'),
  email: z.string().email('Email inválido'),
  estado: z.enum(['nuevo', 'contactado', 'calificado', 'ganado', 'perdido']),
});
```

3. **Migrar tablas:**
```typescript
const columns = [
  { key: 'nombre', title: 'Prospecto', dataIndex: 'nombre' },
  { key: 'empresa', title: 'Empresa', dataIndex: 'empresa' },
  {
    key: 'estado',
    title: 'Estado',
    dataIndex: 'estado',
    render: (estado) => {
      const colorMap = {
        nuevo: 'blue',
        contactado: 'cyan',
        calificado: 'green',
        ganado: 'success',
        perdido: 'error',
      };
      return <Tag color={colorMap[estado]}>{estado}</Tag>;
    },
  },
];

const actions = [
  {
    key: 'edit',
    label: 'Editar',
    icon: <EditOutlined />,
    onClick: (record) => handleEdit(record),
  },
  {
    key: 'delete',
    label: 'Eliminar',
    icon: <DeleteOutlined />,
    danger: true,
    confirm: '¿Estás seguro?',
    onClick: (record) => handleDelete(record.id),
  },
];

<AntTable
  columns={columns}
  data={prospectos}
  actions={actions}
  searchableFields={['nombre', 'empresa', 'email']}
  pageSize={20}
/>
```

4. **Migrar formularios:**
```typescript
const handleAddProspecto = async (data) => {
  try {
    const { addProspecto } = useErp();
    addProspecto(data);
    notificationManager.success({ title: 'Prospecto creado' });
    setModalVisible(false);
  } catch (error) {
    notificationManager.error({
      title: 'Error',
      description: error.message,
    });
  }
};

<AntModal
  title="Crear Prospecto"
  open={modalVisible}
  loading={loading}
  onCancel={() => setModalVisible(false)}
>
  <AntForm
    schema={schemaProspecto}
    onSubmit={handleAddProspecto}
    cols={2}
  >
    <AntInputField
      name="nombre"
      label="Nombre"
      placeholder="Ej: Juan Pérez"
      required
    />
    <AntInputField
      name="empresa"
      label="Empresa"
      placeholder="Ej: Constructora ABC"
      required
    />
    <AntInputField
      name="email"
      label="Email"
      type="email"
      placeholder="juan@empresa.com"
      required
      col={{ xs: 24, sm: 24 }}
    />
    <AntSelectField
      name="estado"
      label="Estado"
      required
      options={[
        { label: 'Nuevo', value: 'nuevo' },
        { label: 'Contactado', value: 'contactado' },
        { label: 'Calificado', value: 'calificado' },
        { label: 'Ganado', value: 'ganado' },
        { label: 'Perdido', value: 'perdido' },
      ]}
      col={{ xs: 24, sm: 24 }}
    />
  </AntForm>
</AntModal>
```

5. **Migrar notificaciones:**
```typescript
// ANTES
toast({ title: 'Guardado', description: 'Cambios aplicados' })

// DESPUÉS
notificationManager.success({
  title: 'Guardado',
  description: 'Cambios aplicados',
});

notificationManager.error({
  title: 'Error',
  description: 'No se pudo guardar',
});
```

---

## ✅ Testing Checklist

Por cada pantalla migrada:

- [ ] Formularios validan correctamente (Zod)
- [ ] Tabla muestra datos sin errores
- [ ] Búsqueda funciona en campos correctos
- [ ] Botones de acción funcionan (edit, delete)
- [ ] Modales se abren/cierran
- [ ] Notificaciones aparecen correctamente
- [ ] Build sin warnings
- [ ] Tests pasan (si existen)
- [ ] Responsivo en móvil
- [ ] Dark mode funciona

---

## 📈 Impacto Esperado

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|---------|
| Código repetido | Alto | Bajo | -60% |
| Consistencia visual | Media | Alta | +40% |
| Tiempo desarrollo | 4h por pantalla | 1.5h | -62% |
| Bugs UI | Medio | Bajo | -50% |
| Mantenibilidad | Media | Alta | +70% |

---

## 🚀 Próximos Pasos

### HOY (Inmediato)
1. [ ] Verificar build `npm run build`
2. [ ] Probar componentes en un storybook
3. [ ] Crear pantalla de ejemplo (CRM mini)

### ESTA SEMANA
1. [ ] Migrar CRM.tsx completamente
2. [ ] Migrar Bodega.tsx
3. [ ] Validar que no hay regresiones

### PRÓXIMA SEMANA
1. [ ] Migrar resto de pantallas
2. [ ] Testing completo
3. [ ] Deploy a staging

### POST-DEPLOY
1. [ ] Feedback de usuarios
2. [ ] Ajustes de UX
3. [ ] Performance optimization

---

## 📞 Soporte

Si encuentras problemas:

1. Revisar `GUIA_COMPONENTES_ANT_DESIGN.md`
2. Verificar console por errores TypeScript
3. Confirmar que `AntdProvider` está en App.tsx
4. Revisar que schema Zod está correcto

---

*Plan creado: 2026-06-07*
*Status: ✅ Componentes listos para usar*
