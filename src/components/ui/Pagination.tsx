import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

// =============================================================================
// PAGINATION
// =============================================================================

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pageNumbers = getVisiblePages(page, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <p className="text-xs text-slate-500">
        Showing <span className="text-slate-300 font-medium">{start}-{end}</span> of{" "}
        <span className="text-slate-300 font-medium">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <PageButton onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="Previous page">
          <Icon name="chevronLeft" size={14} />
        </PageButton>
        {pageNumbers.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-600 text-xs">
              …
            </span>
          ) : (
            <PageButton key={p} onClick={() => onPageChange(p)} active={p === page}>
              {p}
            </PageButton>
          )
        )}
        <PageButton onClick={() => onPageChange(page + 1)} disabled={page === totalPages} aria-label="Next page">
          <Icon name="chevronRight" size={14} />
        </PageButton>
      </div>
    </div>
  );
}

function PageButton({
  children,
  onClick,
  active,
  disabled,
  ...props
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  [key: string]: unknown;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
        active ? "bg-indigo-500 text-white" : "text-slate-400 hover:bg-white/[0.07] hover:text-white"
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function getVisiblePages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}