import type React from 'react';
import { startTransition, useState } from 'react';
import { MediaGrid } from '@/features/media/components/MediaGrid';
import { TableView } from '@/features/jobs/components/TableView';
import type { MediaType } from '@/lib/api';
import { useMedia } from '@/features/media/hooks/useMedia';
import { useRealtimeCache } from '@/features/jobs/hooks/useRealtimeCache';
import { useSSE } from '@/features/jobs/hooks/useSSE';

export const MediaPanel = (): React.ReactElement => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [type, setType] = useState<MediaType | ''>('');
  const [showTable, setShowTable] = useState(false);

  const { onEvent } = useRealtimeCache();
  useSSE({ enabled: true, onEvent });

  const { query, items, totalPages, goPrev, goNext } = useMedia({
    enabled: true,
    page,
    setPage,
    searchInput,
    type
  });

  const exportCsv = (): void => {
    const header = ['id', 'type', 'mediaUrl', 'sourceUrl', 'createdAt'];
    const rows = items.map((m) => [m.id, m.type, m.mediaUrl, m.sourceUrl, m.createdAt]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `media-export-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <section className="mb-6 grid gap-3 md:grid-cols-4">
        <label className="sr-only" htmlFor="search-input">
          Search media
        </label>
        <input
          id="search-input"
          value={searchInput}
          onChange={(event) => {
            startTransition(() => {
              setPage(1);
              setSearchInput(event.target.value);
            });
          }}
          placeholder="Search media or source URL"
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 md:col-span-2"
        />
        <label className="sr-only" htmlFor="type-filter">
          Filter by media type
        </label>
        <select
          id="type-filter"
          value={type}
          onChange={(event) => {
            startTransition(() => {
              setPage(1);
              setType(event.target.value as MediaType | '');
            });
          }}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
        >
          <option value="">All media types</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>
        <div className="flex gap-2">
          <button
            className="flex-1 rounded-md bg-indigo-600 px-3 py-2 disabled:opacity-50"
            disabled={query.isFetching}
            onClick={() => query.refetch()}
          >
            Refresh
          </button>
          <button
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            onClick={exportCsv}
            disabled={items.length === 0}
          >
            Export CSV
          </button>
        </div>
      </section>

      {query.isLoading && <p>Loading media...</p>}
      {query.isError && <p className="text-red-400">Failed to load media.</p>}
      {query.isFetching && !query.isLoading && <p className="text-xs text-slate-400">Refreshing...</p>}

      {!query.isLoading && !query.isError ? (
        <div className="overflow-hidden rounded-md border border-slate-800 bg-slate-900 p-3">
          <MediaGrid items={items} />
        </div>
      ) : null}

      <footer className="mt-4 flex items-center justify-between">
        <div className="text-sm text-slate-400">Total: {query.data?.total ?? 0}</div>
        <div className="space-x-2">
          <button className="rounded bg-slate-800 px-3 py-1 disabled:opacity-50" disabled={page <= 1} onClick={goPrev}>
            Prev
          </button>
          <span className="text-sm">
            {page} / {totalPages}
          </span>
          <button
            className="rounded bg-slate-800 px-3 py-1 disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={goNext}
          >
            Next
          </button>
        </div>
      </footer>

      <section className="mt-6">
        <button
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          onClick={() => setShowTable((old) => !old)}
        >
          {showTable ? 'Hide table view' : 'Show table view'}
        </button>
        {showTable ? <TableView items={items} /> : null}
      </section>
    </>
  );
};

