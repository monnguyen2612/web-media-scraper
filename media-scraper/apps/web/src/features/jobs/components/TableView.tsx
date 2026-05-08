import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type React from 'react';
import { memo, useMemo } from 'react';
import type { MediaItem } from '@/lib/api';

export const TableView = memo(({ items }: { items: MediaItem[] }): React.ReactElement => {
  const columnsDef = useMemo<ColumnDef<MediaItem>[]>(
    () => [
      { accessorKey: 'type', header: 'Type' },
      { accessorKey: 'mediaUrl', header: 'Media URL' },
      { accessorKey: 'sourceUrl', header: 'Source URL' }
    ],
    []
  );

  const table = useReactTable({
    data: items.slice(0, 10),
    columns: columnsDef,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <section className="mt-6 overflow-x-auto rounded-md border border-slate-800">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-900 text-slate-300">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th key={header.id} className="px-3 py-2 text-left">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-800">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="max-w-xs truncate px-3 py-2 text-slate-300">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
});

