import type React from 'react';
import { useState } from 'react';
import { JobsPanel } from '@/features/jobs/components/JobsPanel';
import { MediaPanel } from '@/features/media/components/MediaPanel';
import { SubmitPanel } from '@/features/scraper/components/SubmitPanel';
import { TimelinePanel } from '@/features/timeline/components/TimelinePanel';
import { SidebarNav, type TabType } from '@/components/SidebarNav';
import { useTranslation } from 'react-i18next';

export const Dashboard = (): React.ReactElement => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabType>('submit');
  const [urlsText, setUrlsText] = useState('https://example.com');

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      <SidebarNav activeTab={tab} setTab={setTab} />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="px-8 py-6 border-b border-slate-800/50 bg-slate-950/20 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {tab === 'submit' && t('sidebar.submitScrape')}
                {tab === 'jobs' && t('sidebar.recentJobs')}
                {tab === 'media' && t('sidebar.mediaLibrary')}
                {tab === 'timeline' && t('sidebar.liveActivity')}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {t(`sidebar.desc.${tab}`)}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Optional header actions */}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-8">
          <div className="max-w-6xl mx-auto h-full">
            {tab === 'submit' && <SubmitPanel urlsText={urlsText} setUrlsText={setUrlsText} />}
            {tab === 'jobs' && <JobsPanel />}
            {tab === 'media' && <MediaPanel />}
            {tab === 'timeline' && (
              <div className="h-[calc(100vh-200px)]">
                <TimelinePanel />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
