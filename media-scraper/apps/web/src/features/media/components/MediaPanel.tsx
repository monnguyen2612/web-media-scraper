import type React from 'react';
import { startTransition, useState } from 'react';
import { MediaGrid } from '@/features/media/components/MediaGrid';
import { TableView } from '@/features/jobs/components/TableView';
import type { MediaType } from '@/lib/api';
import { useMedia } from '@/features/media/hooks/useMedia';
import { useRealtimeCache } from '@/features/jobs/hooks/useRealtimeCache';
import { useSSE } from '@/features/jobs/hooks/useSSE';
import { cn } from '@/lib/utils';

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
    <div className="space-y-6 animate-slide-up">
      <section className="glass-panel p-4 rounded-2xl grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2 relative">
          <input
            id="search-input"
            value={searchInput}
            onChange={(event) => {
              startTransition(() => {
                setPage(1);
                setSearchInput(event.target.value);
              });
            }}
            placeholder="Search media or source URL..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          />
        </div>
        
        <select
          id="type-filter"
          value={type}
          onChange={(event) => {
            startTransition(() => {
              setPage(1);
              setType(event.target.value as MediaType | '');
            });
          }}
          className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All media types</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>

        <div className="flex gap-2">
          <button
            className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            disabled={query.isFetching}
            onClick={() => query.refetch()}
          >
            {query.isFetching ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-all disabled:opacity-50"
            onClick={exportCsv}
            disabled={items.length === 0}
          >
            Export
          </button>
        </div>
      </section>

      {query.isError && (
        <div className="p-8 text-center text-red-400 bg-red-500/5 rounded-2xl border border-red-500/10">
          Failed to load media gallery.
        </div>
      )}

      {!query.isLoading && !query.isError ? (
        <div className="glass-panel rounded-2xl p-6">
          <MediaGrid items={items} />
          
          {items.length === 0 && !query.isLoading && (
            <div className="p-20 text-center text-slate-600 italic">
              No media items found for this search.
            </div>
          )}
        </div>
      ) : (
        <div className="p-20 text-center text-slate-500 italic">
          Loading media library...
        </div>
      )}

      <footer className="flex items-center justify-between px-2">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Total Discoveries: {query.data?.total ?? 0}
        </div>
        <div className="flex items-center gap-4">
          <button 
            className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-50 transition-all" 
            disabled={page <= 1} 
            onClick={goPrev}
          >
            Prev
          </button>
          <span className="text-xs font-bold text-slate-400">
            {page} / {totalPages}
          </span>
          <button
            className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-50 transition-all"
            disabled={page >= totalPages}
            onClick={goNext}
          >
            Next
          </button>
        </div>
      </footer>

      <section className="pt-8">
        <button
          className="text-xs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest flex items-center gap-2 transition-colors"
          onClick={() => setShowTable((old) => !old)}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full transition-colors", showTable ? "bg-indigo-500" : "bg-slate-700")} />
          {showTable ? 'Hide Tabular Data' : 'View Tabular Data'}
        </button>
        {showTable ? (
          <div className="mt-4 glass-panel rounded-2xl overflow-hidden animate-slide-up">
            <TableView items={items} />
          </div>
        ) : null}
      </section>
    </div>
  );
};

