# Guía Completa de Ant Design - CONSTRUSMART

## 📋 Índice
1. [Instalación y Configuración](#instalación-y-configuración)
2. [Componentes Base](#componentes-base)
3. [Componentes Avanzados](#componentes-avanzados)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Patrones y Mejores Prácticas](#patrones-y-mejores-prácticas)

---

## Instalación y Configuración

### ✅ Ya Incluido
```bash
# Ant Design está instalado en package.json
npm install
```

### Configuración del Tema
```typescript
// src/lib/antd-config.tsx
import { getAntdTheme, AntdProvider } from '@/lib/antd-config';

// En tu App.tsx
<AntdProvider mode="dark">
  {children}
</AntdProvider>
```

**Colores CONSTRUSMART:**
- 🟠 Primario: `#ff8c42` (Naranja)
- ✅ Success: `#52c41a` (Verde)
- ⚠️ Warning: `#faad14` (Amarillo)
- ❌ Error: `#f5222d` (Rojo)
- ℹ️ Info: `#1890ff` (Azul)

---

## Componentes Base

### 1. AntButton
Botón con soporte para tooltips y variantes.

```typescript
import { AntButton } from '@/components/antd';

// Usos
<AntButton type="primary">Guardar</AntButton>
<AntButton type="default">Cancelar</AntButton>
<AntButton type="dashed">Borrador</AntButton>
<AntButton danger>Eliminar</AntButton>
<AntButton tooltip="Información adicional">Info</AntButton>
<AntButton icon={<PlusOutlined />}>Agregar</AntButton>
```

**Props:**
- `type`: 'primary' | 'default' | 'dashed' | 'text' | 'link' | 'ghost'
- `size`: 'small' | 'middle' | 'large'
- `tooltip`: string
- `icon`: ReactNode
- `loading`: boolean
- `disabled`: boolean

---

### 2. AntForm
Formulario con validación Zod integrada.

```typescript
import { AntForm, AntInputField } from '@/components/antd';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

type FormData = z.infer<typeof schema>;

function MyForm() {
  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <AntForm<FormData>
      schema={schema}
      onSubmit={onSubmit}
      submitText="Enviar"
      onCancel={() => console.log('Cancelado')}
      cols={2}
    >
      {/* Children aquí */}
    </AntForm>
  );
}
```

**Props:**
- `schema`: ZodSchema
- `onSubmit`: (data) => void
- `initialValues`: object
- `layout`: 'vertical' | 'horizontal' | 'inline'
- `loading`: boolean
- `cols`: number (columnas del grid)

---

### 3. AntDataTable
Tabla avanzada con búsqueda y filtros.

```typescript
import { AntDataTable } from '@/components/antd';

const columns = [
  { title: 'Nombre', dataIndex: 'nombre', key: 'nombre' },
  { title: 'Email', dataIndex: 'email', key: 'email' },
];

<AntDataTable
  columns={columns}
  data={projects}
  title="Mis Proyectos"
  searchPlaceholder="Buscar..."
  pagination
  rowKey="id"
  onRefresh={() => fetchData()}
/>
```

**Props:**
- `columns`: ColumnType[]
- `data`: T[]
- `loading`: boolean
- `pagination`: boolean | PaginationConfig
- `searchPlaceholder`: string
- `filterOptions`: { label, value }[]
- `onFilter`: (value) => void
- `rowSelection`: RowSelection

---

### 4. AntModal
Modal con acciones.

```typescript
import { AntModal } from '@/components/antd';

<AntModal
  open={isOpen}
  title="Confirmar"
  onOk={handleSubmit}
  onCancel={handleCancel}
  okText="Aceptar"
  cancelText="Rechazar"
>
  <p>¿Deseas continuar?</p>
</AntModal>
```

---

### 5. AntCard
Tarjeta contenedora.

```typescript
import { AntCard } from '@/components/antd';

<AntCard
  title="Información"
  extra={<AntButton type="text">Editar</AntButton>}
>
  Contenido aquí
</AntCard>
```

---

## Componentes Avanzados

### 6. AntLayout
Layout completo con sider, header y content.

```typescript
import { AntLayout } from '@/components/antd';

<AntLayout
  logo={<strong>CONSTRUSMART</strong>}
  menuItems={[
    { key: 'dashboard', label: '📊 Dashboard' },
    { key: 'proyectos', label: '📁 Proyectos' },
  ]}
  onMenuClick={(key) => navigate(key)}
  header={<h2>Bienvenido</h2>}
  headerActions={<AntButton>Acciones</AntButton>}
  currentUser={{ name: 'Usuario', avatar: 'url' }}
  onLogout={logout}
  notifications={5}
  onNotifications={showNotifications}
>
  {/* Content */}
</AntLayout>
```

---

### 7. AntDrawer
Panel lateral para formularios.

```typescript
import { AntDrawer } from '@/components/antd';

<AntDrawer
  open={isOpen}
  title="Nuevo Proyecto"
  onClose={handleClose}
  onSubmit={handleSubmit}
  submitText="Crear"
  size="large" // 'small' | 'default' | 'large'
>
  {/* Contenido del drawer */}
</AntDrawer>
```

---

### 8. AntStats
Estadísticas y KPIs.

```typescript
import { AntStats, AntProgressStats } from '@/components/antd';

// Estadísticas simples
<AntStats
  stats={[
    {
      title: 'Proyectos',
      value: 15,
      prefix: '📊',
      trend: 'up',
      trendValue: '+3',
    },
  ]}
  columns={4}
/>

// Barras de progreso
<AntProgressStats
  items={[
    { title: 'Proyecto A', percent: 85, status: 'active', color: '#52c41a' },
  ]}
/>
```

---

### 9. AntAlert & Notificaciones

```typescript
import { AntAlert, messageManager, notificationManager } from '@/components/antd';

// Alert (en UI)
<AntAlert
  type="success"
  title="Guardado"
  description="Los cambios se guardaron correctamente"
  onClose={() => {}}
/>

// Message (temporal)
messageManager.success('Guardado exitosamente');
messageManager.error('Error al guardar');
messageManager.info('Información');
messageManager.warning('Advertencia');

// Notification (superior)
notificationManager.success({
  title: 'Éxito',
  description: 'Operación completada',
  duration: 4,
});
```

---

### 10. AntPopconfirm & AntDeleteButton

```typescript
import { AntPopconfirm, AntDeleteButton } from '@/components/antd';

// Popconfirm personalizado
<AntPopconfirm
  title="¿Eliminar?"
  description="Esta acción no se puede deshacer"
  onConfirm={handleDelete}
  danger
>
  <AntButton>Eliminar</AntButton>
</AntPopconfirm>

// Botón delete predefinido
<AntDeleteButton
  onConfirm={handleDelete}
  title="¿Estás seguro?"
  size="small"
/>
```

---

### 11. AntDatePicker & AntDateRange

```typescript
import { AntDatePicker, AntDateRange } from '@/components/antd';

// Date picker simple
<AntDatePicker
  label="Fecha"
  value={date}
  onChange={setDate}
  format="DD/MM/YYYY"
  error={error}
/>

// Rango de fechas
<AntDateRange
  label="Período"
  value={[startDate, endDate]}
  onChange={setDates}
  placeholder={['Desde', 'Hasta']}
/>
```

---

## Ejemplos de Uso

### Ejemplo 1: Formulario con Validación

```typescript
import { AntForm, AntInputField, AntSelectField } from '@/components/antd';
import { z } from 'zod';

const projectSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres'),
  cliente: z.string().min(1, 'Requerido'),
  presupuesto: z.coerce.number().positive(),
});

export function CreateProjectForm() {
  return (
    <AntForm
      schema={projectSchema}
      onSubmit={(data) => api.createProject(data)}
      submitText="Crear"
    >
      <AntInputField name="nombre" label="Nombre" placeholder="Ej: Casa" />
      <AntSelectField
        name="cliente"
        label="Cliente"
        options={[
          { label: 'Cliente A', value: 'a' },
        ]}
      />
      <AntInputField name="presupuesto" label="Presupuesto" type="number" />
    </AntForm>
  );
}
```

---

### Ejemplo 2: Dashboard con Stats y Tabla

```typescript
import { AntStats, AntDataTable, AntCard, AntLayout } from '@/components/antd';

export function DashboardView() {
  const stats = [
    { title: 'Proyectos', value: 12, trend: 'up', trendValue: '+2' },
    { title: 'Presupuesto', value: 'Q250K', trend: 'neutral' },
  ];

  const projects = [
    { id: 1, nombre: 'Proyecto A', estado: 'Activo' },
  ];

  const columns = [
    { title: 'Nombre', dataIndex: 'nombre' },
    { title: 'Estado', dataIndex: 'estado' },
  ];

  return (
    <AntLayout
      menuItems={menuItems}
      header={<h2>Dashboard</h2>}
    >
      <AntStats stats={stats} />
      <AntCard title="Proyectos">
        <AntDataTable
          columns={columns}
          data={projects}
          pagination
        />
      </AntCard>
    </AntLayout>
  );
}
```

---

### Ejemplo 3: Crud con Modal

```typescript
import { AntDataTable, AntModal, AntForm, AntButton } from '@/components/antd';

export function ProjectsCRUD() {
  const [projects, setProjects] = useState([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { title: 'Nombre', dataIndex: 'nombre' },
    {
      title: 'Acciones',
      render: (_, record) => (
        <Space>
          <AntButton type="primary" onClick={() => { setEditingId(record.id); setIsModalOpen(true); }}>
            Editar
          </AntButton>
          <AntDeleteButton onConfirm={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <>
      <AntDataTable columns={columns} data={projects} />
      <AntModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
      >
        <AntForm
          schema={projectSchema}
          onSubmit={(data) => { handleSave(data); setIsModalOpen(false); }}
        >
          {/* Form fields */}
        </AntForm>
      </AntModal>
    </>
  );
}
```

---

## Patrones y Mejores Prácticas

### ✅ HACER

```typescript
// 1. Usar AntForm con Zod para validación
<AntForm schema={schema} onSubmit={onSubmit}>
  {/* fields */}
</AntForm>

// 2. Usar messageManager para feedback
messageManager.success('Guardado');
notificationManager.info({ title: 'Info' });

// 3. Usar AntDeleteButton para confirmación
<AntDeleteButton onConfirm={handleDelete} />

// 4. Usar AntDataTable para listas
<AntDataTable columns={cols} data={data} pagination />

// 5. Usar AntLayout como contenedor principal
<AntLayout menuItems={menu}>
  {/* content */}
</AntLayout>
```

### ❌ NO HACER

```typescript
// ❌ No mezclar react-hook-form sin Zod
// ❌ No usar window.alert() en lugar de messageManager
// ❌ No crear tablas manuales, usar AntDataTable
// ❌ No usar estilos inline excesivamente
// ❌ No olvidar rowKey en AntDataTable
```

### Performance

```typescript
// ✅ Memoize componentes grandes
const ProjectList = React.memo(({ projects }) => (
  <AntDataTable columns={cols} data={projects} />
));

// ✅ Lazy load drawers
const [drawerOpen, setDrawerOpen] = useState(false);
{drawerOpen && <AntDrawer {...props} />}

// ✅ Usar pagination en tablas grandes
<AntDataTable pagination={{ pageSize: 50 }} />
```

### Accesibilidad

```typescript
// ✅ Usar labels en formularios
<AntForm><AntInputField label="Email" /></AntForm>

// ✅ Usar tooltips en botones de icono
<AntButton tooltip="Guardar" icon={<SaveOutlined />} />

// ✅ Usar textos descriptivos
<AntAlert type="error" description="Se requiere llenar todos los campos" />
```

---

## Archivos Incluidos

```
src/components/antd/
├── AntButton.tsx           → Botón
├── AntForm.tsx             → Formulario
├── AntTable.tsx            → Tabla simple
├── AntDataTable.tsx        → Tabla avanzada
├── AntModal.tsx            → Modal
├── AntCard.tsx             → Tarjeta
├── AntDrawer.tsx           → Panel lateral
├── AntLayout.tsx           → Layout completo
├── AntInputField.tsx       → Input
├── AntSelectField.tsx      → Select
├── AntDatePicker.tsx       → Date picker
├── AntStats.tsx            → Estadísticas
├── AntAlert.tsx            → Alertas
├── AntPopconfirm.tsx       → Confirmación
├── AntNotification.tsx     → Notificaciones
├── index.ts                → Exportaciones
└── AntDesignExample.tsx    → Ejemplos
```

---

## Próximos Pasos

1. ✅ Instalar dependencias: `npm install`
2. ✅ Importar componentes de `@/components/antd`
3. ✅ Usar ejemplos como referencia
4. ✅ Seguir patrones documentados

---

## Soporte

Para preguntas o issues:
1. Revisar AntDesignExample.tsx
2. Consultar documentación oficial: https://ant.design/components
3. Checar ejemplos en pantallas existentes

---

**Versión:** 1.0.0  
**Actualizado:** 2026-06-07  
**Licencia:** MIT
