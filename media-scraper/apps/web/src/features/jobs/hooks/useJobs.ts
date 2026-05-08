import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDeferredValue } from 'react';
import { getJobs, type ScrapeJobStatus } from '@/lib/api';

export const useJobs = (args: {
  enabled: boolean;
  page: number;
  limit: number;
  status: ScrapeJobStatus | '';
  searchInput: string;
}) => {
  const search = useDeferredValue(args.searchInput).trim();
  return useQuery({
    queryKey: ['jobs', args.page, args.status, search],
    queryFn: () =>
      getJobs({
        page: args.page,
        limit: args.limit,
        status: args.status || undefined,
        search: search || undefined
      }),
    enabled: args.enabled,
    staleTime: 2000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    retry: 1
  });
};

