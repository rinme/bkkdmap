import React from 'react';
import { ViewMode } from '@/lib/types';
import { Map, List, BarChart3 } from 'lucide-react';

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  const views: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'map', label: 'Map', icon: <Map className="w-3.5 h-3.5" /> },
    { id: 'list', label: 'Districts', icon: <List className="w-3.5 h-3.5" /> },
    { id: 'stats', label: 'Passport', icon: <BarChart3 className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="inline-flex items-center bg-[#0d1424]/90 p-1 rounded-2xl border border-white/[0.08] shadow-inner backdrop-blur-md">
      {views.map((v) => {
        const isActive = currentView === v.id;
        return (
          <button
            key={v.id}
            onClick={() => onViewChange(v.id)}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            {v.icon}
            <span>{v.label}</span>
          </button>
        );
      })}
    </div>
  );
};

