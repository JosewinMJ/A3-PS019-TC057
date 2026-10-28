import React from 'react';
import { X, ShieldAlert, Cpu, EyeOff, Layers, CheckCircle, HelpCircle } from 'lucide-react';
import { InventoryRecord } from '../types';
import { DataClassBadge, MetadataStatusBadge, ReviewStatusBadge, ConfidenceScoreBadge } from './StatusBadge';

interface EvidenceModalProps {
  record: InventoryRecord | null;
  onClose: () => void;
  onOpenReview: (record: InventoryRecord) => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ record, onClose, onOpenReview }) => {
  if (!record) return null;

  const sb = record.signals_breakdown || {};
  const weights = sb.weights || { column: 0.35, value: 0.45, validator: 0.20 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                Technical Evidence Audit
              </span>
              <span className="text-[11px] text-slate-400 font-mono">ID: {record.id.slice(0, 8)}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-0.5">
              <span>{record.table_name ? `${record.table_name}.` : ''}{record.column_name}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Top Status Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Candidate Class</span>
              <DataClassBadge dataClass={record.candidate_class} />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Confidence</span>
              <ConfidenceScoreBadge score={record.confidence_score} />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Review Status</span>
              <ReviewStatusBadge status={record.review_status} />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Metadata Status</span>
              <MetadataStatusBadge status={record.metadata_status} />
            </div>
          </div>

          {/* Evidence Summary Card */}
          <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Cpu className="w-4 h-4 text-sky-600" />
              Automated Detection Evidence
            </h4>
            <p className="text-sm text-sky-950 font-medium leading-relaxed">
              {record.evidence_summary}
            </p>
          </div>

          {/* Multi-Signal Breakdown */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Layers className="w-4 h-4 text-slate-500" />
              Signal Scoring Breakdown
            </h4>
            <div className="space-y-3 bg-white border border-slate-200 rounded-xl p-4">
              {/* Column Pattern Signal */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-700">1. Column Identifier Signal</span>
                  <span className="font-mono text-slate-500">Weight: {weights.column * 100}% • Score: {(sb.column_score ?? 0) * 100}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full" style={{ width: `${(sb.column_score ?? 0) * 100}%` }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {sb.column_matched ? `Matched configured column patterns for ${record.candidate_class}` : 'No positive column pattern matched'}
                  {sb.negative_column_match ? ' (Negative column pattern penalty applied)' : ''}
                </p>
              </div>

              {/* Value Regex Signal */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-700">2. Value Pattern Match Ratio</span>
                  <span className="font-mono text-slate-500">Weight: {weights.value * 100}% • Ratio: {Math.round((sb.value_match_ratio ?? 0) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full" style={{ width: `${(sb.value_match_ratio ?? 0) * 100}%` }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {sb.samples_matched ?? record.match_count} of {sb.samples_evaluated ?? record.sampled_count} sampled non-null values matched syntactic regex rules
                </p>
              </div>

              {/* Format Validator Signal */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-700">3. Domain Format Validator</span>
                  <span className="font-mono text-slate-500">Weight: {weights.validator * 100}% • Pass: {Math.round((sb.validator_pass_ratio ?? 0) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full" style={{ width: `${(sb.validator_pass_ratio ?? 0) * 100}%` }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Domain structural plausibility validation passed for candidate values
                </p>
              </div>
            </div>
          </div>

          {/* Masked Sample Values Preview */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <EyeOff className="w-4 h-4 text-slate-500" />
              Redacted Sample Values (Zero-Exposure Evidence)
            </h4>
            <div className="bg-slate-900 rounded-xl p-3 text-slate-300 font-mono text-xs space-y-1.5">
              {record.sample_values_masked && record.sample_values_masked.length > 0 ? (
                record.sample_values_masked.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-slate-500 select-none">[{idx + 1}]</span>
                    <span className="text-emerald-400">{val}</span>
                  </div>
                ))
              ) : (
                <span className="text-slate-500">No sample values available.</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 italic">
              Raw personal identifiable information is automatically masked in memory before evidence persistence.
            </p>
          </div>

          {/* Metadata Linking Section */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Declared Purpose & Retention Metadata
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Declared Purpose</span>
                <span className={`font-medium ${record.declared_purpose ? 'text-slate-900' : 'text-rose-600 font-semibold'}`}>
                  {record.declared_purpose || '⚠️ Missing Declared Purpose'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Retention Rule / Period</span>
                <span className={`font-medium ${record.retention_period ? 'text-slate-900' : 'text-rose-600 font-semibold'}`}>
                  {record.retention_period || '⚠️ Missing Retention Period'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Metadata Owner</span>
                <span className="text-slate-700">{record.metadata_owner || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Reviewer Notes</span>
                <span className="text-slate-700 italic">{record.reviewer_notes || 'No review notes recorded'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            Scanned on {new Date(record.created_at).toLocaleDateString()}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenReview(record);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors shadow-sm"
            >
              Change Review Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
