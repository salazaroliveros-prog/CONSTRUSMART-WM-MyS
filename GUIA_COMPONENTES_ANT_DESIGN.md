# 📚 Guía de Componentes Ant Design — CONSTRUSMART ERP

> Componentes wrapper reutilizables para formularios, tablas, botones, modales y notificaciones.

---

## 🚀 Quick Start

### Importar componentes
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
} from '@/components/antd';
```

---

## 📋 Componentes

### 1. **AntForm** — Formularios con Zod + react-hook-form

```typescript
import { AntForm, AntInputField, AntSelectField } from '@/components/antd';
import { z } from 'zod';

// 1. Definir schema Zod
const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  email: z.string().email('Email inválido'),
  rol: z.string().min(1, 'Selecciona un rol'),
});

// 2. En el componente
export default function CrearUsuario() {
  const onSubmit = (data) => {
    console.log('Formulario válido:', data);
    // Guardar en BD
  };

  return (
    <AntForm
      schema={schema}
      onSubmit={onSubmit}
      submitText="Crear usuario"
      onCancel={() => navigate(-1)}
      cols={2}
    >
      <AntInputField
        name="nombre"
        label="Nombre"
        placeholder="Ej: Juan Pérez"
        required
      />
      <AntInputField
        name="email"
        label="Email"
        type="email"
        placeholder="usuario@example.com"
        required
      />
      <AntSelectField
        name="rol"
        label="Rol"
        required
        options={[
          { label: 'Administrador', value: 'admin' },
          { label: 'Gerente', value: 'gerente' },
          { label: 'Residente', value: 'residente' },
        ]}
      />
    </AntForm>
  );
}
```

**Props:**
- `schema: ZodSchema` — Schema de validación
- `onSubmit: SubmitHandler` — Función al enviar (datos ya validados)
- `initialValues?: DefaultValues` — Valores iniciales
- `layout?: 'vertical' | 'horizontal' | 'inline'` — Disposición (default: vertical)
- `loading?: boolean` — Mostrar spinner
- `submitText?: string` — Texto botón enviar
- `onCancel?: () => void` — Botón cancelar
- `cols?: number` — Columnas del grid (default: 1)

---

### 2. **AntTable** — Tablas con búsqueda y filtros

```typescript
import { AntTable } from '@/components/antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

export default function ListaProyectos() {
  const [proyectos] = useState([
    { id: 1, nombre: 'Casa Moderna', cliente: 'Sr. López', estado: 'activo' },
    { id: 2, nombre: 'Edificio A', cliente: 'Empresa XYZ', estado: 'pausado' },
  ]);

  return (
    <AntTable
      columns={[
        { key: 'nombre', title: 'Proyecto', dataIndex: 'nombre' },
        { key: 'cliente', title: 'Cliente', dataIndex: 'cliente' },
        {
          key: 'estado',
          title: 'Estado',
          dataIndex: 'estado',
          render: (estado) => (
            <Tag color={estado === 'activo' ? 'green' : 'orange'}>
              {estado}
            </Tag>
          ),
          filterOptions: [
            { label: 'Activo', value: 'activo' },
            { label: 'Pausado', value: 'pausado' },
          ],
        },
      ]}
      data={proyectos}
      searchableFields={['nombre', 'cliente']}
      actions={[
        {
          key: 'edit',
          label: 'Editar',
          icon: <EditOutlined />,
          onClick: (record) => navigate(`/proyectos/${record.id}/editar`),
        },
        {
          key: 'delete',
          label: 'Eliminar',
          icon: <DeleteOutlined />,
          danger: true,
          confirm: '¿Estás seguro?',
          onClick: (record) => handleDelete(record.id),
        },
      ]}
      pageSize={10}
      rowKey="id"
    />
  );
}
```

**Props:**
- `columns: AntTableColumn[]` — Definición de columnas
- `data: T[]` — Datos a mostrar
- `actions?: AntTableAction[]` — Acciones por fila (editar, eliminar)
- `searchableFields?: string[]` — Campos para búsqueda
- `pagination?: boolean` — Mostrar paginación (default: true)
- `pageSize?: number` — Registros por página (default: 10)
- `loading?: boolean` — Mostrar spinner

---

### 3. **AntButton** — Botones reutilizables

```typescript
import { AntButton } from '@/components/antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

