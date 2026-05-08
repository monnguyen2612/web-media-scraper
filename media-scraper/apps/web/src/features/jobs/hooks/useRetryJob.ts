import { useMutation, useQueryClient } from '@tanstack/react-query';
import { retryJob } from '@/lib/api';

export const useRetryJob = (selectedJobId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => retryJob(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
      if (selectedJobId) void queryClient.invalidateQueries({ queryKey: ['job', selectedJobId] });
    }
  });
};

