# Diseño de UI: Pantalla de Log de Errores

> ✅ **ESTADO: COMPLETADO (SESIÓN-13/14 — 2026-06-26)** — Pantalla implementada en `src/erp/screens/ErrorLog.tsx` con todos los features descritos. 18 tests unitarios pasando.

## Visión General

Nueva pantalla `ErrorLog` para visualizar y gestionar errores centralizados en la tabla `erp_error_log`. Esta pantalla permitirá a administradores del sistema monitorear, investigar y resolver errores de la aplicación de manera eficiente.

## Especificaciones Técnicas

### Ruta y Archivo
- **Archivo**: `src/erp/screens/ErrorLog.tsx`
- **Vista**: `error-log` (añadir a type `View` en `store.tsx`)
- **Sidebar**: Añadir entrada en `Sidebar.tsx` con icono de alerta

### Permisos y RBAC
- **Rol requerido**: `Administrador` únicamente
- **Icono**: `AlertOutlined` de Ant Design
- **Badge**: Mostrar contador de errores no resueltos

## Layout de la Pantalla

### Estructura Principal
```
┌─────────────────────────────────────────────────────────────┐
│  Log de Errores                                    [Filtros] │
├─────────────────────────────────────────────────────────────┤
│  KPI Cards (4)                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Total    │ │ Abiertos │ │ Resueltos│ │ Críticos │       │
│  │ 1,234    │ │ 56       │ │ 1,178    │ │ 12       │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────┤
│  Filtros Avanzados                                           │
│  [Búsqueda] [Tipo] [Severidad] [Estado] [Fecha Range]       │
├─────────────────────────────────────────────────────────────┤
│  Tabla de Errores (con paginación)                          │
│  ┌─────┬─────────┬──────────┬──────────┬─────────┬──────┐ │
│  │ Sel │ ID      │ Tipo     │ Severidad│ Estado  │ Acción│ │
│  ├─────┼─────────┼──────────┼──────────┼─────────┼──────┤ │
│  │ □   │ ERR-001 │ database │ error    │ abierto  │ [Ver] │ │
│  │ □   │ ERR-002 │ api      │ warning  │ abierto  │ [Ver] │ │
│  │ □   │ ERR-003 │ ui       │ info     │ resuelto │ [Ver] │ │
│  └─────┴─────────┴──────────┴──────────┴─────────┴──────┘ │
│                                    [Página 1 de 12]         │
├─────────────────────────────────────────────────────────────┤
│  Bulk Actions: [Resolver] [Eliminar] [Exportar]            │
└─────────────────────────────────────────────────────────────┘
```

## Componentes Detallados

### 1. Header
```typescript
<div className="flex justify-between items-center mb-6">
  <h1 className="text-2xl font-bold">Log de Errores</h1>
  <Button 
    type="primary" 
    icon={<FilterOutlined />}
    onClick={() => setShowFilters(!showFilters)}
  >
    Filtros
  </Button>
</div>
```

### 2. KPI Cards
```typescript
const kpiCards = [
  { 
    label: 'Total Errores', 
    value: totalErrors, 
    color: 'blue',
    icon: <DatabaseOutlined />
  },
  { 
    label: 'Abiertos', 
    value: openErrors, 
    color: 'orange',
    icon: <ExclamationCircleOutlined />
  },
  { 
    label: 'Resueltos', 
    value: resolvedErrors, 
    color: 'green',
    icon: <CheckCircleOutlined />
  },
  { 
    label: 'Críticos', 
    value: criticalErrors, 
    color: 'red',
    icon: <WarningOutlined />
  },
];
```

### 3. Filtros Avanzados
```typescript
<Row gutter={16}>
  <Col span={6}>
    <Input
      placeholder="Buscar por mensaje o ID"
      prefix={<SearchOutlined />}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </Col>
  <Col span={4}>
    <Select
      placeholder="Tipo"
      value={filterType}
      onChange={setFilterType}
      allowClear
    >
      <Option value="database">Database</Option>
      <Option value="api">API</Option>
      <Option value="ui">UI</Option>
      <Option value="auth">Auth</Option>
      <Option value="sync">Sync</Option>
    </Select>
  </Col>
  <Col span={4}>
    <Select
      placeholder="Severidad"
      value={filterSeverity}
      onChange={setFilterSeverity}
      allowClear
    >
      <Option value="error">Error</Option>
      <Option value="warning">Warning</Option>
      <Option value="info">Info</Option>
    </Select>
  </Col>
  <Col span={4}>
    <Select
      placeholder="Estado"
      value={filterStatus}
      onChange={setFilterStatus}
      allowClear
    >
      <Option value="open">Abierto</Option>
      <Option value="resolved">Resuelto</Option>
    </Select>
  </Col>
  <Col span={6}>
    <RangePicker
      placeholder={['Desde', 'Hasta']}
      value={dateRange}
      onChange={setDateRange}
    />
  </Col>
</Row>
```

