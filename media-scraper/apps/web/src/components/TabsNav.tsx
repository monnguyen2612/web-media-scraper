import type React from 'react';

export const TabsNav = ({
  tab,
  setTab
}: {
  tab: 'submit' | 'jobs' | 'media';
  setTab: (t: 'submit' | 'jobs' | 'media') => void;
}): React.ReactElement => (
  <nav className="mb-6 flex flex-wrap gap-2">
    {(['submit', 'jobs', 'media'] as const).map((t) => (
      <button
        key={t}
        className={`rounded-md px-3 py-2 text-sm ${
          tab === t ? 'bg-indigo-600' : 'border border-slate-700 bg-slate-900'
        }`}
        onClick={() => setTab(t)}
      >
        {t === 'submit' ? 'Submit' : t === 'jobs' ? 'Jobs' : 'Media'}
      </button>
    ))}
  </nav>
);

