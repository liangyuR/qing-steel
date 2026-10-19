import { useMemo, type ReactNode, type CSSProperties } from 'react';
import { cx, useControllable } from './core';
import { Checkbox, Select } from './fields';
import { Button, EmptyState } from './primitives';

export interface TableSort {
  key: string;
  direction: 'asc' | 'desc';
}
export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  accessor?: (row: T) => string | number | null | undefined;
  render?: (row: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: CSSProperties['width'];
  sortable?: boolean;
  compare?: (a: T, b: T) => number;
}
export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption: string;
  sort?: TableSort | null;
  defaultSort?: TableSort | null;
  onSortChange?: (sort: TableSort | null) => void;
  manualSorting?: boolean;
  selectable?: boolean;
  selectedKeys?: string[];
  defaultSelectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  isRowSelectable?: (row: T) => boolean;
  getRowLabel?: (row: T) => string;
  emptyState?: ReactNode;
  loading?: boolean;
  className?: string;
}
export function Table<T>({
  columns,
  rows,
  rowKey,
  caption,
  sort,
  defaultSort = null,
  onSortChange,
  manualSorting,
  selectable,
  selectedKeys,
  defaultSelectedKeys = [],
  onSelectionChange,
  isRowSelectable = () => true,
  getRowLabel,
  emptyState,
  loading,
  className,
}: TableProps<T>) {
  const [currentSort, setSort] = useControllable(sort, defaultSort, onSortChange);
  const [selection, setSelection] = useControllable(
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
  );
  const sorted = useMemo(() => {
    const column = columns.find((column) => column.key === currentSort?.key);
    if (manualSorting || !currentSort || !column?.sortable || (!column.accessor && !column.compare))
      return rows;
    const compare =
      column.compare ??
      ((a: T, b: T) => {
        const av = column.accessor!(a);
        const bv = column.accessor!(b);
        if (av == null) return bv == null ? 0 : 1;
        if (bv == null) return -1;
        return typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), 'zh-CN', { numeric: true });
      });
    return [...rows].sort((a, b) => compare(a, b) * (currentSort.direction === 'asc' ? 1 : -1));
  }, [rows, columns, currentSort, manualSorting]);
  const pageKeys = rows.filter(isRowSelectable).map(rowKey);
  const selectedOnPage = pageKeys.filter((key) => selection.includes(key)).length;
  const togglePage = () =>
    setSelection(
      selectedOnPage === pageKeys.length
        ? selection.filter((key) => !pageKeys.includes(key))
        : [...new Set([...selection, ...pageKeys])],
    );
  return (
    <div
      className={cx('qs-table-scroll', className)}
      role="region"
      aria-label={caption}
      tabIndex={0}
      aria-busy={loading || undefined}
    >
      <table className="qs-table">
        <caption className="qs-sr-only">{caption}</caption>
        <thead>
          <tr>
            {selectable && (
              <th scope="col" className="qs-table-checkbox">
                <Checkbox
                  label={<span className="qs-sr-only">选择本页全部</span>}
                  checked={pageKeys.length > 0 && selectedOnPage === pageKeys.length}
                  indeterminate={selectedOnPage > 0 && selectedOnPage < pageKeys.length}
                  disabled={loading || !pageKeys.length}
                  onCheckedChange={togglePage}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={{ textAlign: column.align, width: column.width }}
                aria-sort={
                  currentSort?.key === column.key
                    ? currentSort.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                {column.sortable ? (
                  <button
                    type="button"
                    className="qs-table-sort"
                    disabled={loading}
                    onClick={() =>
                      setSort(
                        currentSort?.key === column.key
                          ? currentSort.direction === 'asc'
                            ? { key: column.key, direction: 'desc' }
                            : null
                          : { key: column.key, direction: 'asc' },
                      )
                    }
                  >
                    {column.header}
                    <span aria-hidden="true">
                      {currentSort?.key === column.key
                        ? currentSort.direction === 'asc'
                          ? '↑'
                          : '↓'
                        : '↕'}
                    </span>
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)}>
                <div className="qs-table-message" role="status">
                  正在加载数据…
                </div>
              </td>
            </tr>
          ) : sorted.length ? (
            sorted.map((row) => {
              const key = rowKey(row);
              return (
                <tr key={key} data-selected={selection.includes(key) || undefined}>
                  {selectable && (
                    <td className="qs-table-checkbox">
                      <Checkbox
                        label={<span className="qs-sr-only">选择 {getRowLabel?.(row) ?? key}</span>}
                        checked={selection.includes(key)}
                        disabled={!isRowSelectable(row)}
                        onCheckedChange={(checked) =>
                          setSelection(
                            checked
                              ? [...selection, key]
                              : selection.filter((item) => item !== key),
                          )
                        }
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      style={{ textAlign: column.align }}
                      className={column.align === 'right' ? 'qs-num' : undefined}
                    >
                      {column.render ? column.render(row) : column.accessor?.(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)}>
                {emptyState ?? <EmptyState title="暂无数据" description="调整筛选条件后再试。" />}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export interface PaginationProps {
  total: number;
  page?: number;
  defaultPage?: number;
  pageSize?: number;
  defaultPageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
  label?: string;
  className?: string;
}
export function Pagination({
  total,
  page,
  defaultPage = 1,
  pageSize,
  defaultPageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  disabled,
  label = '分页',
  className,
}: PaginationProps) {
  const [current, setPage] = useControllable(page, defaultPage, onPageChange);
  const [size, setSize] = useControllable(pageSize, defaultPageSize, onPageSizeChange);
  const count = Math.max(0, Math.floor(Number.isFinite(total) ? total : 0));
  const limit = Math.max(1, Math.floor(Number.isFinite(size) ? size : 10));
  const last = Math.max(1, Math.ceil(count / limit));
  const safePage = Math.max(1, Math.min(last, Math.floor(Number.isFinite(current) ? current : 1)));
  const pages = [
    ...new Set([
      1,
      last,
      ...[safePage - 1, safePage, safePage + 1].filter((p) => p >= 1 && p <= last),
    ]),
  ].sort((a, b) => a - b);
  const sizes = [
    ...new Set([...pageSizeOptions.filter((n) => Number.isInteger(n) && n > 0), limit]),
  ].sort((a, b) => a - b);
  return (
    <nav aria-label={label} className={cx('qs-pagination', className)}>
      <span className="qs-pagination-summary" aria-live="polite">
        {count ? `${(safePage - 1) * limit + 1}–${Math.min(safePage * limit, count)}` : '0'} / 共{' '}
        {count} 条
      </span>
      <div className="qs-pagination-pages">
        <Button
          size="sm"
          variant="text"
          aria-label="上一页"
          disabled={disabled || safePage === 1 || !count}
          onClick={() => setPage(safePage - 1)}
        >
          ‹
        </Button>
        {pages.map((p, index) => (
          <span className="qs-pagination-page" key={p}>
            {index > 0 && p > pages[index - 1] + 1 && (
              <span className="qs-pagination-gap" aria-hidden="true">
                …
              </span>
            )}
            <Button
              size="sm"
              variant={p === safePage ? 'tonal' : 'text'}
              aria-label={`第 ${p} 页`}
              aria-current={p === safePage ? 'page' : undefined}
              disabled={disabled || !count}
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          </span>
        ))}
        <Button
          size="sm"
          variant="text"
          aria-label="下一页"
          disabled={disabled || safePage === last || !count}
          onClick={() => setPage(safePage + 1)}
        >
          ›
        </Button>
      </div>
      <Select
        aria-label="每页条数"
        value={String(limit)}
        disabled={disabled}
        options={sizes.map((value) => ({ value: String(value), label: `${value} 条 / 页` }))}
        onValueChange={(value) => {
          setSize(Number(value));
          setPage(1);
        }}
      />
    </nav>
  );
}
