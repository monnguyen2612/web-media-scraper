import React from 'react';
import { 
  PlusCircle, 
  ListTodo, 
  Image as ImageIcon, 
  Activity 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabType = 'submit' | 'jobs' | 'media' | 'timeline';

interface SidebarNavProps {
  activeTab: TabType;
  setTab: (tab: TabType) => void;
}

export const SidebarNav = ({ activeTab, setTab }: SidebarNavProps): React.ReactElement => {
  const navItems = [
    { id: 'submit', label: 'Submit Scrape', icon: PlusCircle },
    { id: 'jobs', label: 'Recent Jobs', icon: ListTodo },
    { id: 'media', label: 'Media Library', icon: ImageIcon },
    { id: 'timeline', label: 'Live Activity', icon: Activity },
  ] as const;

  return (
    <aside className="w-64 flex flex-col border-r border-slate-800 bg-slate-950/50 backdrop-blur-xl h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
          <ImageIcon className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">MediaScraper</h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Navigation</p>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
              activeTab === item.id 
                ? "bg-indigo-600/10 text-indigo-400 shadow-[inset_0_0_0_1px_rgba(79,70,229,0.2)]" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
              activeTab === item.id ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
            )} />
            {item.label}
            {activeTab === item.id && (
              <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800/50">
        <div className="rounded-xl bg-slate-900/50 p-4 border border-slate-800/50">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Status</p>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <span className="text-xs text-slate-300 font-medium">System Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
