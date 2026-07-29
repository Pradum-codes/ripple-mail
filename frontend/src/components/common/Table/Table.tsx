import type { ReactNode, Key } from 'react';
import { cn } from '@/utils/cn';
import EmptyState, { type EmptyStateProps } from '../EmptyState';
import Spinner from '../Spinner';

export type TableColumnAlign = 'left' | 'center' | 'right';

export interface TableColumn<T> {
  header: ReactNode;
  accessor?: keyof T;
  render?: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  align?: TableColumnAlign;
}

export interface TableProps<T> {
  columns: ReadonlyArray<TableColumn<T>>;
  rows: ReadonlyArray<T>;
  getRowKey: (row: T, index: number) => Key;
  loading?: boolean;
  emptyState?: EmptyStateProps;
  className?: string;
}

const alignmentClasses: Record<TableColumnAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

function Table<T>({
  columns,
  rows,
  getRowKey,
  loading = false,
  emptyState = {
    title: 'No results found',
    description: 'There is nothing to display right now.',
  },
  className,
}: TableProps<T>) {
  const hasRows = rows.length > 0;

  return (
    <div className={cn('w-full overflow-hidden rounded-2xl border border-slate-200 bg-white', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={cn(
                    'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500',
                    alignmentClasses[column.align ?? 'left'],
                    column.headerClassName,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center">
                  <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
                    <Spinner size="md" />
                    Loading table data
                  </div>
                </td>
              </tr>
            ) : hasRows ? (
              rows.map((row, rowIndex) => (
                <tr key={getRowKey(row, rowIndex)} className="transition-colors hover:bg-slate-50">
                  {columns.map((column, columnIndex) => (
                    <td
                      key={columnIndex}
                      className={cn(
                        'px-4 py-4 text-sm text-slate-700',
                        alignmentClasses[column.align ?? 'left'],
                        column.className,
                      )}
                    >
                      {column.render
                        ? column.render(row)
                        : column.accessor
                          ? String(row[column.accessor] ?? '')
                          : null}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8">
                  <EmptyState
                    title={emptyState.title}
                    description={emptyState.description}
                    icon={emptyState.icon}
                    action={emptyState.action}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
