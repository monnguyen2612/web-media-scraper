import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitScrape } from '@/lib/api';

export const useSubmitScrape = (urlsText: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const urls = urlsText
        .split(/\r?\n|,/g)
        .map((u) => u.trim())
        .filter(Boolean);
      return submitScrape(urls);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
    }
  });
};

