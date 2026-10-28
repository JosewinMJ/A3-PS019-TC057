import React, { useEffect, useState } from 'react';
import {
  ShieldAlert, Database, FileSpreadsheet, CheckCircle2,
  Clock, AlertTriangle, ArrowUpRight, Play, RefreshCw, BarChart2
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardMetrics } from '../types';
import { NavTab } from '../components/Sidebar';

interface DashboardPageProps {
  onNavigate: (tab: NavTab) => void;
}

const CLASS_COLORS: Record<string, string> = {
  person_name: '#6366f1',
  email_address: '#0ea5e9',
  phone_number: '#10b981',
  government_id: '#a855f7',
  date_of_birth: '#f59e0b',
};

const CLASS_LABELS: Record<string, string> = {
  person_name: 'Person Name',
  email_address: 'Email Address',
  phone_number: 'Phone Number',
  government_id: 'Gov ID (Aadhaar/PAN)',
  date_of_birth: 'Date of Birth',
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Aggregating privacy evidence inventory metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center max-w-lg mx-auto">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-rose-900 mb-1">Failed to Connect to PrivacyLens Backend</h3>
          <p className="text-xs text-rose-700 mb-4">{error}</p>
          <button
            onClick={fetchMetrics}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Format chart data
  const classChartData = Object.entries(data.class_counts).map(([k, v]) => ({
    key: k,
    name: CLASS_LABELS[k] || k,
    count: v,
    color: CLASS_COLORS[k] || '#94a3b8',
  }));

  const confChartData = Object.entries(data.confidence_distribution).map(([k, v]) => ({
    name: k,
    value: v,
  }));

  const CONF_COLORS = ['#f59e0b', '#0284c7', '#10b981'];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome / Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-700/50">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
            AIORI Hackathon 3 • PS-019
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            PrivacyLens Personal-Data Discovery & Evidence Inventory
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Evidence-based candidate detection across CSVs and SQLite databases. Links candidate fields to declared business purposes and retention rules for human-in-the-loop governance.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('scandata')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-600/30 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Launch Scanner
          </button>
          <button
            onClick={() => onNavigate('datasources')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-600 transition-all"
          >
            <Database className="w-3.5 h-3.5" />
            Manage Data Sources
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Datasets
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{data.total_datasets}</span>
            <Database className="w-4 h-4 text-sky-600" />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">In local repository</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Tables Inspected
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{data.total_tables}</span>
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Across all sources</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Candidate PII
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-sky-600">{data.total_candidates}</span>
            <ShieldAlert className="w-4 h-4 text-sky-600" />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Discovered fields</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200/80 bg-amber-50/20 shadow-sm">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
            Missing Purpose
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-800">{data.missing_purpose}</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-[11px] text-amber-700/80 mt-1 block">Needs declared use</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-orange-200/80 bg-orange-50/20 shadow-sm">
          <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider block mb-1">
            Missing Retention
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-orange-800">{data.missing_retention}</span>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <span className="text-[11px] text-orange-700/80 mt-1 block">Needs retention rule</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200/80 bg-rose-50/20 shadow-sm">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block mb-1">
            Missing Both
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-rose-700">{data.missing_both}</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-[11px] text-rose-700/80 mt-1 block">Critical evidence gap</span>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Personal Data Class Distribution</h3>
              <p className="text-xs text-slate-500">Breakdown of candidate personal data fields detected by scanner</p>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              View Inventory <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full flex flex-col justify-end pt-4 pb-2">
            <div className="flex-1 flex items-end justify-between gap-3 px-2 border-b border-slate-200">
              {classChartData.map((item) => {
                const maxVal = Math.max(...classChartData.map(c => c.count), 1);
                const barHeight = Math.max((item.count / maxVal) * 150, item.count > 0 ? 12 : 4);
                return (
                  <div key={item.key} className="flex-1 flex flex-col items-center group relative">
                    <span className="text-[11px] font-mono font-bold text-slate-700 mb-1 opacity-90 group-hover:text-sky-600 transition">
                      {item.count}
                    </span>
                    <div
                      className="w-full max-w-[48px] rounded-t-lg transition-all duration-300 hover:brightness-110 shadow-sm"
                      style={{
                        height: `${barHeight}px`,
                        backgroundColor: item.color
                      }}
                      title={`${item.name}: ${item.count} detections`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex items-start justify-between gap-3 px-2 pt-2 text-[10px] font-medium text-slate-500">
              {classChartData.map((item) => (
                <div key={item.key} className="flex-1 text-center truncate" title={item.name}>
                  {item.name.split(' ')[0]}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Confidence Breakdown Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Confidence Distribution</h3>
            <p className="text-xs text-slate-500">Confidence spectrum calculated from multiple detection signals</p>
          </div>

          <div className="h-52 w-full flex flex-col items-center justify-center space-y-4">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {(() => {
                  const total = confChartData.reduce((acc, c) => acc + c.value, 0) || 1;
                  let cumulativePercent = 0;
                  return confChartData.map((entry, idx) => {
                    const percent = (entry.value / total) * 100;
                    const strokeDasharray = `${percent} ${100 - percent}`;
                    const strokeDashoffset = -cumulativePercent;
                    cumulativePercent += percent;
                    return (
                      <circle
                        key={idx}
                        cx="18"
                        cy="18"
                        r="15.9155"
                        fill="transparent"
                        stroke={CONF_COLORS[idx % CONF_COLORS.length]}
                        strokeWidth="3.8"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute text-center">
                <span className="text-xl font-extrabold text-slate-900 font-mono block">
                  {data.total_candidates}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-medium text-slate-600">
              {confChartData.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CONF_COLORS[i % CONF_COLORS.length] }}></span>
                  <span>{c.name.split(' ')[0]}: <strong>{c.value}</strong></span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
            Combines column syntax, regex pattern ratio & domain format validation
          </div>
        </div>
      </div>

      {/* Accuracy Evaluation Benchmark & Recent Scans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evaluation Summary Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              Evaluation Benchmark
            </h3>
            <button
              onClick={() => onNavigate('evaluation')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Run Evaluation <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {data.evaluation_summary ? (
            <div className="space-y-4">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5">
                <span className="text-[11px] text-indigo-950 font-bold block mb-1">
                  Latest Benchmark: {data.evaluation_summary.run_name}
                </span>
                <span className="text-xs text-indigo-800">
                  Evaluated on {data.evaluation_summary.total_evaluated} labelled samples
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Precision</span>
                  <span className="text-lg font-extrabold text-emerald-600 font-mono">
                    {Math.round(data.evaluation_summary.overall_precision * 100)}%
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Recall</span>
                  <span className="text-lg font-extrabold text-sky-600 font-mono">
                    {Math.round(data.evaluation_summary.overall_recall * 100)}%
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">F1-Score</span>
                  <span className="text-lg font-extrabold text-indigo-600 font-mono">
                    {Math.round(data.evaluation_summary.overall_f1 * 100)}%
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Transparent scikit-learn standard evaluation metrics calculated against ground-truth labels.
              </p>
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-xs text-slate-500 mb-3">No evaluation run performed yet.</p>
              <button
                onClick={() => onNavigate('evaluation')}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
              >
                Run Baseline Benchmark
              </button>
            </div>
          )}
        </div>

        {/* Recent Scan History */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Scan History</h3>
              <p className="text-xs text-slate-500">Auditable log of personal data discovery jobs</p>
            </div>
            <button
              onClick={() => onNavigate('scandata')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              New Scan <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Dataset</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Columns</th>
                  <th className="py-2.5 px-3">Detections</th>
                  <th className="py-2.5 px-3">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {data.recent_scans && data.recent_scans.length > 0 ? (
                  data.recent_scans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{scan.dataset_name}</td>
                      <td className="py-2.5 px-3 uppercase text-[10px] text-slate-500">{scan.source_type}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          scan.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {scan.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{scan.total_columns}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-sky-600">{scan.candidate_count}</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {new Date(scan.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-400">
                      No scans executed yet. Click "Launch Scanner" to run your first dataset scan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
