import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Download, FileText, Eye, CheckSquare,
  RefreshCw, AlertCircle, FileSpreadsheet, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { InventoryRecord, ReviewStatus } from '../types';
import {
  DataClassBadge, MetadataStatusBadge, ReviewStatusBadge, ConfidenceScoreBadge
} from '../components/StatusBadge';
import { EvidenceModal } from '../components/EvidenceModal';
import { ReviewModal } from '../components/ReviewModal';

export const InventoryPage: React.FC = () => {
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMetadataStatus, setSelectedMetadataStatus] = useState('');
  const [selectedReviewStatus, setSelectedReviewStatus] = useState('');
  const [minConfidence, setMinConfidence] = useState<number | ''>('');

  // Modals
  const [inspectRecord, setInspectRecord] = useState<InventoryRecord | null>(null);
  const [reviewRecord, setReviewRecord] = useState<InventoryRecord | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await api.getInventory({
        search: search || undefined,
        data_class: selectedClass || undefined,
        metadata_status: selectedMetadataStatus || undefined,
        review_status: selectedReviewStatus || undefined,
        min_confidence: minConfidence !== '' ? Number(minConfidence) : undefined
      });
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedClass, selectedMetadataStatus, selectedReviewStatus, minConfidence]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleReviewSubmit = async (recordId: string, status: ReviewStatus, notes?: string) => {
    const updated = await api.updateReview(recordId, status, notes);
    setRecords(records.map(r => r.id === recordId ? updated : r));
    if (inspectRecord?.id === recordId) {
      setInspectRecord(updated);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Search and Filters Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by column name, table name, or dataset identifier..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
          >
            Filter Records
          </button>
        </form>

        <div className="flex flex-wrap gap-3 pt-1 border-t border-slate-100 text-xs">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium focus:ring-sky-500"
          >
            <option value="">All Data Classes</option>
            <option value="person_name">Person Name</option>
            <option value="email_address">Email Address</option>
            <option value="phone_number">Phone Number</option>
            <option value="government_id">Government ID (Aadhaar/PAN)</option>
            <option value="date_of_birth">Date of Birth</option>
          </select>

          <select
            value={selectedMetadataStatus}
            onChange={(e) => setSelectedMetadataStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium focus:ring-sky-500"
          >
            <option value="">All Metadata Statuses</option>
            <option value="Complete metadata">Complete metadata</option>
            <option value="Missing purpose">Missing purpose</option>
            <option value="Missing retention">Missing retention</option>
            <option value="Missing both">Missing both</option>
            <option value="Ambiguous metadata match">Ambiguous metadata match</option>
          </select>

          <select
            value={selectedReviewStatus}
            onChange={(e) => setSelectedReviewStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium focus:ring-sky-500"
          >
            <option value="">All Review Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="CONFIRMED">Confirmed PII</option>
            <option value="REJECTED">Rejected (Non-PII)</option>
          </select>

          <select
            value={minConfidence}
            onChange={(e) => setMinConfidence(e.target.value ? Number(e.target.value) : '')}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium focus:ring-sky-500"
          >
            <option value="">Any Confidence</option>
            <option value="0.70">High (≥ 70%)</option>
            <option value="0.85">Very High (≥ 85%)</option>
          </select>

          {(selectedClass || selectedMetadataStatus || selectedReviewStatus || minConfidence !== '' || search) && (
            <button
              onClick={() => {
                setSelectedClass('');
                setSelectedMetadataStatus('');
                setSelectedReviewStatus('');
                setMinConfidence('');
                setSearch('');
              }}
              className="text-xs text-sky-600 hover:underline font-semibold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Inventory Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Discovered Candidate Inventory ({records.length})
            </h3>
            <p className="text-xs text-slate-500">Structured inventory linking candidate fields with declared metadata</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchInventory}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title="Refresh inventory"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
            <span>Loading privacy evidence inventory records...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Dataset / Table</th>
                  <th className="py-3 px-4">Column Name</th>
                  <th className="py-3 px-4">Candidate Class</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Metadata Status</th>
                  <th className="py-3 px-4">Declared Purpose</th>
                  <th className="py-3 px-4">Retention Rule</th>
                  <th className="py-3 px-4">Review</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {records.length > 0 ? (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">{r.dataset_name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {r.table_name || 'root table'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.column_name}</td>
                      <td className="py-3 px-4">
                        <DataClassBadge dataClass={r.candidate_class} />
                      </td>
                      <td className="py-3 px-4">
                        <ConfidenceScoreBadge score={r.confidence_score} />
                      </td>
                      <td className="py-3 px-4">
                        <MetadataStatusBadge status={r.metadata_status} />
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-700" title={r.declared_purpose || 'Missing purpose'}>
                        {r.declared_purpose || <span className="text-amber-700 font-semibold italic">Unspecified</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-700 truncate max-w-[120px]" title={r.retention_period || 'Missing retention'}>
                        {r.retention_period || <span className="text-orange-700 font-semibold italic">Unspecified</span>}
                      </td>
                      <td className="py-3 px-4">
                        <ReviewStatusBadge status={r.review_status} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setInspectRecord(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                          title="Inspect technical evidence breakdown"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          Evidence
                        </button>
                        <button
                          onClick={() => setReviewRecord(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition shadow-sm"
                          title="Change human review status"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">
                      No candidate detections matched the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <EvidenceModal
        record={inspectRecord}
        onClose={() => setInspectRecord(null)}
        onOpenReview={(rec) => setReviewRecord(rec)}
      />

      <ReviewModal
        record={reviewRecord}
        onClose={() => setReviewRecord(null)}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
};
