import {
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { cx, useControllable } from './core';
import { Checkbox, Select } from './fields';
import { Button, EmptyState, Icon } from './primitives';

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
  rowHeader?: boolean;
  nowrap?: boolean;
  colSpan?: (row: T) => number | null | undefined;
}
export type TableRowTone = 'info' | 'ok' | 'warn' | 'ng' | 'fault';
export type TableRowProps = Omit<
  HTMLAttributes<HTMLTableRowElement>,
  'children' | 'dangerouslySetInnerHTML'
> & {
  tone?: TableRowTone;
  [data: `data-${string}`]: string | number | boolean | undefined;
};
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
  getRowProps?: (row: T) => TableRowProps | undefined;
  emptyState?: ReactNode;
  loading?: boolean;
  keepRowsWhileLoading?: boolean;
  className?: string;
}
const selectableRow = () => true;
const collator = new Intl.Collator('zh-CN', { numeric: true });
const interactiveSelector =
  'a[href], button, input, select, textarea, label, summary, [contenteditable=""], [contenteditable="true"], [role="button"], [role="checkbox"], [role="combobox"], [role="link"], [role="menuitem"], [role="option"], [role="radio"], [role="slider"], [role="spinbutton"], [role="switch"], [role="tab"], [role="textbox"], td.qs-table-checkbox';