### 4. Tabla de Errores
```typescript
<Table
  rowSelection={rowSelection}
  columns={[
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <code className="text-xs">{id.slice(0, 8)}</code>,
      sorter: true,
    },
    {
      title: 'Tipo',
      dataIndex: 'error_type',
      key: 'error_type',
      render: (type) => (
        <Tag color={getTypeColor(type)}>{type}</Tag>
      ),
      filters: [
        { text: 'Database', value: 'database' },
        { text: 'API', value: 'api' },
        { text: 'UI', value: 'ui' },
      ],
    },
    {
      title: 'Severidad',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => (
        <Tag color={getSeverityColor(severity)}>{severity}</Tag>
      ),
      filters: [
        { text: 'Error', value: 'error' },
        { text: 'Warning', value: 'warning' },
        { text: 'Info', value: 'info' },
      ],
    },
    {
      title: 'Estado',
      dataIndex: 'resolved',
      key: 'resolved',
      render: (resolved) => (
        <Badge 
          status={resolved ? 'success' : 'error'} 
          text={resolved ? 'Resuelto' : 'Abierto'} 
        />
      ),
      filters: [
        { text: 'Abierto', value: false },
        { text: 'Resuelto', value: true },
      ],
    },
    {
      title: 'Mensaje',
      dataIndex: 'error_message',
      key: 'error_message',
      ellipsis: true,
      render: (msg) => (
        <Tooltip title={msg}>
          <span>{msg}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Componente',
      dataIndex: 'component',
      key: 'component',
      render: (component) => (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
          {component}
        </code>
      ),
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => formatDate(date),
      sorter: true,
      defaultSortOrder: 'descend',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => showDetailModal(record)}
          >
            Ver
          </Button>
          {!record.resolved && (
            <Button 
              type="link" 
              size="small" 
              icon={<CheckOutlined />}
              onClick={() => resolveError(record.id)}
            >
              Resolver
            </Button>
          )}
        </Space>
      ),
    },
  ]}
  dataSource={filteredErrors}
  pagination={{
    current: currentPage,
    pageSize: 20,
    total: filteredErrors.length,
    showSizeChanger: true,
    showTotal: (total) => `Total ${total} errores`,
  }}
  loading={loading}
/>
```

### 5. Modal de Detalle de Error
```typescript
<Modal
  title={`Detalle de Error: ${selectedError?.id?.slice(0, 8)}`}
  open={detailModalVisible}
  onCancel={() => setDetailModalVisible(false)}
  footer={[
    <Button key="close" onClick={() => setDetailModalVisible(false)}>
      Cerrar
    </Button>,
    !selectedError?.resolved && (
      <Button 
        key="resolve" 
        type="primary" 
        icon={<CheckOutlined />}
        onClick={() => resolveError(selectedError.id)}
      >
        Marcar como Resuelto
      </Button>
    ),
  ]}
  width={800}
>
  <Descriptions bordered column={2}>
    <Descriptions.Item label="ID" span={2}>
      <code>{selectedError?.id}</code>
    </Descriptions.Item>
    <Descriptions.Item label="Tipo">
      <Tag color={getTypeColor(selectedError?.error_type)}>
        {selectedError?.error_type}
      </Tag>
    </Descriptions.Item>
    <Descriptions.Item label="Severidad">
      <Tag color={getSeverityColor(selectedError?.severity)}>
        {selectedError?.severity}
      </Tag>
    </Descriptions.Item>
    <Descriptions.Item label="Estado">
      <Badge 
        status={selectedError?.resolved ? 'success' : 'error'} 
        text={selectedError?.resolved ? 'Resuelto' : 'Abierto'} 
      />
    </Descriptions.Item>
    <Descriptions.Item label="Fecha">
      {formatDate(selectedError?.created_at)}
    </Descriptions.Item>
    <Descriptions.Item label="Componente" span={2}>
      <code>{selectedError?.component}</code>
    </Descriptions.Item>
    <Descriptions.Item label="Función" span={2}>
      <code>{selectedError?.function_name}</code>
    </Descriptions.Item>
    <Descriptions.Item label="Mensaje de Error" span={2}>
      <Alert 
        message={selectedError?.error_message} 
        type="error" 
        showIcon 
      />
    </Descriptions.Item>
    <Descriptions.Item label="Stack Trace" span={2}>
      <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-64">
        {selectedError?.stack_trace}
      </pre>
    </Descriptions.Item>
    {selectedError?.additional_context && (
      <Descriptions.Item label="Contexto Adicional" span={2}>
        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-32">
          {JSON.stringify(selectedError.additional_context, null, 2)}
        </pre>
      </Descriptions.Item>
    )}
    {selectedError?.resolved && (
      <>
        <Descriptions.Item label="Resuelto Por">
          {selectedError.resolved_by}
        </Descriptions.Item>
        <Descriptions.Item label="Fecha de Resolución">
          {formatDate(selectedError.resolved_at)}
        </Descriptions.Item>
        <Descriptions.Item label="Notas de Resolución" span={2}>
          {selectedError.resolution_notes}
        </Descriptions.Item>
      </>
    )}
  </Descriptions>
</Modal>
```

