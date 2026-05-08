import type React from 'react';
import { useState } from 'react';
import { JobsPanel } from '@/features/jobs/components/JobsPanel';
import { MediaPanel } from '@/features/media/components/MediaPanel';
import { SubmitPanel } from '@/features/scraper/components/SubmitPanel';
import { TabsNav } from '@/components/TabsNav';

export const Dashboard = (): React.ReactElement => {
  const [tab, setTab] = useState<'submit' | 'jobs' | 'media'>('submit');
  const [urlsText, setUrlsText] = useState('https://example.com');

  return (
    <main className="mx-auto min-h-screen max-w-7xl p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">Media Scraper Dashboard</h1>
        <p className="text-slate-300">Submit URLs, monitor jobs, and browse scraped media.</p>
      </header>

      <TabsNav tab={tab} setTab={setTab} />

      {tab === 'submit' ? <SubmitPanel urlsText={urlsText} setUrlsText={setUrlsText} /> : null}
      {tab === 'jobs' ? <JobsPanel /> : null}
      {tab === 'media' ? <MediaPanel /> : null}
    </main>
  );
};
