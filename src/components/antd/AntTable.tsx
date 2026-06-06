import React, { useState, useMemo } from 'react';
import { Table as AntTableComponent, Button, Space, Input, Select, Tag, Empty, Tooltip, Popconfirm } from 'antd';
import { SearchOutlined, DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';

export interface AntTableColumn<T> {
  key: string;
  title: string;
  dataIndex: string;
  width?: number | string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sorter?: (a: T, b: T) => number;
  filterKey?: string;
  filterOptions?: Array<{ label: string; value: any }>;
}

export interface AntTableAction<T> {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (record: T) => void;
  danger?: boolean;
  confirm?: string;
}

interface AntTableProps<T extends { id?: string | number }> {
  columns: AntTableColumn<T>[];
  data: T[];
  loading?: boolean;
  actions?: AntTableAction<T>[];
  searchPlaceholder?: string;
  searchableFields?: string[];
  onSearch?: (value: string) => void;
  pagination?: boolean;
  pageSize?: number;
  rowKey?: string | ((record: T) => string);
  className?: string;
  empty?: React.ReactNode;
}

export const AntTable = React.forwardRef<any, AntTableProps<any>>(
  ({
    columns,
    data,
    loading = false,
    actions = [],
    searchPlaceholder = 'Buscar...',
    searchableFields = [],
    onSearch,
    pagination = true,
    pageSize = 10,
    rowKey = 'id',
    className = '',
    empty,
  }, ref) => {
    const [searchValue, setSearchValue] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<Record<string, any>>({});

    const filteredData = useMemo(() => {
      let result = data;

      // Aplicar búsqueda
      if (searchValue && searchableFields.length > 0) {
        result = result.filter(item =>
          searchableFields.some(field =>
            String(item[field as keyof typeof item])
              .toLowerCase()
              .includes(searchValue.toLowerCase())
          )
        );
      }

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          result = result.filter(item => item[key] === value);
        }
      });

      return result;
    }, [data, searchValue, filters, searchableFields]);

    const tableColumns: ColumnsType<any> = [
      ...columns.map(col => ({
        key: col.key,
        title: col.title,
        dataIndex: col.dataIndex,
        width: col.width,
        render: col.render,
        sorter: col.sorter,
        ellipsis: true,
      })),
      ...(actions.length > 0
        ? [
            {
              title: 'Acciones',
              key: 'actions',
              width: 100,
              render: (_: any, record: any) => (
                <Space size="small">
                  {actions.map(action => (
                    action.confirm ? (
                      <Popconfirm
                        key={action.key}
                        title={action.confirm}
                        onConfirm={() => action.onClick(record)}
                        okText="Sí"
                        cancelText="No"
                      >
                        <Tooltip title={action.label}>
                          <Button
                            type="text"
                            icon={action.icon}
                            danger={action.danger}
                            size="small"
                          />
                        </Tooltip>
                      </Popconfirm>
                    ) : (
                      <Tooltip key={action.key} title={action.label}>
                        <Button
                          type="text"
                          icon={action.icon}
                          danger={action.danger}
                          onClick={() => action.onClick(record)}
                          size="small"
                        />
                      </Tooltip>
                    )
                  ))}
                </Space>
              ),
            },
          ]
        : []),
    ];

    return (
      <div className={`ant-table-wrapper ${className}`}>
        {/* Búsqueda y filtros */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {searchableFields.length > 0 && (
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={e => {
                setSearchValue(e.target.value);
                onSearch?.(e.target.value);
              }}
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 200 }}
            />
          )}

          {columns
            .filter(col => col.filterOptions)
            .map(col => (
              <Select
                key={col.key}
                placeholder={`Filtrar por ${col.title.toLowerCase()}`}
                value={filters[col.filterKey || col.key]}
                onChange={value => {
                  setFilters(prev => ({
                    ...prev,
                    [col.filterKey || col.key]: value,
                  }));
                }}
                options={col.filterOptions}
                style={{ width: 200 }}
                allowClear
              />
            ))}
        </div>

        {/* Tabla */}
        <AntTableComponent
          columns={tableColumns}
          dataSource={filteredData}
          loading={loading}
          pagination={
            pagination
              ? {
                  pageSize,
                  current: currentPage,
                  onChange: setCurrentPage,
                  showSizeChanger: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} de ${total} registros`,
                }
              : false
          }
          rowKey={rowKey}
          locale={{ emptyText: empty || <Empty description="Sin datos" /> }}
          scroll={{ x: 'max-content' }}
          size="middle"
        />
      </div>
    );
  }
);

AntTable.displayName = 'AntTable';

export default AntTable;
