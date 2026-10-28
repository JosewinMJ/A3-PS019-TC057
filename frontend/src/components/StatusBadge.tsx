import React from 'react';
import { ShieldCheck, AlertCircle, Clock, CheckCircle2, XCircle, FileQuestion } from 'lucide-react';
import { DataClass, MetadataStatus, ReviewStatus } from '../types';

export const DataClassBadge: React.FC<{ dataClass: string }> = ({ dataClass }) => {
  const configs: Record<string, { label: string; bg: string; text: string; border: string }> = {
    person_name: { label: 'Person Name', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    email_address: { label: 'Email Address', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    phone_number: { label: 'Phone Number', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    government_id: { label: 'Gov ID (Aadhaar/PAN)', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    date_of_birth: { label: 'Date of Birth', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    non_personal: { label: 'Non-Personal', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  };

  const c = configs[dataClass] || { label: dataClass, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
};

export const MetadataStatusBadge: React.FC<{ status: MetadataStatus }> = ({ status }) => {
  switch (status) {
    case 'Complete metadata':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Complete
        </span>
      );
    case 'Missing purpose':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          Missing Purpose
        </span>
      );
    case 'Missing retention':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200">
          <Clock className="w-3.5 h-3.5 text-orange-600" />
          Missing Retention
        </span>
      );
    case 'Missing both':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Missing Both
        </span>
      );
    case 'Ambiguous metadata match':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <FileQuestion className="w-3.5 h-3.5 text-purple-600" />
          Ambiguous Match
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
          {status}
        </span>
      );
  }
};

export const ReviewStatusBadge: React.FC<{ status: ReviewStatus }> = ({ status }) => {
  switch (status) {
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
          Confirmed
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          <XCircle className="w-3.5 h-3.5 text-slate-500" />
          Rejected (Non-PII)
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          Pending Review
        </span>
      );
  }
};

export const ConfidenceScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const percent = Math.round(score * 100);
  let color = 'bg-slate-100 text-slate-700 border-slate-300';

  if (percent >= 85) {
    color = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (percent >= 70) {
    color = 'bg-sky-50 text-sky-800 border-sky-200';
  } else if (percent >= 50) {
    color = 'bg-amber-50 text-amber-800 border-amber-200';
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-14 bg-slate-200 h-1.5 rounded-full overflow-hidden">
        <div 
          className={`h-full ${percent >= 70 ? 'bg-sky-500' : 'bg-amber-500'}`} 
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold border ${color}`}>
        {percent}%
      </span>
    </div>
  );
};
