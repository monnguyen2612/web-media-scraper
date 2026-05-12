import { useEffect, useRef } from 'react';

export type RealtimeEvent =
  | { type: 'JOB_STARTED'; jobId: string }
  | { type: 'JOB_COMPLETED'; jobId: string }
  | { type: 'JOB_FAILED'; jobId: string; error?: string }
  | { type: 'MEDIA_INSERTED'; jobId: string; count: number };

export const useSSE = (args: {
  enabled: boolean;
  jobId?: string;
  onEvent: (evt: RealtimeEvent) => void;
}) => {
  const onEventRef = useRef(args.onEvent);
  onEventRef.current = args.onEvent;

  useEffect(() => {
    if (!args.enabled) return;

    const base = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
    const url = args.jobId ? `${base}/events/jobs/${encodeURIComponent(args.jobId)}` : `${base}/events`;
    const es = new EventSource(url);

    const handler = (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data) as RealtimeEvent;
        onEventRef.current(parsed);
      } catch {
        // ignore invalid payload
      }
    };

    es.addEventListener('JOB_STARTED', handler);
    es.addEventListener('JOB_COMPLETED', handler);
    es.addEventListener('JOB_FAILED', handler);
    es.addEventListener('MEDIA_INSERTED', handler);

    es.onerror = (err) => {
      console.error('SSE Connection Error:', err);
    };

    return () => {
      es.close();
    };
  }, [args.enabled, args.jobId]);
};

