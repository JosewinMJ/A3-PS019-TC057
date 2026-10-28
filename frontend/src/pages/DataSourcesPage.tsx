import React, { useState, useEffect } from 'react';
import {
  Upload, Database, FileSpreadsheet, Trash2, Eye, Play,
  CheckCircle, AlertCircle, RefreshCw, Layers, Shield
} from 'lucide-react';
import { api } from '../services/api';
import { Dataset, TableInfo } from '../types';
import { NavTab } from '../components/Sidebar';

interface DataSourcesPageProps {
  onNavigate: (tab: NavTab) => void;
  onSelectDatasetForScan: (datasetId: string) => void;
}

export const DataSourcesPage: React.FC<DataSourcesPageProps> = ({ onNavigate, onSelectDatasetForScan }) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Inspection modal/drawer
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const data = await api.getDatasets();
      setDatasets(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'csv' | 'sqlite') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);

    try {
      let created: Dataset;
      if (type === 'csv') {
        created = await api.uploadCsv(file);
      } else {
        created = await api.uploadSqlite(file);
      }
      setUploadMessage({
        type: 'success',
        text: `Successfully registered "${created.name}" (${created.row_count} rows, ${created.table_count} table${created.table_count > 1 ? 's' : ''})`
      });
      await fetchDatasets();
    } catch (err: any) {
      setUploadMessage({
        type: 'error',
        text: err.message || `Failed to upload ${type.toUpperCase()} file`
      });
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove dataset "${name}"?`)) return;
    try {
      await api.deleteDataset(id);
      setDatasets(datasets.filter(d => d.id !== id));
      if (selectedDataset?.id === id) {
        setSelectedDataset(null);
        setTables([]);
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleInspect = async (ds: Dataset) => {
    setSelectedDataset(ds);
    setLoadingTables(true);
    try {
      const tInfo = await api.getDatasetTables(ds.id);
      setTables(tInfo);
    } catch (err: any) {
      alert(`Failed to inspect tables: ${err.message}`);
    } finally {
      setLoadingTables(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Upload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Source Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Upload Delimited CSV Dataset</h3>
              <p className="text-xs text-slate-500">Supports comma-separated files up to 50MB</p>
            </div>
          </div>

          <label className="border-2 border-dashed border-slate-300 hover:border-sky-500 hover:bg-sky-50/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
            <Upload className="w-6 h-6 text-slate-400 mb-2" />
            <span className="text-xs font-semibold text-sky-600 hover:underline">
              Select CSV File
            </span>
            <span className="text-[11px] text-slate-400 mt-1">.csv (UTF-8, Latin-1 with header validation)</span>
            <input
              type="file"
              accept=".csv"
              disabled={uploading}
              onChange={(e) => handleFileUpload(e, 'csv')}
              className="hidden"
            />
          </label>
        </div>

        {/* SQLite Database Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Upload SQLite Database</h3>
              <p className="text-xs text-slate-500">Auto-discovers user tables, schema & relations</p>
            </div>
          </div>

          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
            <Upload className="w-6 h-6 text-slate-400 mb-2" />
            <span className="text-xs font-semibold text-indigo-600 hover:underline">
              Select SQLite Database
            </span>
            <span className="text-[11px] text-slate-400 mt-1">.db, .sqlite, .sqlite3 (header verified)</span>
            <input
              type="file"
              accept=".db,.sqlite,.sqlite3"
              disabled={uploading}
              onChange={(e) => handleFileUpload(e, 'sqlite')}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Notifications / Toast */}
      {uploadMessage && (
        <div className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between ${
          uploadMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {uploadMessage.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            {uploadMessage.text}
          </div>
          <button onClick={() => setUploadMessage(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* Registered Datasets Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Available Data Sources ({datasets.length})</h3>
            <p className="text-xs text-slate-500">Datasets registered in the local PrivacyLens repository</p>
          </div>
          <button
            onClick={fetchDatasets}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Refresh datasets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Dataset Name</th>
                <th className="py-3 px-4">Source Type</th>
                <th className="py-3 px-4">Tables</th>
                <th className="py-3 px-4">Row Count</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {datasets.length > 0 ? (
                datasets.map((ds) => (
                  <tr key={ds.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      {ds.source_type === 'csv' ? (
                        <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                      ) : (
                        <Database className="w-4 h-4 text-indigo-600" />
                      )}
                      {ds.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="uppercase text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700">
                        {ds.source_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{ds.table_count}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{ds.row_count.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(ds.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleInspect(ds)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        Inspect Schema
                      </button>
                      <button
                        onClick={() => {
                          onSelectDatasetForScan(ds.id);
                          onNavigate('scandata');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Scan
                      </button>
                      <button
                        onClick={() => handleDelete(ds.id, ds.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition"
                        title="Delete dataset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No data sources found. Upload a synthetic CSV or SQLite database above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schema Inspection Drawer / Detail Modal */}
      {selectedDataset && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                  Schema Inspection
                </span>
                <span className="text-xs text-slate-400 font-mono">({selectedDataset.name})</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Table Structure & Sample Values
              </h3>
            </div>
            <button
              onClick={() => setSelectedDataset(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              Close Inspector
            </button>
          </div>

          {loadingTables ? (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
              <span>Inspecting schema and sampling safely...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {tables.map((t) => (
                <div key={t.table_name} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800 text-xs flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      Table: {t.table_name} ({t.columns.length} columns, {t.row_count} rows)
                    </span>
                    <button
                      onClick={() => {
                        onSelectDatasetForScan(selectedDataset.id);
                        onNavigate('scandata');
                      }}
                      className="text-xs text-sky-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-current" /> Scan this table
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white text-slate-400 font-semibold text-[10px] uppercase border-b border-slate-100">
                        <tr>
                          <th className="py-2 px-3">Column Name</th>
                          <th className="py-2 px-3">Data Type</th>
                          <th className="py-2 px-3">Non-Null Count</th>
                          <th className="py-2 px-3">Sample Values (Sanitized)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {t.columns.map((c) => (
                          <tr key={c.name} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-mono font-semibold text-slate-900">{c.name}</td>
                            <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">{c.data_type}</td>
                            <td className="py-2 px-3 text-slate-600">{c.non_null_count}</td>
                            <td className="py-2 px-3">
                              <div className="flex flex-wrap gap-1 max-w-md">
                                {c.sample_values.slice(0, 3).map((sv, sidx) => (
                                  <span key={sidx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[10px] border border-slate-200">
                                    {sv.length > 25 ? sv.slice(0, 25) + '...' : sv}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
