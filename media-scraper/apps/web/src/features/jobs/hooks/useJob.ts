import { useQuery } from '@tanstack/react-query';
import { getJob } from '@/lib/api';

export const useJob = (args: { enabled: boolean; jobId: string | null }) =>
  useQuery({
    queryKey: ['job', args.jobId],
    queryFn: () => getJob(args.jobId!),
    enabled: args.enabled && Boolean(args.jobId),
    staleTime: 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });

