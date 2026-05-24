import React from 'react';

export type SortDirection = 'asc' | 'desc';
export type Column<T> = {
  key: keyof T | string;
  label: React.ReactNode;
  defaultDirection?: SortDirection;
  sortValue?: (row: T) => string | number | null | undefined;
  value?: (row: T, index: number) => React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
};

function compareValues(a: unknown, b: unknown) {
  const aEmpty = a === null || a === undefined || a === '';
  const bEmpty = b === null || b === undefined || b === '';
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;
  const aNumber = typeof a === 'number' ? a : Number(String(a).replace(/[^0-9.-]/g, ''));
  const bNumber = typeof b === 'number' ? b : Number(String(b).replace(/[^0-9.-]/g, ''));
  if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) return aNumber - bNumber;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

export default function SortableTable<T>({
  columns,
  rows,
  className = 'data-table',
  defaultSort,
  onRowClick,
  rowKey,
  getRowClassName,
}: {
  columns: Column<T>[];
  rows: T[];
  className?: string;
  defaultSort?: { key: string; direction: SortDirection };
  onRowClick?: (row: T) => void;
  rowKey?: (row: T, index: number) => React.Key;
  getRowClassName?: (row: T, index: number) => string | undefined;
}) {
  const [sort, setSort] = React.useState(defaultSort || { key: String(columns[0]?.key), direction: columns[0]?.defaultDirection || 'asc' });
  const read = React.useCallback((row: T, column: Column<T>, index: number) => {
    if (column.sortValue) return column.sortValue(row);
    if (column.value) return column.value(row, index);
    return (row as Record<string, unknown>)[String(column.key)];
  }, []);
  const sorted = React.useMemo(() => rows.map((row, index) => ({ row, index })).sort((a, b) => {
    const column = columns.find((c) => String(c.key) === sort.key) || columns[0];
    const result = compareValues(read(a.row, column, a.index), read(b.row, column, b.index));
    return (sort.direction === 'desc' ? -result : result) || a.index - b.index;
  }), [columns, read, rows, sort]);

  return (
    <div className="table-wrapper">
      <table className={className}>
        <thead><tr>{columns.map((column) => {
          const active = sort.key === String(column.key);
          const direction = active ? sort.direction : (column.defaultDirection || 'asc');
          return <th key={String(column.key)} aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button type="button" className="sortable-header" data-direction={direction} onClick={() => setSort({ key: String(column.key), direction: active ? (direction === 'asc' ? 'desc' : 'asc') : direction })}><span>{column.label}</span></button></th>;
        })}</tr></thead>
        <tbody>{sorted.map(({ row, index }, sortedIndex) => <tr key={rowKey ? rowKey(row, index) : sortedIndex} className={getRowClassName?.(row, index)} onClick={onRowClick ? () => onRowClick(row) : undefined} style={onRowClick ? { cursor: 'pointer' } : undefined}>{columns.map((column) => <td key={String(column.key)}>{column.render ? column.render(row, index) : String(read(row, column, index) ?? '')}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
