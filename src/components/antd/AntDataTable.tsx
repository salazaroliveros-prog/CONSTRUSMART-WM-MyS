import React, { useState } from 'react';
import { Table, Space, Button, Input, Select, Empty, Spin, Tooltip } from 'antd';
import { SearchOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import type { TableProps, ColumnType } from 'antd/es/table';

interface AntDataTableProps<T> extends Omit<TableProps<T>, 'columns'> {
  title?: string;
  columns: ColumnType<T>[];
  data: T[];
  loading?: boolean;
  pagination?: boolean | TableProps<T>['pagination'];
  rowKey?: string | ((record: T) => string);
  onRefresh?: () => void;
  searchPlaceholder?: string;
  filterOptions?: Array<{ label: string; value: string }>;
  onFilter?: (value: string) => void;
  rowSelection?: TableProps<T>['rowSelection'];
  size?: 'small' | 'middle' | 'large';
  bordered?: boolean;
  striped?: boolean;
}

export const AntDataTable = React.forwardRef<any, AntDataTableProps<any>>(
  ({
    title,
    columns,
    data,
    loading = false,
    pagination = true,
    rowKey = 'id',
    onRefresh,
    searchPlaceholder = 'Buscar...',
    filterOptions,
    onFilter,
    rowSelection,
    size = 'middle',
    bordered = true,
    striped = true,
    ...props
  }, ref) => {
    const [searchValue, setSearchValue] = useState('');
    const [filterValue, setFilterValue] = useState<string>();

    const handleSearch = (value: string) => {
      setSearchValue(value);
    };

    const handleFilter = (value: string) => {
      setFilterValue(value);
      onFilter?.(value);
    };

    const enhancedPagination = pagination === true
      ? { pageSize: 10, showSizeChanger: true, showTotal: (total: number) => `Total: ${total} registros` }
      : pagination || undefined;

    const filteredData = data.filter((item: any) => {
      if (!searchValue) return true;
      return Object.values(item).some(v =>
        String(v).toLowerCase().includes(searchValue.toLowerCase())
      );
    });

    return (
      <Spin spinning={loading}>
        <div style={{ marginBottom: 16 }}>
          {(title || searchPlaceholder || filterOptions || onRefresh) && (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {title && <h3>{title}</h3>}
              <Space wrap>
                {searchPlaceholder && (
                  <Input
                    placeholder={searchPlaceholder}
                    prefix={<SearchOutlined />}
                    value={searchValue}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ width: 200 }}
                    allowClear
                  />
                )}
                {filterOptions && (
                  <Select
                    placeholder="Filtrar"
                    value={filterValue}
                    onChange={handleFilter}
                    options={[
                      { label: 'Todos', value: undefined },
                      ...filterOptions,
                    ]}
                    style={{ width: 150 }}
                    allowClear
                  />
                )}
                {onRefresh && (
                  <Tooltip title="Actualizar">
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={onRefresh}
                      loading={loading}
                    />
                  </Tooltip>
                )}
              </Space>
            </Space>
          )}
        </div>
        <Table
          ref={ref}
          columns={columns}
          dataSource={filteredData}
          rowKey={rowKey}
          pagination={enhancedPagination}
          loading={loading}
          size={size}
          bordered={bordered}
          rowSelection={rowSelection}
          locale={{
            emptyText: <Empty description="Sin datos" />,
          }}
          {...props}
        />
      </Spin>
    );
  }
);

AntDataTable.displayName = 'AntDataTable';

export default AntDataTable;
