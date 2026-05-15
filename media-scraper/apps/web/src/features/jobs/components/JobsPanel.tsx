import type React from 'react';
import { startTransition, useState } from 'react';
import type { ScrapeJob, ScrapeJobStatus } from '@/lib/api';
import { useJob } from '@/features/jobs/hooks/useJob';
import { useJobs } from '@/features/jobs/hooks/useJobs';
import { useRealtimeCache } from '@/features/jobs/hooks/useRealtimeCache';
import { useSSE } from '@/features/jobs/hooks/useSSE';
import { useRetryJob } from '@/features/jobs/hooks/useRetryJob';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const mapErrorMessage = (error: string | null): string | null => {
  if (!error) return null;
  if (error.includes('Only HTTP/S URLs are allowed')) return 'errors.onlyHttp';
  if (error.includes('Localhost is blocked')) return 'errors.localhostBlocked';
  if (error.includes('Private/internal IP targets are blocked')) return 'errors.privateIpBlocked';
  if (error.includes('timeout')) return 'errors.timeout';
  if (error.includes('status code')) return 'errors.fetchFailed';
  return error;
};

export const JobsPanel = (): React.ReactElement => {
  const { t } = useTranslation();
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsStatus, setJobsStatus] = useState<ScrapeJobStatus | ''>('');
  const [jobsSearchInput, setJobsSearchInput] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const { onEvent } = useRealtimeCache();
  useSSE({ enabled: true, onEvent });

  const jobsQuery = useJobs({
    enabled: true,
    page: jobsPage,
    limit: 25,
    status: jobsStatus,
    searchInput: jobsSearchInput
  });
  const jobsData = jobsQuery.data;

  const jobQuery = useJob({ enabled: true, jobId: selectedJobId });
  const retryMutation = useRetryJob(selectedJobId);

  return (
    <section className="grid gap-6 lg:grid-cols-3 h-full animate-slide-up">
      <div className="lg:col-span-2 glass-panel rounded-2xl flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('jobs.title')}</h2>
          <div className="h-3 w-[1px] bg-slate-800 mx-1" />
          <input
            type="text"
            placeholder={t('jobs.searchPlaceholder')}
            className="flex-1 bg-transparent border-none text-xs text-slate-300 placeholder:text-slate-600 focus:ring-0"
            value={jobsSearchInput}
            onChange={(e) => {
              setJobsSearchInput(e.target.value);
              startTransition(() => {
                setJobsPage(1);
              });
            }}
          />
          <select
            value={jobsStatus}
            onChange={(e) =>
              startTransition(() => {
                setJobsPage(1);
                setJobsStatus(e.target.value as ScrapeJobStatus | '');
              })
            }
            className="rounded-xl border border-slate-800 bg-slate-950 pl-4 pr-10 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[right_1rem_center] bg-no-repeat"
          >
            <option value="">{t('jobs.status.allStatuses') || 'All statuses'}</option>
            <option value="pending">{t('jobs.status.pending')}</option>
            <option value="processing">{t('jobs.status.processing')}</option>
            <option value="completed">{t('jobs.status.completed')}</option>
            <option value="failed">{t('jobs.status.failed')}</option>
          </select>
          <button
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
            onClick={() => jobsQuery.refetch()}
            disabled={jobsQuery.isFetching}
          >
            {jobsQuery.isFetching ? 'Updating...' : 'Refresh'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {jobsQuery.isLoading ? <div className="p-8 text-center text-slate-500">Loading jobs…</div> : null}
          {jobsQuery.isError ? <div className="p-8 text-center text-red-400">Failed to load jobs.</div> : null}

          {!jobsQuery.isLoading && !jobsQuery.isError && jobsData ? (
            <div className="divide-y divide-slate-800/50">
              {jobsData.items.map((j: ScrapeJob) => (
                <button
                  key={j.id}
                  className={cn(
                    "w-full text-left p-4 transition-all duration-200 border-l-4",
                    selectedJobId === j.id
                      ? "bg-indigo-600/5 border-indigo-500 shadow-[inset_0_0_20px_rgba(79,70,229,0.05)]"
                      : "border-transparent hover:bg-slate-900/40 hover:border-slate-700"
                  )}
                  onClick={() => setSelectedJobId(j.id)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="truncate text-sm font-medium text-slate-300">{j.url}</div>
                    <div
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        j.status === 'failed' && "bg-red-500/10 text-red-400 border border-red-500/20",
                        j.status === 'completed' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                        j.status === 'processing' && "bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse",
                        j.status === 'pending' && "bg-slate-800 text-slate-400 border border-slate-700"
                      )}
                    >
                      {j.status}
                    </div>
                  </div>
                  {j.error ? <div className="mt-2 text-[11px] text-red-400/80 bg-red-500/5 p-2 rounded border border-red-500/10 truncate">{j.error}</div> : null}
                  <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-2">
                    <span>ID: {j.id.slice(0, 8)}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-700" />
                    <span>Updated just now</span>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="p-4 border-t border-slate-800/50 bg-slate-950/30 flex items-center justify-between">
          <button
            className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-50 transition-all"
            disabled={jobsPage <= 1}
            onClick={() =>
              startTransition(() => {
                setJobsPage((p) => Math.max(1, p - 1));
              })
            }
          >
            Prev
          </button>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Page {jobsPage} / {jobsData?.totalPages || 1}
          </div>
          <button
            className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-50 transition-all"
            disabled={jobsPage >= (jobsData?.totalPages || 1)}
            onClick={() =>
              startTransition(() => {
                setJobsPage((p) => Math.min(jobsData?.totalPages || 1, p + 1));
              })
            }
          >
            Next
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 flex flex-col min-h-0 overflow-hidden">
        <h2 className="mb-4 text-lg font-bold text-white flex items-center gap-2">
          Job Details
          {jobQuery.isFetching && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />}
        </h2>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {!selectedJobId ? <div className="flex flex-col items-center justify-center h-48 text-slate-600 italic text-sm">{t('jobs.selectJob')}</div> : null}
          {jobQuery.isLoading ? <div className="p-4 text-center text-slate-500">{t('jobs.loadingDetails')}</div> : null}

          {jobQuery.data ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('jobs.targetUrl')}</p>
                <div className="break-all text-sm text-slate-300 font-medium leading-relaxed">{jobQuery.data.url}</div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-sm text-slate-400">{t('jobs.currentStatus')}</div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                  jobQuery.data.status === 'completed' ? "text-emerald-400 bg-emerald-400/10" : "text-indigo-400 bg-indigo-400/10"
                )}>
                  {t(`jobs.status.${jobQuery.data.status}`)}
                </div>
              </div>

              {jobQuery.data.error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-300 leading-relaxed">
                  <p className="font-bold uppercase text-[9px] mb-1 opacity-60">{t('jobs.errorTrace')}</p>
                  {t(mapErrorMessage(jobQuery.data.error) || 'errors.unknown')}
                </div>
              )}

              <button
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 text-sm font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-30"
                disabled={retryMutation.isPending || jobQuery.data.status !== 'failed'}
                onClick={() => retryMutation.mutate(jobQuery.data.id)}
              >
                {t('jobs.retryProcessing')}
              </button>

              <div className="pt-4 border-t border-slate-800/50">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('jobs.mediaSample')}</p>
                  <span className="text-[10px] text-slate-500 font-mono">{t('jobs.items', { count: jobQuery.data.media.length })}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {jobQuery.data.media.map((m) => (
                    <div key={m.id} className="group relative aspect-square rounded-lg bg-slate-950 border border-slate-800 overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-700 uppercase font-bold">
                        {m.type}
                      </div>
                      <img
                        src={m.mediaUrl}
                        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                        onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                      />
                    </div>
                  ))}
                </div>

                {jobQuery.data.media.length === 0 ? (
                  <div className="p-8 text-center text-[11px] text-slate-600 italic border border-dashed border-slate-800 rounded-xl">
                    No media discovered yet
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

