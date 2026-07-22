import React, { useRef, useState, useCallback, useEffect } from 'react';

interface ResponsiveTableProps {
  children: React.ReactNode;
  ariaLabel: string;
  /** If true, renders as card layout on <md breakpoint */
  cardOnMobile?: boolean;
  /** Column configuration for card rendering */
  columns?: { key: string; label: string; render: (row: any) => React.ReactNode }[];
  data?: any[];
  /** Optional class for scroll container */
  className?: string;
  /** Enable horizontal scroll hint */
  showScrollHint?: boolean;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  children,
  ariaLabel,
  cardOnMobile = false,
  columns = [],
  data = [],
  className = '',
  showScrollHint = true,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, [checkScroll, children]);

  return (
    <div className={`relative ${className}`}>
      {/* Horizontal scroll hint */}
      {showScrollHint && canScrollRight && (
        <div className="md:hidden absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none flex items-center justify-end pr-2">
          <div className="w-6 h-6 rounded-full bg-muted-foreground/20 flex items-center justify-center animate-pulse">
            <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Scrollable table wrapper */}
      <div
        ref={scrollRef}
        className="overflow-x-auto overscroll-contain -mx-1 px-1 scroll-smooth hide-scrollbar"
        role="region"
        aria-label={ariaLabel}
      >
        {/* Card layout on mobile */}
        {cardOnMobile && data.length > 0 && (
          <div className="block md:hidden space-y-2">
            {data.map((row, idx) => (
              <div
                key={row.id || idx}
                className="bg-card border border-border rounded-xl p-3 space-y-2 active:scale-[0.99] transition-transform"
              >
                {columns.map((col) => (
                  <div key={col.key} className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider shrink-0">
                      {col.label}
                    </span>
                    <span className="text-xs font-medium text-foreground text-right truncate max-w-[65%]">
                      {col.render(row)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Standard table - hidden on mobile if card layout */}
        <div className={`${cardOnMobile && data.length > 0 ? 'hidden md:block' : ''}`}>
          <table className="w-full text-xs" role="table" aria-label={ariaLabel}>
            {children}
          </table>
        </div>

        {/* Empty state */}
        {data.length === 0 && columns.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">{ariaLabel}</p>
            <p className="text-xs mt-1">No hay datos disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
};

/** Responsive table row with mobile-optimized touch target */
export const ResponsiveRow: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ children, onClick, className = '' }) => {
  const [touchStart, setTouchStart] = useState(0);
  const isSwiping = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (Math.abs(e.touches[0].clientX - touchStart) > 10) {
      isSwiping.current = true;
    }
  }, [touchStart]);

  const handleClick = useCallback(() => {
    if (!isSwiping.current && onClick) {
      onClick();
    }
  }, [onClick]);

  return (
    <tr
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      className={`border-t hover:bg-muted/50 transition-colors ${onClick ? 'cursor-pointer active:bg-muted/80' : ''} ${className}`}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      role={onClick ? 'button' : undefined}
    >
      {children}
    </tr>
  );
};

export default ResponsiveTable;