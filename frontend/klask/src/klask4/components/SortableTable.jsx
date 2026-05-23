import React, { useMemo, useState } from 'react';

function compareValues(a, b) {
  const aEmpty = a === null || a === undefined || a === '';
  const bEmpty = b === null || b === undefined || b === '';
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

export default function SortableTable({ columns, rows, rowKey, defaultSort, getRowClassName }) {
  const [sort, setSort] = useState(defaultSort || { key: columns[0]?.key, direction: 'asc' });

  const sortedRows = useMemo(() => {
    const column = columns.find((c) => c.key === sort.key) || columns[0];
    if (!column) return rows;

    return rows
      .map((row, index) => ({ row, index }))
      .sort((a, b) => {
        const aValue = column.value ? column.value(a.row, a.index) : a.row[column.key];
        const bValue = column.value ? column.value(b.row, b.index) : b.row[column.key];
        const result = compareValues(aValue, bValue);
        return (sort.direction === 'asc' ? result : -result) || a.index - b.index;
      })
      .map(({ row }) => row);
  }, [columns, rows, sort]);

  function handleSort(column) {
    setSort((current) => {
      if (current.key === column.key) {
        return { key: column.key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key: column.key, direction: column.defaultDirection || 'asc' };
    });
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sort.key === column.key;
              const directionLabel = active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none';
              return (
                <th key={column.key} aria-sort={directionLabel}>
                  <button type="button" className="sortable-header" onClick={() => handleSort(column)}>
                    <span>{column.label}</span>
                    {active && <span className={`sort-indicator ${sort.direction}`} aria-hidden="true" />}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, index) => (
            <tr key={rowKey(row, index)} className={getRowClassName ? getRowClassName(row, index) : undefined}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row, index) : row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
