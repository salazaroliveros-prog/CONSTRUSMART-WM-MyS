import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationResult } from '@/erp/hooks/usePagination';

interface Props<T> {
  pagination: PaginationResult<T>;
  label?: string;
}

export function PaginationBar<T>({ pagination, label = 'registros' }: Props<T>) {
  const { page, totalPages, from, to, totalItems, hasNext, hasPrev, nextPage, prevPage, setPage } = pagination;
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-2 pt-3 border-t border-border text-xs text-muted-foreground">
      <span>{from}–{to} de {totalItems} {label}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={prevPage}
          disabled={!hasPrev}
          className="p-1 rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers — show at most 5 around current */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | '...')[]>((acc, p, idx, arr) => {
            if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-1">…</span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p as number)}
                className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                  p === page
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            )
          )}

        <button
          onClick={nextPage}
          disabled={!hasNext}
          className="p-1 rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
