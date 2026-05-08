import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { startTransition, useDeferredValue, useEffect } from 'react';
import { getMedia, type MediaType } from '@/lib/api';

const pageSize = 24;

export const useMedia = (args: {
  enabled: boolean;
  page: number;
  setPage: (updater: (old: number) => number) => void;
  searchInput: string;
  type: MediaType | '';
}) => {
  const queryClient = useQueryClient();
  const search = useDeferredValue(args.searchInput).trim();

  const query = useQuery({
    queryKey: ['media', args.page, search, args.type],
    queryFn: () =>
      getMedia({
        page: args.page,
        limit: pageSize,
        search: search || undefined,
        type: args.type || undefined
      }),
    enabled: args.enabled,
    staleTime: 15000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    retry: 1
  });

  useEffect(() => {
    if (!args.enabled) return;
    if (!query.data || args.page >= query.data.totalPages) return;
    const nextPage = args.page + 1;
    void queryClient.prefetchQuery({
      queryKey: ['media', nextPage, search, args.type],
      queryFn: () =>
        getMedia({
          page: nextPage,
          limit: pageSize,
          search: search || undefined,
          type: args.type || undefined
        }),
      staleTime: 15000
    });
  }, [args.enabled, args.page, args.type, query.data, queryClient, search]);

  const goPrev = () =>
    startTransition(() => {
      args.setPage((p) => Math.max(1, p - 1));
    });

  const goNext = () =>
    startTransition(() => {
      const totalPages = query.data?.totalPages ?? 1;
      args.setPage((p) => Math.min(totalPages, p + 1));
    });

  return { query, items: query.data?.items ?? [], totalPages: query.data?.totalPages ?? 1, goPrev, goNext };
};

