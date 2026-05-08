import type React from 'react';
import { startTransition, useState } from 'react';
import type { ScrapeJob, ScrapeJobStatus } from '@/lib/api';
import { useJob } from '@/features/jobs/hooks/useJob';
import { useJobs } from '@/features/jobs/hooks/useJobs';
import { useRealtimeCache } from '@/features/jobs/hooks/useRealtimeCache';
import { useSSE } from '@/features/jobs/hooks/useSSE';
import { useRetryJob } from '@/features/jobs/hooks/useRetryJob';

export const JobsPanel = (): React.ReactElement => {
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
    <section className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-md border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            value={jobsSearchInput}
            onChange={(e) =>
              startTransition(() => {
                setJobsPage(1);
                setJobsSearchInput(e.target.value);
              })
            }
            placeholder="Search by URL"
            className="flex-1 min-w-64 rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
          />
          <select
            value={jobsStatus}
            onChange={(e) =>
              startTransition(() => {
                setJobsPage(1);
                setJobsStatus(e.target.value as ScrapeJobStatus | '');
              })
            }
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
          >
            <option value="">All statuses</option>
            <option value="pending">pending</option>
            <option value="processing">processing</option>
            <option value="completed">completed</option>
            <option value="failed">failed</option>
          </select>
          <button
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            onClick={() => jobsQuery.refetch()}
            disabled={jobsQuery.isFetching}
          >
            Refresh
          </button>
        </div>

        {jobsQuery.isLoading ? <p>Loading jobs…</p> : null}
        {jobsQuery.isError ? <p className="text-red-400">Failed to load jobs.</p> : null}
        {jobsQuery.isFetching && !jobsQuery.isLoading ? (
          <p className="mb-2 text-xs text-slate-400">Updating…</p>
        ) : null}

        {!jobsQuery.isLoading && !jobsQuery.isError && jobsData ? (
          <>
            <div className="divide-y divide-slate-800">
              {jobsData.items.map((j: ScrapeJob) => (
                <button
                  key={j.id}
                  className={`w-full text-left p-3 hover:bg-slate-950/50 ${
                    selectedJobId === j.id ? 'bg-slate-950/50' : ''
                  }`}
                  onClick={() => setSelectedJobId(j.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="truncate text-sm text-slate-200">{j.url}</div>
                    <div
                      className={`rounded px-2 py-1 text-xs ${
                        j.status === 'failed'
                          ? 'bg-red-950 text-red-200'
                          : j.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-200'
                            : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {j.status}
                    </div>
                  </div>
                  {j.error ? <div className="mt-1 truncate text-xs text-red-300">{j.error}</div> : null}
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                className="rounded bg-slate-800 px-3 py-1 disabled:opacity-50"
                disabled={jobsPage <= 1}
                onClick={() =>
                  startTransition(() => {
                    setJobsPage((p) => Math.max(1, p - 1));
                  })
                }
              >
                Prev
              </button>
              <div className="text-sm text-slate-300">
                {jobsPage} / {jobsData.totalPages}
              </div>
              <button
                className="rounded bg-slate-800 px-3 py-1 disabled:opacity-50"
                disabled={jobsPage >= jobsData.totalPages}
                onClick={() =>
                  startTransition(() => {
                    setJobsPage((p) => Math.min(jobsData.totalPages, p + 1));
                  })
                }
              >
                Next
              </button>
            </div>
          </>
        ) : null}
      </div>

      <div className="rounded-md border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-2 text-lg font-semibold">Job details</h2>
        {!selectedJobId ? <p className="text-sm text-slate-300">Select a job to view details.</p> : null}
        {jobQuery.isLoading ? <p>Loading job…</p> : null}
        {jobQuery.isError ? <p className="text-red-400">Failed to load job.</p> : null}

        {jobQuery.data ? (
          <div className="space-y-2 text-sm">
            <div className="break-all text-slate-200">{jobQuery.data.url}</div>
            <div className="text-slate-300">
              Status: <b>{jobQuery.data.status}</b>
              {jobQuery.isFetching ? <span className="ml-2 text-xs text-slate-400">(live)</span> : null}
            </div>
            {jobQuery.data.error ? (
              <div className="rounded bg-red-950 p-2 text-red-200">{jobQuery.data.error}</div>
            ) : null}
            <button
              className="rounded-md bg-indigo-600 px-3 py-2 disabled:opacity-50"
              disabled={retryMutation.isPending || jobQuery.data.status !== 'failed'}
              onClick={() => retryMutation.mutate(jobQuery.data.id)}
            >
              Retry failed job
            </button>
            <div className="pt-2">
              <div className="mb-1 text-xs uppercase text-slate-400">Latest media (up to 20)</div>
              <div className="space-y-1">
                {jobQuery.data.media.map((m) => (
                  <div key={m.id} className="truncate text-xs text-slate-300">
                    [{m.type}] {m.mediaUrl}
                  </div>
                ))}
                {jobQuery.data.media.length === 0 ? (
                  <div className="text-xs text-slate-500">No media for this job.</div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

