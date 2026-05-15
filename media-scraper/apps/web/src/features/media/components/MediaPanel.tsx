import type React from 'react';
import { startTransition, useState } from 'react';
import { MediaGrid } from '@/features/media/components/MediaGrid';
import { TableView } from '@/features/jobs/components/TableView';
import type { MediaType } from '@/lib/api';
import { useMedia } from '@/features/media/hooks/useMedia';
import { useRealtimeCache } from '@/features/jobs/hooks/useRealtimeCache';
import { useSSE } from '@/features/jobs/hooks/useSSE';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export const MediaPanel = (): React.ReactElement => {
  const { t } = useTranslation();
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
            placeholder={t('media.searchPlaceholder')}
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
          className="rounded-xl border border-slate-800 bg-slate-950 pl-4 pr-10 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[right_1rem_center] bg-no-repeat"
        >
          <option value="">{t('media.allTypes')}</option>
          <option value="image">{t('media.image')}</option>
          <option value="video">{t('media.video')}</option>
        </select>

        <div className="flex gap-2">
          <button
            className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            disabled={query.isFetching}
            onClick={() => query.refetch()}
          >
            {query.isFetching ? t('media.refreshing') : t('media.refresh')}
          </button>
          <button
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-all disabled:opacity-50"
            onClick={exportCsv}
            disabled={items.length === 0}
          >
            {t('media.export')}
          </button>
        </div>
      </section>

      {query.isError && (
        <div className="p-8 text-center text-red-400 bg-red-500/5 rounded-2xl border border-red-500/10">
          {t('media.loadError')}
        </div>
      )}

      {!query.isLoading && !query.isError ? (
        <div className="glass-panel rounded-2xl p-6">
          <MediaGrid items={items} />
          
          {items.length === 0 && !query.isLoading && (
            <div className="p-20 text-center text-slate-600 italic">
              {t('media.noResults')}
            </div>
          )}
        </div>
      ) : (
        <div className="p-20 text-center text-slate-500 italic">
          {t('media.loading')}
        </div>
      )}

      <footer className="flex items-center justify-between px-2">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          {t('media.totalDiscoveries', { count: query.data?.total ?? 0 })}
        </div>
        <div className="flex items-center gap-4">
          <button 
            className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-50 transition-all" 
            disabled={page <= 1} 
            onClick={goPrev}
          >
            {t('media.prev')}
          </button>
          <span className="text-xs font-bold text-slate-400">
            {page} / {totalPages}
          </span>
          <button
            className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-50 transition-all"
            disabled={page >= totalPages}
            onClick={goNext}
          >
            {t('media.next')}
          </button>
        </div>
      </footer>

      <section className="pt-8">
        <button
          className="text-xs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest flex items-center gap-2 transition-colors"
          onClick={() => setShowTable((old) => !old)}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full transition-colors", showTable ? "bg-indigo-500" : "bg-slate-700")} />
          {showTable ? t('media.hideTable') : t('media.showTable')}
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

