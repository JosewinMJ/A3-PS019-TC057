import React, { useState, useEffect } from 'react';
import {
  Play, RefreshCw, CheckCircle2, AlertCircle, FileSpreadsheet,
  Database, ShieldCheck, ArrowRight, Layers
} from 'lucide-react';
import { api } from '../services/api';
import { Dataset, ScanJob, TableInfo } from '../types';
import { NavTab } from '../components/Sidebar';

interface ScanPageProps {
  selectedDatasetId?: string;
  onNavigate: (tab: NavTab) => void;
}

export const ScanPage: React.FC<ScanPageProps> = ({ selectedDatasetId, onNavigate }) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [currentDatasetId, setCurrentDatasetId] = useState<string>(selectedDatasetId || '');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanJob | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    api.getDatasets().then((data) => {
      setDatasets(data);
      if (!currentDatasetId && data.length > 0) {
        setCurrentDatasetId(data[0].id);
      }
    });
  }, []);

  // When selected dataset changes, load tables if sqlite
  useEffect(() => {
    if (!currentDatasetId) return;
    const ds = datasets.find(d => d.id === currentDatasetId);
    if (ds && ds.source_type === 'sqlite') {
      api.getDatasetTables(ds.id).then((tList) => {
        setTables(tList);
        setSelectedTables(tList.map(t => t.table_name));
      }).catch(console.error);
    } else {
      setTables([]);
      setSelectedTables([]);
    }
  }, [currentDatasetId, datasets]);

  const handleStartScan = async () => {
    if (!currentDatasetId) return;
    setScanning(true);
    setScanError(null);
    setLastScanResult(null);

    try {
      const targetTables = tables.length > 0 ? selectedTables : undefined;
      const res = await api.triggerScan(currentDatasetId, targetTables);
      setLastScanResult(res);
    } catch (err: any) {
      setScanError(err.message || 'Scan failed to complete');
    } finally {
      setScanning(false);
    }
  };

  const currentDataset = datasets.find(d => d.id === currentDatasetId);

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Scan Config Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
            Automated Inspection
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            Personal-Data Discovery Scanner
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Scans schemas and sample values against configurable YAML rules for person names, emails, phone numbers, government IDs, and birth dates.
          </p>
        </div>

        {/* Dataset Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Target Dataset
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {datasets.map((ds) => {
              const isSelected = ds.id === currentDatasetId;
              return (
                <div
                  key={ds.id}
                  onClick={() => setCurrentDatasetId(ds.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                    isSelected
                      ? 'bg-sky-50/70 border-sky-500 ring-2 ring-sky-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {ds.source_type === 'csv' ? <FileSpreadsheet className="w-4 h-4" /> : <Database className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{ds.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {ds.source_type.toUpperCase()} • {ds.row_count.toLocaleString()} rows • {ds.table_count} table{ds.table_count > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SQLite Table Filter (if applicable) */}
        {tables.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Tables to Scan
              </label>
              <div className="space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedTables(tables.map(t => t.table_name))}
                  className="text-sky-600 hover:underline font-semibold"
                >
                  Select All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedTables([])}
                  className="text-slate-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {tables.map((t) => {
                const checked = selectedTables.includes(t.table_name);
                return (
                  <label
                    key={t.table_name}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                      checked
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        if (checked) {
                          setSelectedTables(selectedTables.filter(name => name !== t.table_name));
                        } else {
                          setSelectedTables([...selectedTables, t.table_name]);
                        }
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{t.table_name}</span>
                    <span className="text-slate-400 font-mono text-[10px]">({t.columns.length} cols)</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Scan Trigger Button */}
        <div className="pt-2">
          <button
            onClick={handleStartScan}
            disabled={scanning || !currentDatasetId || (tables.length > 0 && selectedTables.length === 0)}
            className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-sky-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Multi-Signal Detection Engine...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Execute Scan on {currentDataset?.name || 'Dataset'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {scanError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{scanError}</span>
        </div>
      )}

      {/* Scan Results Summary Card */}
      {lastScanResult && (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-950">Scan Completed Successfully</h4>
                <p className="text-xs text-emerald-800">
                  Inspected {lastScanResult.total_columns} columns across {lastScanResult.total_tables} table(s) in {lastScanResult.dataset_name}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('inventory')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition"
            >
              Open Evidence Inventory <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-emerald-100 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Tables Inspected</span>
              <span className="text-lg font-bold text-slate-900 font-mono">{lastScanResult.total_tables}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Columns Evaluated</span>
              <span className="text-lg font-bold text-slate-900 font-mono">{lastScanResult.total_columns}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Candidate PII Discovered</span>
              <span className="text-lg font-bold text-sky-600 font-mono">{lastScanResult.candidate_count}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
