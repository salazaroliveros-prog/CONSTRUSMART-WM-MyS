import { useState, useMemo } from 'react';

export interface PaginationResult<T> {
  page: number;
  totalPages: number;
  pageSize: number;
  items: T[];
  setPage: (p: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  totalItems: number;
  from: number;
  to: number;
}

export function usePagination<T>(
  data: T[],
  pageSize = 20,
): PaginationResult<T> {
  const [page, setPageRaw] = useState(1);

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Clamp page when data shrinks
  const page_ = Math.min(page, totalPages);

  const items = useMemo(
    () => data.slice((page_ - 1) * pageSize, page_ * pageSize),
    [data, page_, pageSize],
  );

  const setPage = (p: number) => setPageRaw(Math.max(1, Math.min(p, totalPages)));
  const from = totalItems === 0 ? 0 : (page_ - 1) * pageSize + 1;
  const to   = Math.min(page_ * pageSize, totalItems);

  return {
    page: page_,
    totalPages,
    pageSize,
    items,
    setPage,
    nextPage: () => setPage(page_ + 1),
    prevPage: () => setPage(page_ - 1),
    reset: () => setPageRaw(1),
    hasNext: page_ < totalPages,
    hasPrev: page_ > 1,
    totalItems,
    from,
    to,
  };
}
