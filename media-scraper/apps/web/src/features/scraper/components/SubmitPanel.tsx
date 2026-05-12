import type React from 'react';
import { useSubmitScrape } from '@/features/scraper/hooks/useSubmitScrape';

export const SubmitPanel = ({
  urlsText,
  setUrlsText
}: {
  urlsText: string;
  setUrlsText: (v: string) => void;
}): React.ReactElement => {
  const submitMutation = useSubmitScrape(urlsText);

  return (
    <section className="glass-panel p-6 rounded-2xl animate-slide-up">
      <h2 className="mb-2 text-xl font-bold text-white">Submit URLs to scrape</h2>
      <p className="mb-6 text-sm text-slate-400">
        Paste one URL per line (or comma-separated). Requests are queued; scraping happens asynchronously.
      </p>
      <textarea
        value={urlsText}
        onChange={(e) => setUrlsText(e.target.value)}
        rows={8}
        placeholder="https://example.com"
        className="w-full rounded-xl border border-slate-800 bg-slate-950/50 p-4 font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all"
      />
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 font-medium shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          disabled={submitMutation.isPending}
          onClick={() => submitMutation.mutate()}
        >
          {submitMutation.isPending ? 'Submitting…' : 'Submit URLs'}
        </button>
        {submitMutation.isSuccess ? (
          <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            Accepted {submitMutation.data.accepted} jobs
          </div>
        ) : null}
        {submitMutation.isError ? (
          <span className="text-sm text-red-400 font-medium">Submit failed. Check URLs and try again.</span>
        ) : null}
      </div>
    </section>
  );
};

