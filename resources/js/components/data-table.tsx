import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type DataTableProps<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    pageSize?: number;
    searchable?: boolean;
    searchPlaceholder?: string;
    searchColumn?: string;
};

export function DataTable<TData, TValue>({
    columns,
    data,
    pageSize = 10,
    searchable = false,
    searchPlaceholder = 'Search...',
    searchColumn,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        state: { sorting, globalFilter },
        initialState: { pagination: { pageSize } },
    });

    return (
        <div className="space-y-3">
            {searchable && (
                <input
                    type="text"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-sidebar"
                />
            )}

            <div className="overflow-x-auto rounded-xl border border-border">
                <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                    <thead className="bg-sidebar/60 text-left text-muted-foreground">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="px-4 py-3 font-medium"
                                    >
                                        {header.isPlaceholder ? null : (
                                            <button
                                                type="button"
                                                className={cn(
                                                    'flex items-center gap-1',
                                                    header.column.getCanSort() && 'cursor-pointer select-none',
                                                )}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {header.column.getCanSort() && (
                                                    <ArrowUpDown className="size-3" />
                                                )}
                                            </button>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                                    No results found.
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className="transition hover:bg-muted/50">
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-4 py-3">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {table.getPageCount() > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="rounded-lg border border-border p-1.5 text-muted-foreground transition hover:bg-muted disabled:opacity-50"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="rounded-lg border border-border p-1.5 text-muted-foreground transition hover:bg-muted disabled:opacity-50"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
