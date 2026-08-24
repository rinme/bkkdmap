import React from 'react';
import { ViewMode } from '@/lib/types';
import { Map, List, BarChart3 } from 'lucide-react';

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  const views: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'map', label: 'Map View', icon: <Map className="w-4 h-4" /> },
    { id: 'list', label: 'District List', icon: <List className="w-4 h-4" /> },
    { id: 'stats', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> }
  ];

  return (
    <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner">
      {views.map((v) => {
        const isActive = currentView === v.id;
        return (
          <button
            key={v.id}
            onClick={() => onViewChange(v.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isActive
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {v.icon}
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        );
      })}
    </div>
  );
};