// Botón primario
<AntButton type="primary" icon={<PlusOutlined />}>
  Crear Proyecto
</AntButton>

// Botón con tooltip
<AntButton
  type="default"
  tooltip="Eliminar este registro"
  icon={<DeleteOutlined />}
  danger
/>

// Botón ghost (transparente)
<AntButton type="ghost">Cancelar</AntButton>

// Botón en loading
<AntButton type="primary" loading={isLoading}>
  Guardando...
</AntButton>
```

**Props:**
- `type?: 'primary' | 'default' | 'dashed' | 'text' | 'link' | 'ghost'`
- `size?: 'small' | 'middle' | 'large'`
- `tooltip?: string` — Muestra tooltip al pasar mouse
- `loading?: boolean` — Mostrar spinner
- `danger?: boolean` — Estilo peligroso (rojo)
- `icon?: ReactNode` — Icono a la izquierda

---

### 4. **AntModal** — Modales reutilizables

```typescript
import { AntModal, AntButton } from '@/components/antd';
import { useState } from 'react';

export default function ConfirmarAccion() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await api.delete(`/proyectos/${id}`);
      notificationManager.success({ title: 'Eliminado correctamente' });
      setVisible(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AntButton onClick={() => setVisible(true)}>Eliminar</AntButton>

      <AntModal
        title="Confirmar eliminación"
        open={visible}
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={() => setVisible(false)}
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger
      >
        <p>¿Estás seguro de que deseas eliminar este proyecto?</p>
        <p style={{ color: '#f5222d' }}>Esta acción no se puede deshacer.</p>
      </AntModal>
    </>
  );
}
```

**Props:**
- `title: string` — Título del modal
- `open?: boolean` — Controlar visibilidad (desde padre)
- `loading?: boolean` — Mostrar spinner
- `onConfirm?: () => void | Promise<void>` — Al hacer click en Aceptar
- `onCancel?: () => void` — Al cancelar
- `confirmText?: string` — Texto botón confirmar
- `danger?: boolean` — Botón rojo (para acciones destructivas)
- `width?: number | string` — Ancho (default: 500px)

---

### 5. **AntCard** — Tarjetas reutilizables

```typescript
import { AntCard } from '@/components/antd';

export default function ResumenProyecto() {
  return (
    <AntCard
      title="Resumen del Proyecto"
      extra={<AntButton type="link">Ver más</AntButton>}
      hoverable
    >
      <div>
        <p><strong>Cliente:</strong> Sr. López</p>
        <p><strong>Presupuesto:</strong> Q100,000.00</p>
        <p><strong>Avance:</strong> 65%</p>
      </div>
    </AntCard>
  );
}
```

**Props:**
- `title?: string | ReactNode` — Título
- `extra?: ReactNode` — Contenido arriba a la derecha
- `loading?: boolean` — Mostrar skeleton
- `hoverable?: boolean` — Efecto hover (default: true)
- `bodyStyle?: CSSProperties` — Estilos adicionales del body

---

### 6. **AntInputField** — Input con validación

```typescript
import { AntForm, AntInputField } from '@/components/antd';

<AntForm schema={schema} onSubmit={onSubmit}>
  <AntInputField
    name="email"
    label="Correo electrónico"
    type="email"
    placeholder="usuario@example.com"
    required
    tooltip="Se usará para notificaciones"
  />

  <AntInputField
    name="telefono"
    label="Teléfono"
    placeholder="+502 xxxx xxxx"
    helperText="Incluir código de país"
  />
