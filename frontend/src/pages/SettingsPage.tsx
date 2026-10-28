import React, { useState, useEffect } from 'react';
import {
  Sliders, Save, RefreshCw, CheckCircle2, AlertCircle,
  FileCode, Shield, Info, HelpCircle
} from 'lucide-react';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [yamlContent, setYamlContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await api.getRules();
      setYamlContent(data.yaml_content);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to fetch rules' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await api.updateRules(yamlContent);
      setStatusMessage({ type: 'success', text: res.message });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update rules' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
            Engine Configuration
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            Configurable YAML Detection Rules
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Modify column regex patterns, sample value validators, and signal scoring weights without altering backend engine code.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchRules}
            disabled={loading || saving}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
            Reload
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition shadow-md shadow-sky-600/20 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 inline mr-1.5" />
            {saving ? 'Validating & Compiling...' : 'Save & Compile Rules'}
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

      {/* Editor Box */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-mono font-semibold text-slate-300">backend/config/rules.yaml</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">YAML 1.2 Syntax</span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
            <span>Loading rule definitions...</span>
          </div>
        ) : (
          <textarea
            value={yamlContent}
            onChange={(e) => setYamlContent(e.target.value)}
            rows={24}
            className="w-full bg-slate-950 text-emerald-400 font-mono text-xs p-5 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-y leading-relaxed"
            spellCheck={false}
          />
        )}
      </div>

      {/* Guidelines Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-xs text-slate-600 space-y-3">
        <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-600" />
          Rule Authoring Guidelines & Security Guardrails
        </h4>
        <ul className="space-y-1.5 list-disc list-inside text-slate-600">
          <li><strong>YAML Structure:</strong> Must include all five classes: <code className="text-slate-900 font-mono font-bold">person_name</code>, <code className="text-slate-900 font-mono font-bold">email_address</code>, <code className="text-slate-900 font-mono font-bold">phone_number</code>, <code className="text-slate-900 font-mono font-bold">government_id</code>, and <code className="text-slate-900 font-mono font-bold">date_of_birth</code>.</li>
          <li><strong>Regex Compilation:</strong> All regular expressions are compiled and syntax-checked by the backend prior to persistence. Malformed patterns are safely rejected without affecting active memory.</li>
          <li><strong>Zero Arbitrary Code Execution:</strong> The rule loader uses <code className="text-slate-900 font-mono font-bold">yaml.safe_load</code> with strict schema validation; arbitrary Python objects and executable statements are strictly blocked.</li>
          <li><strong>Jurisdiction-Specific Limitation:</strong> Indian Aadhaar patterns check the 12-digit non-(0/1) structure. Verhoeff checksums and UIDAI online services are documented as outside this prototype's verification scope.</li>
        </ul>
      </div>
    </div>
  );
};
