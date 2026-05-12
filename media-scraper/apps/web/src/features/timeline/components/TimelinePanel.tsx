import React, { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Activity, CheckCircle, Play, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useSSE, type RealtimeEvent } from '@/features/jobs/hooks/useSSE';
import { cn } from '@/lib/utils';

type TimelineItem = RealtimeEvent & {
  timestamp: Date;
  id: string;
};

export const TimelinePanel = (): React.ReactElement => {
  const [events, setEvents] = useState<TimelineItem[]>([]);

  const onEvent = useCallback((evt: RealtimeEvent) => {
    setEvents((prev) => [
      { ...evt, timestamp: new Date(), id: Math.random().toString(36).substring(7) },
      ...prev.slice(0, 49) // Keep last 50 events
    ]);
  }, []);

  useSSE({ enabled: true, onEvent });

  return (
    <section className="flex flex-col h-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md shadow-2xl">
      <div className="flex items-center gap-2 border-b border-slate-800 p-4">
        <Activity className="h-5 w-5 text-indigo-400" />
        <h2 className="text-lg font-semibold text-slate-100">Live Activity</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2 opacity-60">
            <Activity className="h-8 w-8 animate-pulse" />
            <p className="text-sm">Waiting for activity...</p>
          </div>
        ) : (
          events.map((evt) => (
            <div key={evt.id} className="flex gap-3 group">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "p-1.5 rounded-full",
                  evt.type === 'JOB_STARTED' && "bg-blue-500/20 text-blue-400",
                  evt.type === 'JOB_COMPLETED' && "bg-emerald-500/20 text-emerald-400",
                  evt.type === 'JOB_FAILED' && "bg-red-500/20 text-red-400",
                  evt.type === 'MEDIA_INSERTED' && "bg-indigo-500/20 text-indigo-400"
                )}>
                  {evt.type === 'JOB_STARTED' && <Play className="h-3.5 w-3.5 fill-current" />}
                  {evt.type === 'JOB_COMPLETED' && <CheckCircle className="h-3.5 w-3.5" />}
                  {evt.type === 'JOB_FAILED' && <AlertCircle className="h-3.5 w-3.5" />}
                  {evt.type === 'MEDIA_INSERTED' && <ImageIcon className="h-3.5 w-3.5" />}
                </div>
                <div className="w-px h-full bg-slate-800 my-1 group-last:hidden" />
              </div>
              
              <div className="flex-1 min-w-0 pt-0.5 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-200">
                    {evt.type === 'JOB_STARTED' && "Scrape Started"}
                    {evt.type === 'JOB_COMPLETED' && "Scrape Finished"}
                    {evt.type === 'JOB_FAILED' && "Scrape Failed"}
                    {evt.type === 'MEDIA_INSERTED' && "Media Discovered"}
                  </p>
                  <time className="text-[10px] text-slate-500 whitespace-nowrap">
                    {formatDistanceToNow(evt.timestamp, { addSuffix: true })}
                  </time>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {evt.type === 'MEDIA_INSERTED' 
                    ? `Found ${evt.count} items for job ${evt.jobId.slice(-6)}`
                    : `Job ${evt.jobId.slice(-6)}`}
                </p>
                {evt.type === 'JOB_FAILED' && evt.error && (
                  <p className="mt-1 text-[10px] text-red-400 leading-relaxed rounded bg-red-500/10 p-1.5 border border-red-500/20">
                    {evt.error}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
