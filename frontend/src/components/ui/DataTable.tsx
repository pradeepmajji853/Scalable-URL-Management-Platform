import { type ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

// ===== Column Definition =====
export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  // Pagination
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  total?: number;
}

export default function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data found',
  emptyIcon,
  sortKey,
  sortOrder,
  onSort,
  page = 1,
  totalPages = 1,
  onPageChange,
  total,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-surface-200 dark:border-surface-700">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-50 dark:bg-surface-800/50">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left">
                  <div className="skeleton rounded h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, ri) => (
              <tr key={ri} className="border-t border-surface-100 dark:border-surface-800">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-4">
                    <div className="skeleton rounded h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-surface-200 dark:border-surface-700">
        <div className="flex flex-col items-center justify-center py-16 px-4">
          {emptyIcon && <div className="mb-4 text-surface-300 dark:text-surface-600">{emptyIcon}</div>}
          <p className="text-surface-500 dark:text-surface-400">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-surface-200 dark:border-surface-700">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-50 dark:bg-surface-800/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400',
                    col.sortable && 'cursor-pointer select-none hover:text-surface-700 dark:hover:text-surface-200 transition-colors',
                    col.className,
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      sortOrder === 'asc' ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {data.map((item, index) => (
              <tr
                key={index}
                className="hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3.5 text-sm', col.className)}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/30">
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {total !== undefined ? `${total} total results` : `Page ${page} of ${totalPages}`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange?.(pageNum)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                    pageNum === page
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700',
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
