import React from 'react';
import { useErp } from '../../store';
import { Table as AntTable } from 'antd';
import type { TableProps as AntTableProps } from 'antd';

export interface UITableProps<T> extends Omit<AntTableProps<T>, 'size'> {
  size?: 'small' | 'medium' | 'large';
}

function UITable<T extends object>({ size = 'small', className = '', ...props }: UITableProps<T>) {
  const { appSettings } = useErp();

  if (appSettings.uiMode === 'antd') {
    const antSize = size === 'medium' ? 'middle' : size === 'large' ? 'large' : 'small';
    return (
      <AntTable<T>
        size={antSize as any}
        className={className}
        {...props}
      />
    );
  }

  const dataSource = props.dataSource || [];
  const columns = props.columns || [];

  return (
    <div className={`overflow-x-auto rounded-xl border border-border ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            {columns.map((col: any) => (
              <th key={col.key || col.dataIndex} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataSource.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                {props.locale?.emptyText || 'Sin datos'}
              </td>
            </tr>
          ) : (
            dataSource.map((record: any, rowIdx: number) => (
              <tr key={record.key || record.id || rowIdx} className="border-b border-border hover:bg-muted/30 transition-colors">
                {columns.map((col: any) => {
                  const value = col.dataIndex ? record[col.dataIndex] : undefined;
                  const rendered = col.render ? col.render(value, record, rowIdx) : value;
                  return (
                    <td key={col.key || col.dataIndex} className="px-4 py-3 text-foreground">
                      {rendered ?? '-'}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default UITable;
