'use client';

import { useState } from 'react';

export interface Column<T> {
    key: keyof T | string;
    label: string;
    render?: (row: T) => React.ReactNode;
    width?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
}

export function DataTable<T extends { id: string | number }>({
    columns,
    data,
    onRowClick,
    emptyMessage = 'No data available'
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortKey) return 0;

        const aVal = (a as any)[sortKey];
        const bVal = (b as any)[sortKey];

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="table-container">
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={String(column.key)}
                                onClick={() => handleSort(String(column.key))}
                                className="cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                                style={{ width: column.width }}
                            >
                                <div className="flex items-center gap-1">
                                    {column.label}
                                    {sortKey === column.key && (
                                        <span className="text-brand-primary">
                                            {sortOrder === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedData.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="text-center py-8 text-[var(--text-tertiary)]">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        sortedData.map((row) => (
                            <tr
                                key={row.id}
                                onClick={() => onRowClick?.(row)}
                                className={onRowClick ? 'cursor-pointer transition-colors duration-150' : ''}
                            >
                                {columns.map((column) => (
                                    <td key={String(column.key)}>
                                        {column.render
                                            ? column.render(row)
                                            : String((row as any)[column.key] || '-')
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
