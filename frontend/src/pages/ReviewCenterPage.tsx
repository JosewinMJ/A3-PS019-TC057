import React, { useState, useEffect } from 'react';
import {
  CheckSquare, CheckCircle2, XCircle, Clock, Eye,
  RefreshCw, Shield, AlertCircle, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { InventoryRecord, ReviewStatus } from '../types';
import { DataClassBadge, MetadataStatusBadge, ConfidenceScoreBadge } from '../components/StatusBadge';
import { EvidenceModal } from '../components/EvidenceModal';
import { ReviewModal } from '../components/ReviewModal';

export const ReviewCenterPage: React.FC = () => {
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'CONFIRMED' | 'REJECTED'>('PENDING');

  // Modals
  const [inspectRecord, setInspectRecord] = useState<InventoryRecord | null>(null);
  const [reviewRecord, setReviewRecord] = useState<InventoryRecord | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await api.getInventory({ review_status: activeTab });
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeTab]);

  const handleQuickReview = async (recordId: string, status: ReviewStatus) => {
    try {
      await api.updateReview(recordId, status, `Reviewed in quick triage: ${status}`);
      setRecords(records.filter(r => r.id !== recordId));
    } catch (err: any) {
      alert(`Review update failed: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
            Human-In-The-Loop Validation
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            Privacy Review & Triage Center
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Reviewers evaluate technical scanner detections and confirm or reject personal data classifications with auditable justifications.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'PENDING'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            Pending Review
          </button>
          <button
            onClick={() => setActiveTab('CONFIRMED')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'CONFIRMED'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            Confirmed PII
          </button>
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'REJECTED'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            Rejected
          </button>
        </div>
      </div>

      {/* Review Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-slate-900">
              {activeTab === 'PENDING' ? 'Pending Detections Awaiting Decision' : activeTab === 'CONFIRMED' ? 'Confirmed Personal Data Inventory' : 'Rejected Candidates (False Positive Log)'} ({records.length})
            </h4>
            <p className="text-xs text-slate-500">
              {activeTab === 'PENDING' ? 'Review evidence signals and confirm or reject each field.' : 'Historical audit of decisions made by data governance reviewers.'}
            </p>
          </div>

          <button
            onClick={fetchRecords}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
            <span>Loading review queue...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Field Identifier</th>
                  <th className="py-3 px-4">Dataset Source</th>
                  <th className="py-3 px-4">Candidate Class</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Technical Evidence Summary</th>
                  <th className="py-3 px-4">Reviewer Notes</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {records.length > 0 ? (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{r.column_name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{r.table_name || 'root table'}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{r.dataset_name}</td>
                      <td className="py-3 px-4">
                        <DataClassBadge dataClass={r.candidate_class} />
                      </td>
                      <td className="py-3 px-4">
                        <ConfidenceScoreBadge score={r.confidence_score} />
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-600 truncate" title={r.evidence_summary}>
                        {r.evidence_summary}
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-[150px] truncate" title={r.reviewer_notes || ''}>
                        {r.reviewer_notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setInspectRecord(r)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                          title="View evidence details"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                          Evidence
                        </button>

                        {activeTab === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleQuickReview(r.id, 'CONFIRMED')}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition shadow-sm"
                              title="Confirm as PII"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                              Confirm
                            </button>
                            <button
                              onClick={() => handleQuickReview(r.id, 'REJECTED')}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition text-rose-700"
                              title="Reject detection"
                            >
                              <XCircle className="w-3.5 h-3.5 inline mr-1 text-rose-600" />
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setReviewRecord(r)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition shadow-sm"
                          >
                            Modify Decision
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      No records in {activeTab.toLowerCase()} status.
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
        onSubmit={async (recordId, status, notes) => {
          await api.updateReview(recordId, status, notes);
          fetchRecords();
        }}
      />
    </div>
  );
};
