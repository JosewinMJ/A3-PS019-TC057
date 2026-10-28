import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { InventoryRecord, ReviewStatus } from '../types';
import { DataClassBadge, MetadataStatusBadge } from './StatusBadge';

interface ReviewModalProps {
  record: InventoryRecord | null;
  onClose: () => void;
  onSubmit: (recordId: string, status: ReviewStatus, notes?: string) => Promise<void>;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ record, onClose, onSubmit }) => {
  if (!record) return null;

  const [status, setStatus] = useState<ReviewStatus>(record.review_status);
  const [notes, setNotes] = useState<string>(record.reviewer_notes || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(record.id, status, notes);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">
              Human In The Loop
            </span>
            <h3 className="text-lg font-bold text-slate-900">Review Candidate Detection</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Field:</span>
              <span className="font-mono font-semibold text-slate-900">
                {record.table_name ? `${record.table_name}.` : ''}{record.column_name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Dataset:</span>
              <span className="text-slate-700">{record.dataset_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Candidate Class:</span>
              <DataClassBadge dataClass={record.candidate_class} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Detection Confidence:</span>
              <span className="font-mono font-bold text-sky-700">{Math.round(record.confidence_score * 100)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Metadata Status:</span>
              <MetadataStatusBadge status={record.metadata_status} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Review Decision
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('CONFIRMED')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  status === 'CONFIRMED'
                    ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-sm ring-2 ring-teal-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 mb-1 text-teal-600" />
                Confirm PII
              </button>

              <button
                type="button"
                onClick={() => setStatus('REJECTED')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  status === 'REJECTED'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm ring-2 ring-rose-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-5 h-5 mb-1 text-rose-600" />
                Reject (Not PII)
              </button>

              <button
                type="button"
                onClick={() => setStatus('PENDING')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  status === 'PENDING'
                    ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-sm ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-5 h-5 mb-1 text-blue-600" />
                Keep Pending
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Reviewer Notes / Verification Justification
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Verified against customer schema; contains valid Aadhaar candidate identifiers..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors shadow-md shadow-sky-600/20 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Review Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
