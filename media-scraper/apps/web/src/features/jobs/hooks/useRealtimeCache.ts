import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { JobsResponse, ScrapeJob, ScrapeJobStatus } from '@/lib/api';
import type { RealtimeEvent } from '@/features/jobs/hooks/useSSE';

const patchJob = (job: ScrapeJob, evt: RealtimeEvent): ScrapeJob => {
  if (job.id !== evt.jobId) return job;
  if (evt.type === 'JOB_STARTED') return { ...job, status: 'processing' };
  if (evt.type === 'JOB_COMPLETED') return { ...job, status: 'completed', error: null };
  if (evt.type === 'JOB_FAILED') return { ...job, status: 'failed', error: evt.error ?? job.error };
  return job;
};

export const useRealtimeCache = () => {
  const queryClient = useQueryClient();

  const onEvent = useCallback(
    (evt: RealtimeEvent) => {
      // Update jobs lists in-cache (no refetch)
      if (evt.type === 'JOB_STARTED' || evt.type === 'JOB_COMPLETED' || evt.type === 'JOB_FAILED') {
        queryClient.setQueriesData({ queryKey: ['jobs'], exact: false }, (old) => {
          const data = old as JobsResponse | undefined;
          if (!data) return old;
          return {
            ...data,
            items: data.items.map((j) => patchJob(j, evt))
          };
        });

        // Update job detail cache if present
        queryClient.setQueryData(['job', evt.jobId], (old) => {
          const data = old as (ScrapeJob & { media: unknown[] }) | undefined;
          if (!data) return old;
          return patchJob(data, evt);
        });
      }

      if (evt.type === 'MEDIA_INSERTED') {
        // Job detail media list is server-derived; invalidate only that job detail if active.
        // This is targeted and event-driven (no polling).
        queryClient.invalidateQueries({ queryKey: ['job', evt.jobId], exact: true, refetchType: 'active' });
        // Media gallery is paginated/searchable; safest is targeted invalidation for active media queries only.
        queryClient.invalidateQueries({ queryKey: ['media'], exact: false, refetchType: 'active' });
      }
    },
    [queryClient]
  );

  return { onEvent };
};

