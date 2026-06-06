// EJEMPLO DE INTEGRACIÓN: Cómo usar los componentes Ant Design wrapper
import React, { useState } from 'react';
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
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { z } from 'zod';

// Schema de validación Zod
const schemaProspecto = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  empresa: z.string().min(1, 'Empresa requerida'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(1, 'Teléfono requerido'),
  estado: z.enum(['nuevo', 'contactado', 'calificado', 'ganado', 'perdido']),
  monto: z.coerce.number().positive('Monto debe ser mayor a 0'),
});

type Prospecto = z.infer<typeof schemaProspecto> & { id: string; fechaCreacion: string };

const CRMExample: React.FC = () => {
  const [prospectos, setProspectos] = useState<Prospecto[]>([
    {
      id: '1',
      nombre: 'Juan Pérez',
      empresa: 'Constructora ABC',
      email: 'juan@abc.com',
      telefono: '+502 78901234',
      estado: 'ganado',
      monto: 150000,
      fechaCreacion: '2026-06-01',
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: z.infer<typeof schemaProspecto>) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      if (editingId) {
        setProspectos(prev =>
          prev.map(p => (p.id === editingId ? { ...p, ...data } : p))
        );
        notificationManager.success({ title: 'Prospecto actualizado correctamente' });
      } else {
        const newProspecto: Prospecto = {
          id: Date.now().toString(),
          ...data,
          fechaCreacion: new Date().toISOString().split('T')[0],
        };
        setProspectos(prev => [newProspecto, ...prev]);
        notificationManager.success({ title: 'Prospecto creado correctamente' });
      }

      setModalVisible(false);
      setEditingId(null);
    } catch (error) {
      notificationManager.error({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (prospecto: Prospecto) => {
    setEditingId(prospecto.id);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    setProspectos(prev => prev.filter(p => p.id !== id));
    notificationManager.success({ title: 'Prospecto eliminado' });
  };

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      nuevo: 'blue',
      contactado: 'cyan',
      calificado: 'green',
      ganado: 'success',
      perdido: 'error',
    };
    return colors[estado] || 'default';
  };

  const prospectoBuscando = editingId
    ? prospectos.find(p => p.id === editingId)
    : null;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Gestión de Prospectos</h1>
        <AntButton
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingId(null);
            setModalVisible(true);
          }}
        >
          Nuevo Prospecto
        </AntButton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <AntCard title="Total de Prospectos">
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff8c42' }}>
            {prospectos.length}
          </div>
        </AntCard>
        <AntCard title="Ganados este mes">
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
            {prospectos.filter(p => p.estado === 'ganado').length}
          </div>
        </AntCard>
      </div>

      <AntTable
        columns={[
          {
            key: 'nombre',
            title: 'Nombre',
            dataIndex: 'nombre',
            width: 150,
          },
          {
            key: 'empresa',
            title: 'Empresa',
            dataIndex: 'empresa',
            width: 180,
          },
          {
            key: 'estado',
            title: 'Estado',
            dataIndex: 'estado',
            render: (estado: string) => (
              <Tag color={getEstadoColor(estado)}>
                {estado.toUpperCase()}
              </Tag>
            ),
            filterOptions: [
              { label: 'Nuevo', value: 'nuevo' },
              { label: 'Contactado', value: 'contactado' },
              { label: 'Calificado', value: 'calificado' },
              { label: 'Ganado', value: 'ganado' },
              { label: 'Perdido', value: 'perdido' },
            ],
          },
          {
            key: 'monto',
            title: 'Monto (Q)',
            dataIndex: 'monto',
            render: (monto: number) => monto.toLocaleString(),
            width: 120,
          },
        ]}
        data={prospectos}
        actions={[
          {
            key: 'edit',
            label: 'Editar',
            icon: <EditOutlined />,
            onClick: (record) => handleEdit(record as Prospecto),
          },
          {
            key: 'delete',
            label: 'Eliminar',
            icon: <DeleteOutlined />,
            danger: true,
            confirm: '¿Estás seguro?',
            onClick: (record) => handleDelete((record as Prospecto).id),
          },
        ]}
        searchableFields={['nombre', 'empresa', 'email']}
        pageSize={10}
        rowKey="id"
      />

      <AntModal
        title={editingId ? 'Editar Prospecto' : 'Crear Prospecto'}
        open={modalVisible}
        loading={loading}
        onCancel={() => {
          setModalVisible(false);
          setEditingId(null);
        }}
        confirmText={editingId ? 'Actualizar' : 'Crear'}
        width={600}
      >
        <AntForm
          schema={schemaProspecto}
          onSubmit={handleSubmit}
          initialValues={prospectoBuscando || undefined}
          loading={loading}
          cols={2}
          submitText={editingId ? 'Actualizar' : 'Crear'}
          onCancel={() => setModalVisible(false)}
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
          />
          <AntInputField
            name="telefono"
            label="Teléfono"
            placeholder="+502 xxxx xxxx"
            required
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
          />
          <AntInputField
            name="monto"
            label="Monto (Q)"
            type="number"
            placeholder="150000"
            required
          />
        </AntForm>
      </AntModal>
    </div>
  );
};

export default CRMExample;