</AntForm>
```

**Props:**
- `name: string` — Nombre del campo (en formulario)
- `label?: string` — Etiqueta
- `required?: boolean` — Marcar como requerido
- `type?: string` — Tipo de input (text, email, number, password)
- `placeholder?: string` — Texto placeholder
- `tooltip?: string` — Tooltip de ayuda
- `helperText?: string` — Texto de ayuda debajo

---

### 7. **AntSelectField** — Select con validación

```typescript
import { AntForm, AntSelectField } from '@/components/antd';

<AntForm schema={schema} onSubmit={onSubmit}>
  <AntSelectField
    name="proyecto"
    label="Proyecto"
    required
    options={proyectos.map(p => ({ label: p.nombre, value: p.id }))}
    placeholder="Selecciona un proyecto"
  />

  <AntSelectField
    name="prioridad"
    label="Prioridad"
    options={[
      { label: 'Alta', value: 'high' },
      { label: 'Media', value: 'medium' },
      { label: 'Baja', value: 'low' },
    ]}
    mode="multiple"
  />
</AntForm>
```

**Props:**
- `name: string` — Nombre del campo
- `label?: string` — Etiqueta
- `required?: boolean` — Requerido
- `options: Array<{ label, value }>` — Opciones
- `placeholder?: string` — Placeholder
- `mode?: 'multiple' | 'tags'` — Selección múltiple

---

### 8. **notificationManager** — Notificaciones

```typescript
import { notificationManager } from '@/components/antd';

// Éxito
notificationManager.success({
  title: 'Proyecto creado',
  description: 'El proyecto se ha creado exitosamente',
  duration: 3,
});

// Error
notificationManager.error({
  title: 'Error al guardar',
  description: 'Ocurrió un error al guardar los cambios',
});

// Advertencia
notificationManager.warning({
  title: 'Alerta',
  description: 'Por favor verifica los datos antes de continuar',
});

// Información
notificationManager.info({
  title: 'Información',
  description: 'El sistema se actualizará en 2 minutos',
});

// Loading (sin duración)
const hideLoading = notificationManager.loading({
  title: 'Procesando...',
  description: 'Por favor espera',
});
// Luego cerrar manualmente con: hideLoading()
```

**Config:**
- `title: string` — Título
- `description?: string` — Descripción
- `duration?: number` — Segundos antes de cerrar (default: 4.5, loading: 0)
- `top?: number` — Distancia desde arriba en px (default: 24)

---

## 🎨 Ejemplo Completo

```typescript
import { AntForm, AntTable, AntButton, AntModal, AntInputField, notificationManager } from '@/components/antd';
import { useState } from 'react';
import { z } from 'zod';

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  email: z.string().email('Email inválido'),
});

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Guardar en BD
      const newUser = { id: Date.now(), ...data };
      setUsuarios([...usuarios, newUser]);
      notificationManager.success({ title: 'Usuario creado' });
      setModalVisible(false);
    } catch (error) {
      notificationManager.error({ title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <AntButton type="primary" onClick={() => setModalVisible(true)}>
        Crear Usuario
      </AntButton>

      <AntTable
        columns={[
          { key: 'nombre', title: 'Nombre', dataIndex: 'nombre' },
          { key: 'email', title: 'Email', dataIndex: 'email' },
        ]}
        data={usuarios}
        searchableFields={['nombre', 'email']}
      />

      <AntModal
        title="Crear Usuario"
        open={modalVisible}
        loading={loading}
        onConfirm={() => {}}
        onCancel={() => setModalVisible(false)}
      >
        <AntForm schema={schema} onSubmit={onSubmit}>
          <AntInputField name="nombre" label="Nombre" required />
          <AntInputField name="email" label="Email" type="email" required />
        </AntForm>
      </AntModal>
    </div>
  );
}
```

---

## 📝 Notas

1. **Siempre usar FormProvider en AntForm** para que AntInputField y AntSelectField funcionen
2. **Los errores Zod aparecen automáticamente** en rojo bajo los campos
3. **AntTable filtra localmente** — para grandes datasets usar paginación en servidor
4. **notificationManager es singleton** — puedes usarlo desde cualquier parte de la app

---

*Última actualización: 2026-06-07*
