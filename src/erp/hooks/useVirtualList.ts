import { useCallback } from 'react';
import { List as VirtualizedList } from 'react-window';

export interface VirtualListConfig {
  itemHeight: number;
  /** Max visible rows before virtualizing (default: 50) */
  threshold?: number;
  /** Container height in px (default: 480) */
  containerHeight?: number;
}

export function useVirtualList<T>(items: T[], config: VirtualListConfig) {
  const { itemHeight, threshold = 50, containerHeight = 480 } = config;
  const shouldVirtualize = items.length > threshold;

  const VirtualList = useCallback(
    ({ items: listItems, renderRow, className }: {
      items: T[];
      renderRow: (item: T, index: number) => React.ReactNode;
      className?: string;
    }) => {
      return (
        <VirtualizedList
          height={Math.min(containerHeight, listItems.length * itemHeight)}
          itemCount={listItems.length}
          itemSize={itemHeight}
          width="100%"
          className={className}
          overscanCount={5}
        >
          {({ index, style }: { index: number; style: React.CSSProperties }) => (
            <div style={style}>{renderRow(listItems[index], index)}</div>
          )}
        </VirtualizedList>
      );
    },
    [itemHeight, containerHeight]
  );

  return { shouldVirtualize, VirtualList };
}

export default useVirtualList;
