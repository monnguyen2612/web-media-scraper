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
    <section className="rounded-md border border-slate-800 bg-slate-900 p-4">
      <h2 className="mb-2 text-lg font-semibold">Submit URLs to scrape</h2>
      <p className="mb-3 text-sm text-slate-300">
        Paste one URL per line (or comma-separated). Requests are queued; scraping happens asynchronously.
      </p>
      <textarea
        value={urlsText}
        onChange={(e) => setUrlsText(e.target.value)}
        rows={8}
        className="w-full rounded-md border border-slate-700 bg-slate-950 p-3 font-mono text-sm"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          className="rounded-md bg-indigo-600 px-3 py-2 disabled:opacity-50"
          disabled={submitMutation.isPending}
          onClick={() => submitMutation.mutate()}
        >
          {submitMutation.isPending ? 'Submitting…' : 'Submit'}
        </button>
        {submitMutation.isSuccess ? (
          <span className="text-sm text-slate-300">
            Accepted: <b>{submitMutation.data.accepted}</b>
          </span>
        ) : null}
        {submitMutation.isError ? (
          <span className="text-sm text-red-400">Submit failed. Check URLs and try again.</span>
        ) : null}
      </div>
    </section>
  );
};