### 6. Bulk Actions
```typescript
<Space className="mt-4">
  <Button
    icon={<CheckOutlined />}
    disabled={selectedRowKeys.length === 0}
    onClick={() => resolveBulkErrors(selectedRowKeys)}
  >
    Resolver Seleccionados ({selectedRowKeys.length})
  </Button>
  <Button
    icon={<DeleteOutlined />}
    danger
    disabled={selectedRowKeys.length === 0}
    onClick={() => deleteBulkErrors(selectedRowKeys)}
  >
    Eliminar Seleccionados ({selectedRowKeys.length})
  </Button>
  <Button
    icon={<DownloadOutlined />}
    onClick={() => exportErrors(filteredErrors)}
  >
    Exportar CSV
  </Button>
  <Button
    icon={<ClearOutlined />}
    onClick={() => cleanupOldErrors()}
  >
    Limpiar Errores Antiguos (> 30 días)
  </Button>
</Space>
```

## Funciones Auxiliares

### Type de TypeScript
```typescript
interface ErrorLogEntry {
  id: string;
  error_type: string;
  error_message: string;
  severity: 'error' | 'warning' | 'info';
  component?: string;
  function_name?: string;
  stack_trace?: string;
  additional_context?: Record<string, any>;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  created_by?: string;
}
```

### Helper Functions
```typescript
function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    database: 'red',
    api: 'orange',
    ui: 'blue',
    auth: 'purple',
    sync: 'cyan',
  };
  return colors[type] || 'default';
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    error: 'red',
    warning: 'orange',
    info: 'blue',
  };
  return colors[severity] || 'default';
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

## Integración con Supabase

### Schema Zod
```typescript
// src/erp/store/schemas/errorLog.ts
import { z } from 'zod';

export const errorLogSchema = z.object({
  id: z.string(),
  errorType: z.string(),
  errorMessage: z.string(),
  severity: z.enum(['error', 'warning', 'info']),
  component: z.string().optional(),
  functionName: z.string().optional(),
  stackTrace: z.string().optional(),
  additionalContext: z.record(z.any()).optional(),
  resolved: z.boolean().default(false),
  resolvedBy: z.string().nullable().optional(),
  resolvedAt: z.string().nullable().optional(),
  resolutionNotes: z.string().nullable().optional(),
  createdAt: z.string(),
  createdBy: z.string().nullable().optional(),
});

export type ErrorLogEntry = z.infer<typeof errorLogSchema>;
```

### Store Actions
```typescript
// src/erp/zustandStore.ts - Añadir a ErpActions
setErrorLogs: (v: ErrorLogEntry[] | ((prev: ErrorLogEntry[]) => ErrorLogEntry[])) => void;
resolveError: (id: string, notes?: string) => void;
deleteError: (id: string) => void;
cleanupOldErrors: (daysOld?: number) => void;

// Implementación
setErrorLogs: (v) => set(typeof v === 'function' ? { errorLogs: v(get().errorLogs) } : { errorLogs: v }),

