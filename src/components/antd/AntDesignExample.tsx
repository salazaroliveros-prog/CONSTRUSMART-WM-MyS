import React, { useState } from 'react';
import {
  AntButton,
  AntForm,
  AntDataTable,
  AntLayout,
  AntStats,
  AntProgressStats,
  AntAlert,
  AntDrawer,
  AntModal,
  AntCard,
  AntDatePicker,
  AntDateRange,
  AntDeleteButton,
  messageManager,
  notificationManager,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from './index';
import { z } from 'zod';
import { Input, Space, Form as AntFormComponent } from 'antd';

// Example schema for form validation
const projectSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  cliente: z.string().min(1, 'El cliente es requerido'),
  presupuesto: z.coerce.number().positive('El presupuesto debe ser mayor a 0'),
  fechaInicio: z.string().min(1, 'La fecha es requerida'),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export const AntDesignExample: React.FC = () => {
  const [projects, setProjects] = useState([
    { id: 1, nombre: 'Proyecto A', cliente: 'Cliente 1', presupuesto: 10000, estado: 'Activo' },
    { id: 2, nombre: 'Proyecto B', cliente: 'Cliente 2', presupuesto: 15000, estado: 'Pausado' },
  ]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(true);

  const handleFormSubmit = (data: ProjectFormData) => {
    setProjects([...projects, { id: projects.length + 1, ...data, estado: 'Activo' }]);
    messageManager.success('Proyecto creado exitosamente');
    setDrawerOpen(false);
  };

  const handleDelete = (id: number) => {
    setProjects(projects.filter(p => p.id !== id));
    messageManager.success('Proyecto eliminado');
  };

  const statsData = [
    {
      title: 'Proyectos Activos',
      value: 5,
      prefix: '📊',
      trend: 'up' as const,
      trendValue: '+2',
      tooltip: 'Proyectos en ejecución actual',
    },
    {
      title: 'Presupuesto Total',
      value: 'Q250,000',
      prefix: '💰',
      trend: 'neutral' as const,
      color: '#ff8c42',
    },
    {
      title: 'Avance Promedio',
      value: '65%',
      prefix: '⚡',
      trend: 'up' as const,
      trendValue: '+5%',
    },
    {
      title: 'Proyectos Completados',
      value: 12,
      prefix: '✓',
      trend: 'up' as const,
      trendValue: '+1',
    },
  ];

  const progressData = [
    { title: 'Proyecto A', percent: 85, status: 'active' as const, color: '#52c41a' },
    { title: 'Proyecto B', percent: 45, status: 'normal' as const, color: '#ff8c42' },
    { title: 'Proyecto C', percent: 20, status: 'normal' as const, color: '#faad14' },
  ];

  const tableColumns = [
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre' },
    { title: 'Cliente', dataIndex: 'cliente', key: 'cliente' },
    { title: 'Presupuesto', dataIndex: 'presupuesto', key: 'presupuesto', render: (v: number) => `Q${v.toLocaleString()}` },
    { title: 'Estado', dataIndex: 'estado', key: 'estado' },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_: any, record: any) => (
        <Space size="small">
          <AntButton type="primary" size="small" icon={<EditOutlined />} />
          <AntDeleteButton
            onConfirm={() => handleDelete(record.id)}
            size="small"
          />
        </Space>
      ),
    },
  ];

  const menuItems = [
    { key: 'dashboard', label: '📊 Dashboard' },
    { key: 'proyectos', label: '📁 Proyectos' },
    { key: 'presupuestos', label: '💰 Presupuestos' },
    { key: 'bodega', label: '📦 Bodega' },
    { key: 'empleados', label: '👥 Empleados' },
  ];

  return (
    <AntLayout
      logo={<strong style={{ color: 'white' }}>CONSTRUSMART</strong>}
      menuItems={menuItems}
      onMenuClick={(key) => messageManager.info(`Navegando a ${key}`)}
      header={<h2>Dashboard de Proyectos</h2>}
      headerActions={
        <Space>
          <AntButton
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setDrawerOpen(true)}
          >
            Nuevo Proyecto
          </AntButton>
        </Space>
      }
      currentUser={{ name: 'Usuario Demo', avatar: 'https://via.placeholder.com/32' }}
      onLogout={() => messageManager.info('Sesión cerrada')}
      notifications={3}
      onNotifications={() => notificationManager.info({ title: 'Notificaciones', description: 'Tienes 3 nuevas notificaciones' })}
    >
      {/* Alerts */}
      {alertOpen && (
        <AntAlert
          type="info"
          title="Información"
          description="Esta es una demostración de los componentes de Ant Design"
          onClose={() => setAlertOpen(false)}
        />
      )}

      {/* Statistics */}
      <div style={{ marginBottom: 32 }}>
        <h3>KPIs</h3>
        <AntStats stats={statsData} columns={4} />
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 32 }}>
        <h3>Avance de Proyectos</h3>
        <AntCard>
          <AntProgressStats items={progressData} />
        </AntCard>
      </div>

      {/* Data Table */}
      <div style={{ marginBottom: 32 }}>
        <h3>Proyectos</h3>
        <AntDataTable
          columns={tableColumns}
          data={projects}
          title="Lista de Proyectos"
          searchPlaceholder="Buscar proyectos..."
          pagination
          rowKey="id"
        />
      </div>

      {/* Drawer for form */}
      <AntDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Nuevo Proyecto"
        size="large"
      >
        <AntForm<ProjectFormData>
          schema={projectSchema}
          onSubmit={handleFormSubmit}
          submitText="Crear Proyecto"
          onCancel={() => setDrawerOpen(false)}
          cols={1}
        >
          <AntFormComponent.Item label="Nombre" required>
            <Input placeholder="Nombre del proyecto" />
          </AntFormComponent.Item>
          <AntFormComponent.Item label="Cliente" required>
            <Input placeholder="Nombre del cliente" />
          </AntFormComponent.Item>
          <AntFormComponent.Item label="Presupuesto" required>
            <Input type="number" placeholder="Monto" />
          </AntFormComponent.Item>
          <AntFormComponent.Item label="Fecha de Inicio" required>
            <AntDatePicker format="DD/MM/YYYY" />
          </AntFormComponent.Item>
        </AntForm>
      </AntDrawer>

      {/* Modal */}
      <AntModal
        open={modalOpen}
        title="Información"
        onOk={() => setModalOpen(false)}
        onCancel={() => setModalOpen(false)}
        okText="Aceptar"
        cancelText="Cancelar"
      >
        <p>Este es un modal de ejemplo con contenido personalizado</p>
      </AntModal>
    </AntLayout>
  );
};

export default AntDesignExample;
