import React from 'react';
import {
  LayoutDashboard,
  Database,
  SearchCode,
  FileSpreadsheet,
  ShieldCheck,
  AlertTriangle,
  LineChart,
  CheckSquare,
  Sliders,
  Shield,
  Activity
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'datasources'
  | 'scandata'
  | 'inventory'
  | 'purposeretention'
  | 'evidencegaps'
  | 'evaluation'
  | 'reviewcenter'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  backendHealthy: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, backendHealthy }) => {
  const navItems: Array<{ id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'datasources', label: 'Data Sources', icon: Database },
    { id: 'scandata', label: 'Scan Data', icon: SearchCode },
    { id: 'inventory', label: 'Evidence Inventory', icon: FileSpreadsheet },
    { id: 'purposeretention', label: 'Purpose & Retention', icon: ShieldCheck },
    { id: 'evidencegaps', label: 'Evidence Gaps', icon: AlertTriangle },
    { id: 'evaluation', label: 'Evaluation & Accuracy', icon: LineChart },
    { id: 'reviewcenter', label: 'Review Center', icon: CheckSquare },
    { id: 'settings', label: 'Configurable Rules', icon: Sliders },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
          <Shield className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
            PrivacyLens
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-sky-950 text-sky-400 border border-sky-800">
              v1.0
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">PII Discovery & Inventory</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Core Workflows
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            Scanner Engine
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            backendHealthy
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              : 'bg-rose-950 text-rose-400 border border-rose-800'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${backendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
            {backendHealthy ? 'Online' : 'Offline'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
          AIORI PS-019 • Technical Evidence
        </p>
      </div>
    </aside>
  );
};
