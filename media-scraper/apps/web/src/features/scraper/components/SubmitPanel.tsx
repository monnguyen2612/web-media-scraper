import type React from 'react';
import { useSubmitScrape } from '@/features/scraper/hooks/useSubmitScrape';
import { useTranslation } from 'react-i18next';

export const SubmitPanel = ({
  urlsText,
  setUrlsText
}: {
  urlsText: string;
  setUrlsText: (v: string) => void;
}): React.ReactElement => {
  const { t } = useTranslation();
  const submitMutation = useSubmitScrape(urlsText);

  return (
    <section className="glass-panel p-6 rounded-2xl animate-slide-up">
      <h2 className="mb-2 text-xl font-bold text-white">{t('scraper.title')}</h2>
      <p className="mb-6 text-sm text-slate-400">
        {t('scraper.description')}
      </p>
      <textarea
        value={urlsText}
        onChange={(e) => setUrlsText(e.target.value)}
        rows={8}
        placeholder={t('scraper.placeholder')}
        className="w-full rounded-xl border border-slate-800 bg-slate-950/50 p-4 font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all"
      />
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 font-medium shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          disabled={submitMutation.isPending}
          onClick={() => submitMutation.mutate()}
        >
          {submitMutation.isPending ? t('scraper.submitting') : t('scraper.submit')}
        </button>
        {submitMutation.isSuccess ? (
          <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            {t('scraper.accepted', { count: submitMutation.data.accepted })}
          </div>
        ) : null}
        {submitMutation.isError ? (
          <span className="text-sm text-red-400 font-medium">{t('scraper.failed')}</span>
        ) : null}
      </div>
    </section>
  );
};