function fromRowItself(event: { target: EventTarget; currentTarget: HTMLElement }) {
  const row = event.currentTarget;
  const target = event.target as Element | null;
  if (!target || !row.contains(target)) return false;
  const control = target.closest(interactiveSelector);
  return !control || control === row || !row.contains(control);
}
function TableRow<T>({
  row,
  id,
  columns,
  selectable,
  selected,
  disabled,
  label,
  toggle,
  getRowProps,
}: {
  row: T;
  id: string;
  columns: TableColumn<T>[];
  selectable?: boolean;
  selected: boolean;
  disabled: boolean;
  label: string;
  toggle: (key: string, checked: boolean) => void;
  getRowProps?: (row: T) => TableRowProps | undefined;
}) {
  const { tone, className, onClick, onKeyDown, ...rowProps } =
    getRowProps?.(row) ?? ({} as TableRowProps);
  let covered = 0;
  return (
    <tr
      {...rowProps}
      className={className}
      data-selected={selected || undefined}
      data-tone={tone}
      data-interactive={onClick ? '' : undefined}
      onClick={
        onClick &&
        ((event: MouseEvent<HTMLTableRowElement>) => {
          if (fromRowItself(event)) onClick(event);
        })
      }
      onKeyDown={
        onClick || onKeyDown
          ? (event: KeyboardEvent<HTMLTableRowElement>) => {
              onKeyDown?.(event);
              if (
                onClick &&
                !event.defaultPrevented &&
                !event.repeat &&
                event.target === event.currentTarget &&
                (event.key === 'Enter' || event.key === ' ')
              ) {
                event.preventDefault();
                event.currentTarget.click();
              }
            }
          : undefined
      }
    >
      {selectable && (
        <td className="qs-table-checkbox">
          <Checkbox
            label={<span className="qs-sr-only">选择 {label}</span>}
            checked={selected}
            disabled={disabled}
            onCheckedChange={(checked) => toggle(id, checked)}
          />
        </td>
      )}
      {columns.map((column, index) => {
        if (covered > 0) {
          covered -= 1;
          return null;
        }
        const span = Math.min(
          Math.max(1, Math.floor(column.colSpan?.(row) ?? 1)),
          columns.length - index,
        );
        covered = span - 1;
        const Cell = column.rowHeader ? 'th' : 'td';
        return (
          <Cell
            key={column.key}
            scope={column.rowHeader ? 'row' : undefined}
            colSpan={span > 1 ? span : undefined}
            style={{ textAlign: column.align }}
            className={cx(column.align === 'right' && 'qs-num', column.nowrap && 'qs-nowrap')}
          >
            {column.render ? column.render(row) : column.accessor?.(row)}
          </Cell>
        );
      })}
    </tr>
  );
}
const MemoRow = memo(TableRow) as typeof TableRow;
function SortIcon() {
  return (
    <svg
      className="qs-table-sort-icon"
      width="12"
      height="16"
      viewBox="0 0 12 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path className="qs-table-sort-up" d="M3 6.5 6 3.5l3 3" />
      <path className="qs-table-sort-down" d="M3 9.5 6 12.5l3-3" />
    </svg>
  );
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
  isRowSelectable = selectableRow,
  getRowLabel,
  getRowProps,
  emptyState,
  loading,
  keepRowsWhileLoading,
  className,
}: TableProps<T>) {
  const [currentSort, setSort] = useControllable(sort, defaultSort, onSortChange);
  const [selection, setSelection] = useControllable(
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
  );
  const [settledRows, setSettledRows] = useState(rows);
  if (keepRowsWhileLoading && !loading && settledRows !== rows) setSettledRows(rows);
  const staleRows = keepRowsWhileLoading && loading ? (rows.length ? rows : settledRows) : null;
  const visibleRows = staleRows ?? rows;
  const showRows = !loading || (staleRows?.length ?? 0) > 0;
  const sorted = useMemo(() => {
    const column = columns.find((column) => column.key === currentSort?.key);
    if (manualSorting || !currentSort || !column?.sortable || (!column.accessor && !column.compare))
      return visibleRows;
    const compare =
      column.compare ??
      ((a: T, b: T) => {
        const av = column.accessor!(a);
        const bv = column.accessor!(b);
        if (av == null) return bv == null ? 0 : 1;
        if (bv == null) return -1;
        return typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : collator.compare(String(av), String(bv));
      });
    return [...visibleRows].sort(
      (a, b) => compare(a, b) * (currentSort.direction === 'asc' ? 1 : -1),
    );
  }, [visibleRows, columns, currentSort, manualSorting]);
  const pageKeys = useMemo(
    () => visibleRows.filter(isRowSelectable).map(rowKey),
    [visibleRows, isRowSelectable, rowKey],
  );
  const pageSet = useMemo(() => new Set(pageKeys), [pageKeys]);
  const selectedSet = useMemo(() => new Set(selection), [selection]);
  const selectionRef = useRef(selection);
  useLayoutEffect(() => {
    selectionRef.current = selection;
  }, [selection]);
  const toggleRow = useCallback(
    (key: string, checked: boolean) => {
      const current = selectionRef.current;
      setSelection(
        checked ? [...new Set([...current, key])] : current.filter((item) => item !== key),
      );
    },
    [setSelection],
  );
  const selectedOnPage = pageKeys.filter((key) => selectedSet.has(key)).length;
  const togglePage = () =>
    setSelection(
      selectedOnPage === pageKeys.length
        ? selection.filter((key) => !pageSet.has(key))
        : [...new Set([...selection, ...pageKeys])],
    );
  const span = columns.length + (selectable ? 1 : 0);
  return (
    <div
      className={cx('qs-table-scroll', className)}
      role="region"
      aria-label={caption}
      tabIndex={0}
      aria-busy={loading || undefined}
    >
      <table
        className="qs-table"
        aria-busy={loading || undefined}
        data-stale={(loading && showRows) || undefined}
      >
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
            {columns.map((column) => {
              const direction = currentSort?.key === column.key ? currentSort.direction : undefined;
              return (
                <th
                  key={column.key}
                  scope="col"
                  className={cx(
                    column.sortable && 'qs-table-sortable',
                    column.nowrap && 'qs-nowrap',
                  )}
                  style={{ textAlign: column.align, width: column.width }}
                  aria-sort={
                    direction ? (direction === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      className="qs-table-sort"
                      data-sort={direction ?? 'none'}
                      data-align={column.align}
                      disabled={loading}
                      onClick={() =>
                        setSort(
                          direction
                            ? direction === 'asc'
                              ? { key: column.key, direction: 'desc' }
                              : null
                            : { key: column.key, direction: 'asc' },
                        )
                      }
                    >
                      <span>{column.header}</span>
                      <SortIcon />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {!showRows ? (
            <tr className="qs-table-message-row">
              <td colSpan={span}>
                <div className="qs-table-message" role="status">
                  正在加载数据…
                </div>
              </td>
            </tr>
          ) : sorted.length ? (
            sorted.map((row) => {
              const key = rowKey(row);
              return (
                <MemoRow
                  key={key}
                  row={row}
                  id={key}
                  columns={columns}
                  selectable={selectable}
                  selected={selectedSet.has(key)}
                  disabled={!isRowSelectable(row)}
                  label={getRowLabel?.(row) ?? key}
                  toggle={toggleRow}
                  getRowProps={getRowProps}
                />
              );
            })
          ) : (
            <tr className="qs-table-message-row">
              <td colSpan={span}>
                {emptyState ?? <EmptyState title="暂无数据" description="调整筛选条件后再试。" />}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {keepRowsWhileLoading && (
        <div className="qs-sr-only" role="status">
          {loading && showRows ? '正在更新数据…' : ''}
        </div>
      )}
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
  showPageSize?: boolean;
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
  showPageSize = true,
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
          className="qs-pagination-step"
          aria-label="上一页"
          disabled={disabled || safePage === 1 || !count}
          onClick={() => setPage(safePage - 1)}
        >
          <Icon size={16}>
            <path d="m15 6-6 6 6 6" />
          </Icon>
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
          className="qs-pagination-step"
          aria-label="下一页"
          disabled={disabled || safePage === last || !count}
          onClick={() => setPage(safePage + 1)}
        >
          <Icon size={16}>
            <path d="m9 6 6 6-6 6" />
          </Icon>
        </Button>
      </div>
      {showPageSize && (
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
      )}
    </nav>
  );
}
