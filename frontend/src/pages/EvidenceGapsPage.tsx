import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Clock, XCircle, FileQuestion, Download,
  RefreshCw, ShieldAlert, FileText, ArrowRight, CheckCircle2, Info
} from 'lucide-react';
import { api } from '../services/api';
import { EvidenceGapReport, InventoryRecord } from '../types';
import { DataClassBadge, MetadataStatusBadge, ReviewStatusBadge, ConfidenceScoreBadge } from '../components/StatusBadge';
import { EvidenceModal } from '../components/EvidenceModal';
import { ReviewModal } from '../components/ReviewModal';

export const EvidenceGapsPage: React.FC = () => {
  const [report, setReport] = useState<EvidenceGapReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  // Modals
  const [inspectRecord, setInspectRecord] = useState<InventoryRecord | null>(null);
  const [reviewRecord, setReviewRecord] = useState<InventoryRecord | null>(null);

  const fetchGaps = async () => {
    setLoading(true);
    try {
      const data = await api.getGaps();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mb-3" />
        <p className="text-sm font-medium">Scanning for privacy metadata gaps and unreviewed risks...</p>
      </div>
    );
  }

  if (!report) {
    return <div className="p-8 text-center text-slate-400">Failed to load evidence gap report.</div>;
  }

  const { statistics, gap_records, limitations } = report;

  // Filter records
  const filteredRecords = gap_records.filter((r) => {
    if (filterType === 'all') return true;
    if (filterType === 'missing_purpose') return r.metadata_status === 'Missing purpose';
    if (filterType === 'missing_retention') return r.metadata_status === 'Missing retention';
    if (filterType === 'missing_both') return r.metadata_status === 'Missing both';
    if (filterType === 'ambiguous') return r.metadata_status === 'Ambiguous metadata match';
    if (filterType === 'unreviewed') return r.review_status === 'PENDING';
    if (filterType === 'low_confidence') return r.confidence_score < 0.70;
    return true;
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Disclaimer Banner */}
      <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-5 flex items-start gap-3.5">
        <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-amber-950">Technical Evidence Gap Analysis</h4>
          <p className="text-xs text-amber-900/90 mt-0.5 leading-relaxed">
            This report identifies technical discrepancies between detected candidate personal data fields and declared governance registers (e.g., missing business purposes, unspecified retention windows, or pending human validations).
            <span className="font-semibold block mt-1">
              Note: Technical evidence gaps do not constitute definitive legal conclusions under DPDP Act, GDPR, or statutory regulations.
            </span>
          </p>
        </div>
      </div>

      {/* Gap KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div
          onClick={() => setFilterType('missing_purpose')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterType === 'missing_purpose'
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Missing Purpose
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-700">{statistics.missing_purpose_count}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">No declared use</span>
        </div>

        <div
          onClick={() => setFilterType('missing_retention')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterType === 'missing_retention'
              ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-500/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Missing Retention
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-orange-700">{statistics.missing_retention_count}</span>
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Indefinite storage risk</span>
        </div>

        <div
          onClick={() => setFilterType('missing_both')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterType === 'missing_both'
              ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Missing Both
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-rose-700">{statistics.missing_both_count}</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Unregistered PII</span>
        </div>

        <div
          onClick={() => setFilterType('ambiguous')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterType === 'ambiguous'
              ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Ambiguous Mapping
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-purple-700">{statistics.ambiguous_mapping_count}</span>
            <FileQuestion className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Conflicting records</span>
        </div>

        <div
          onClick={() => setFilterType('unreviewed')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterType === 'unreviewed'
              ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-500/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Unreviewed
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-sky-700">{statistics.unreviewed_candidate_count}</span>
            <ShieldAlert className="w-4 h-4 text-sky-500" />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Awaiting reviewer</span>
        </div>

        <div
          onClick={() => setFilterType('low_confidence')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterType === 'low_confidence'
              ? 'bg-slate-100 border-slate-500 ring-2 ring-slate-500/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Borderline Conf
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-700">{statistics.low_confidence_count}</span>
            <Info className="w-4 h-4 text-slate-500" />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Score &lt; 70%</span>
        </div>
      </div>

      {/* Gap Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Identified Technical Gaps ({filteredRecords.length})
              </h3>
              {filterType !== 'all' && (
                <button
                  onClick={() => setFilterType('all')}
                  className="text-xs text-sky-600 hover:underline font-semibold"
                >
                  Show All ({gap_records.length})
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500">Candidate fields requiring governance metadata or human review decisions</p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/reports/gaps.csv"
              download="privacylens_evidence_gaps.csv"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download Gaps CSV
            </a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Dataset / Table</th>
                <th className="py-3 px-4">Column Name</th>
                <th className="py-3 px-4">Candidate Class</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Evidence Gap Type</th>
                <th className="py-3 px-4">Review Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{r.dataset_name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{r.table_name || 'root table'}</span>
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
                    <td className="py-3 px-4">
                      <ReviewStatusBadge status={r.review_status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setInspectRecord(r)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                      >
                        Evidence
                      </button>
                      <button
                        onClick={() => setReviewRecord(r)}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition shadow-sm"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No evidence gaps match the active filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Limitations Section */}
      <div className="bg-slate-900 text-slate-300 rounded-2xl p-6 space-y-3">
        <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4" />
          Engine Scope & Technical Limitations
        </h4>
        <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
          {limitations.map((lim, idx) => (
            <li key={idx} className="leading-relaxed">{lim}</li>
          ))}
        </ul>
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
          fetchGaps();
        }}
      />
    </div>
  );
};
