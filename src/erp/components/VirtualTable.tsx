import React, { useRef, useEffect, useState } from 'react';
import { List, useListRef } from 'react-window';

interface VirtualTableProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualTable<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5,
  className = '',
}: VirtualTableProps<T>) {
  const [listRef] = useListRef();

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <List
        ref={listRef}
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        width="100%"
        overscanCount={overscan}
      >
        {({ index, style }) => (
          <div style={style}>
            {renderItem(items[index], index)}
          </div>
        )}
      </List>
    </div>
  );
}
