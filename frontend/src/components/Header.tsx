import React from 'react';
import { Download, FileText, AlertCircle, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  onRefresh?: () => void;
  showExportButtons?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onRefresh, showExportButtons = true }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
            <ShieldAlert className="w-3 h-3 text-amber-600" />
            Human Review Required
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center flex-wrap gap-2.5">
        {showExportButtons && (
          <>
            <a
              href="/api/reports/inventory.csv"
              download="privacylens_inventory.csv"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors shadow-sm"
              title="Export complete inventory to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              Inventory CSV
            </a>

            <a
              href="/api/reports/gaps.csv"
              download="privacylens_gaps.csv"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-300 transition-colors shadow-sm"
              title="Export identified evidence gaps"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
              Gaps CSV
            </a>

            <a
              href="/api/reports/inventory.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors shadow-sm shadow-sky-600/20"
              title="Download formal technical PDF report"
            >
              <FileText className="w-3.5 h-3.5" />
              Export PDF
            </a>
          </>
        )}
      </div>
    </header>
  );
};
