import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Plus, Upload, Download, RefreshCw,
  Edit2, Trash2, CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import { api } from '../services/api';
import { MetadataRecord } from '../types';
import { DataClassBadge } from '../components/StatusBadge';

export const MetadataPage: React.FC = () => {
  const [records, setRecords] = useState<MetadataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [datasetName, setDatasetName] = useState('');
  const [tableName, setTableName] = useState('');
  const [columnName, setColumnName] = useState('');
  const [dataClass, setDataClass] = useState('person_name');
  const [declaredPurpose, setDeclaredPurpose] = useState('');
  const [retentionPeriod, setRetentionPeriod] = useState('');
  const [metadataOwner, setMetadataOwner] = useState('');
  const [notes, setNotes] = useState('');

  const fetchMetadata = async () => {
    setLoading(true);
    try {
      const data = await api.getMetadata();
      setRecords(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setDatasetName('');
    setTableName('');
    setColumnName('');
    setDataClass('person_name');
    setDeclaredPurpose('');
    setRetentionPeriod('');
    setMetadataOwner('');
    setNotes('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (r: MetadataRecord) => {
    setEditingId(r.id);
    setDatasetName(r.dataset_name);
    setTableName(r.table_name || '');
    setColumnName(r.column_name);
    setDataClass(r.data_class || 'person_name');
    setDeclaredPurpose(r.declared_purpose || '');
    setRetentionPeriod(r.retention_period || '');
    setMetadataOwner(r.metadata_owner || '');
    setNotes(r.notes || '');
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!columnName.trim()) {
      alert('Column name is required');
      return;
    }

    try {
      await api.createOrUpdateMetadata({
        dataset_name: datasetName.trim(),
        table_name: tableName.trim(),
        column_name: columnName.trim(),
        data_class: dataClass,
        declared_purpose: declaredPurpose.trim() || undefined,
        retention_period: retentionPeriod.trim() || undefined,
        metadata_owner: metadataOwner.trim() || undefined,
        last_reviewed_date: new Date().toISOString().split('T')[0],
        notes: notes.trim() || undefined
      });

      setStatusMessage({
        type: 'success',
        text: `Metadata record for '${columnName}' saved successfully.`
      });
      setShowAddModal(false);
      resetForm();
      fetchMetadata();
    } catch (err: any) {
      alert(`Failed to save metadata: ${err.message}`);
    }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const summary = await api.importMetadataCsv(file);
      setStatusMessage({
        type: 'success',
        text: `Import complete: ${summary.new_imported} new records added, ${summary.updated} updated.`
      });
      fetchMetadata();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Import failed: ${err.message}`
      });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const exportCsv = () => {
    if (records.length === 0) return;
    const headers = ['dataset_name', 'table_name', 'column_name', 'data_class', 'declared_purpose', 'retention_period', 'metadata_owner', 'last_reviewed_date', 'notes'];
    const rows = records.map(r => [
      `"${r.dataset_name || ''}"`,
      `"${r.table_name || ''}"`,
      `"${r.column_name || ''}"`,
      `"${r.data_class || ''}"`,
      `"${(r.declared_purpose || '').replace(/"/g, '""')}"`,
      `"${(r.retention_period || '').replace(/"/g, '""')}"`,
      `"${r.metadata_owner || ''}"`,
      `"${r.last_reviewed_date || ''}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'privacy_purpose_retention_register.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
            Governance Register
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            Declared Purpose & Retention Metadata
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Registered business purposes and retention periods used to benchmark technical scanner detections and uncover evidence gaps.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 cursor-pointer transition shadow-sm">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>{importing ? 'Importing...' : 'Import CSV'}</span>
            <input
              type="file"
              accept=".csv"
              disabled={importing}
              onChange={handleCsvImport}
              className="hidden"
            />
          </label>

          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition shadow-md shadow-sky-600/20"
          >
            <Plus className="w-4 h-4" />
            New Metadata Record
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            {statusMessage.text}
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* Metadata Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Registered Metadata Records ({records.length})
            </h3>
            <p className="text-xs text-slate-500">Compound keys (Dataset, Table, Column) prevent ambiguous mappings</p>
          </div>
          <button
            onClick={fetchMetadata}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Refresh register"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
            <span>Loading metadata register...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Dataset / Table</th>
                  <th className="py-3 px-4">Column Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Declared Business Purpose</th>
                  <th className="py-3 px-4">Retention Period / Rule</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Reviewed</th>
                  <th className="py-3 px-4 text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {records.length > 0 ? (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">{r.dataset_name || 'Global'}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{r.table_name || 'All tables'}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.column_name}</td>
                      <td className="py-3 px-4">
                        {r.data_class ? <DataClassBadge dataClass={r.data_class} /> : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-700" title={r.declared_purpose || ''}>
                        {r.declared_purpose ? (
                          <span className="line-clamp-2">{r.declared_purpose}</span>
                        ) : (
                          <span className="text-amber-700 font-semibold italic">⚠️ Unspecified Purpose</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-[150px]">
                        {r.retention_period ? (
                          <span className="font-mono text-slate-800">{r.retention_period}</span>
                        ) : (
                          <span className="text-orange-700 font-semibold italic">⚠️ Unspecified</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{r.metadata_owner || 'Unassigned'}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{r.last_reviewed_date || '—'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded transition"
                          title="Edit record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      No metadata records registered. Click "New Metadata Record" or "Import CSV" to populate the register.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? 'Edit Purpose & Retention Metadata' : 'Register Purpose & Retention Metadata'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Dataset Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    placeholder="e.g., synthetic_customers.csv"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Table Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    placeholder="e.g., customers"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Column Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    value={columnName}
                    onChange={(e) => setColumnName(e.target.value)}
                    placeholder="e.g., email_address"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Data Class
                  </label>
                  <select
                    value={dataClass}
                    onChange={(e) => setDataClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="person_name">Person Name</option>
                    <option value="email_address">Email Address</option>
                    <option value="phone_number">Phone Number</option>
                    <option value="government_id">Gov ID (Aadhaar/PAN)</option>
                    <option value="date_of_birth">Date of Birth</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                  Declared Business Purpose
                </label>
                <textarea
                  value={declaredPurpose}
                  onChange={(e) => setDeclaredPurpose(e.target.value)}
                  placeholder="e.g., Customer onboarding, KYC statutory verification, transactional SMS dispatch..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Retention Rule / Period
                  </label>
                  <input
                    type="text"
                    value={retentionPeriod}
                    onChange={(e) => setRetentionPeriod(e.target.value)}
                    placeholder="e.g., 7 years post-closure, 90 days post-fulfillment..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Metadata Owner / Custodian
                  </label>
                  <input
                    type="text"
                    value={metadataOwner}
                    onChange={(e) => setMetadataOwner(e.target.value)}
                    placeholder="e.g., Compliance Lead, IT Sec..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                  Governance Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional context or statutory notes..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