resolveError: (id, notes) => {
  get().setErrorLogs(prev => prev.map(e => 
    e.id === id 
      ? { 
          ...e, 
          resolved: true, 
          resolvedAt: new Date().toISOString(),
          resolvedBy: get().user?.nombre || 'system',
          resolutionNotes: notes 
        } 
      : e
  ));
  get().enqueueMutation('resolveError', { id, notes });
},

deleteError: (id) => {
  get().setErrorLogs(prev => prev.filter(e => e.id !== id));
  get().enqueueMutation('deleteError', { id });
},

cleanupOldErrors: (daysOld = 30) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  
  const toDelete = get().errorLogs
    .filter(e => new Date(e.createdAt) < cutoff && e.resolved)
    .map(e => e.id);
  
  if (toDelete.length > 0) {
    get().setErrorLogs(prev => prev.filter(e => !toDelete.includes(e.id)));
    get().enqueueMutation('cleanupOldErrors', { ids: toDelete });
  }
},
```

### Supabase RPC Calls
```typescript
// Llamar a log_error desde error-logger.ts
export async function logErrorToDatabase(error: Error, context: ErrorContext) {
  if (!supabase) return;
  
  const { data, error: rpcError } = await supabase.rpc('log_error', {
    p_error_type: context.error_type || 'unknown',
    p_error_message: error.message,
    p_severity: context.severity || 'error',
    p_component: context.component,
    p_function_name: context.function_name,
    p_stack_trace: error.stack,
    p_additional_context: context.additional_context,
  });
  
  if (rpcError) {
    console.error('[ErrorLogger] Failed to log to database:', rpcError);
  }
  
  return data;
}

// Llamar a resolve_error
export async function resolveErrorInDatabase(id: string, notes?: string) {
  if (!supabase) return;
  
  const { error } = await supabase.rpc('resolve_error', {
    p_error_id: id,
    p_resolution_notes: notes,
  });
  
  if (error) {
    console.error('[ErrorLogger] Failed to resolve error:', error);
    throw error;
  }
}

// Llamar a cleanup_old_error_logs
export async function cleanupOldErrorsInDatabase(daysOld = 30) {
  if (!supabase) return;
  
  const { error } = await supabase.rpc('cleanup_old_error_logs', {
    p_days_old: daysOld,
  });
  
  if (error) {
    console.error('[ErrorLogger] Failed to cleanup errors:', error);
    throw error;
  }
}
```

## Accesibilidad

### ARIA Labels
```typescript
<Button
  aria-label="Ver detalles del error"
  icon={<EyeOutlined />}
  onClick={() => showDetailModal(record)}
>
  Ver
</Button>

<Button
  aria-label="Marcar error como resuelto"
  icon={<CheckOutlined />}
  onClick={() => resolveError(record.id)}
>
  Resolver
</Button>
```

### Keyboard Navigation
- Tab order: Filtros → Tabla → Modal → Acciones
- Enter/Space para activar botones
- Escape para cerrar modal
- Ctrl/Cmd + F para foco en búsqueda

### Contrast Ratios
- Texto: 4.5:1 (WCAG AA)
- Interactive elements: 3:1 (WCAG AA)
- Tags: Colores con suficiente contraste en modo claro y oscuro

## Responsive Design

### Mobile (< 768px)
- KPI cards: 2x2 grid
- Filtros: Collapse por defecto, expandible
- Tabla: Card view en lugar de tabla
- Paginación: Simplificada

### Tablet (768px - 1024px)
- KPI cards: 4x1 grid
- Filtros: 2 filas
- Tabla: Con scroll horizontal
- Modal: Full width

### Desktop (> 1024px)
- Layout completo como se describe arriba

## Testing

### Unit Tests
```typescript
describe('ErrorLog Screen', () => {
  it('should render KPI cards with correct counts', () => {
    // Test
  });
  
  it('should filter errors by type', () => {
    // Test
  });
  
  it('should resolve error and update store', () => {
    // Test
  });
  
  it('should cleanup old errors', () => {
    // Test
  });
});
```

### E2E Tests
- Navegar a pantalla de error log
- Aplicar filtros
- Ver detalle de error
- Resolver error
- Limpiar errores antiguos
- Exportar a CSV

## Performance Considerations

### Pagination
- Cargar 20 registros por página
- Lazy loading para detalles
- Virtual scroll si > 1000 registros

### Caching
- Cache de errores por 5 minutos
- Invalidar cache en nueva mutación
- Revalidar en foco de ventana

### Optimizations
- Debounce en búsqueda (300ms)
- Memo de filtros aplicados
- Lazy loading de stack traces
