import React, { useState, useEffect } from 'react';
import {
  LineChart, Play, RefreshCw, CheckCircle2, XCircle,
  HelpCircle, ArrowUpRight, BarChart2, ShieldCheck, Database
} from 'lucide-react';
import { api } from '../services/api';
import { EvaluationRun } from '../types';
import { DataClassBadge } from '../components/StatusBadge';

export const EvaluationPage: React.FC = () => {
  const [history, setHistory] = useState<EvaluationRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<EvaluationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [predFilter, setPredFilter] = useState<'all' | 'errors' | 'correct'>('all');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getEvaluationHistory();
      setHistory(data);
      if (data.length > 0) {
        setSelectedRun(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    try {
      const run = await api.runEvaluation(`Evaluation Run ${new Date().toLocaleTimeString()}`);
      setHistory([run, ...history]);
      setSelectedRun(run);
    } catch (err: any) {
      alert(`Evaluation failed: ${err.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium">Loading evaluation history and ground truth benchmarks...</p>
      </div>
    );
  }

  const filteredPredictions = selectedRun?.predictions_breakdown.filter((p) => {
    if (predFilter === 'errors') return !p.is_correct;
    if (predFilter === 'correct') return p.is_correct;
    return true;
  }) || [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
            Verification & Benchmark
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            Evaluation & Detection Accuracy Metrics
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Evaluates the PrivacyLens scanner against manually curated ground-truth test labels with positive personal data and negative controls.
          </p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={evaluating}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
        >
          {evaluating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Running Benchmark...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              Execute Live Evaluation
            </>
          )}
        </button>
      </div>

      {selectedRun ? (
        <>
          {/* Overall Macro Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Evaluated Samples
              </span>
              <span className="text-3xl font-extrabold text-slate-900 font-mono">
                {selectedRun.total_evaluated}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">Ground truth rows tested</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Macro Precision
              </span>
              <span className="text-3xl font-extrabold text-emerald-600 font-mono">
                {(selectedRun.overall_precision * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">TP / (TP + FP)</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Macro Recall
              </span>
              <span className="text-3xl font-extrabold text-sky-600 font-mono">
                {(selectedRun.overall_recall * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">TP / (TP + FN)</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Macro F1-Score
              </span>
              <span className="text-3xl font-extrabold text-indigo-600 font-mono">
                {(selectedRun.overall_f1 * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">Harmonic mean</span>
            </div>
          </div>

          {/* Per-Class Accuracy Metrics Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Per-Class Accuracy Breakdown ({selectedRun.run_name})
                </h4>
                <p className="text-xs text-slate-500">
                  Precision, Recall, and F1 calculations for all five configurable classes
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Executed: {new Date(selectedRun.executed_at).toLocaleString()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Data Class</th>
                    <th className="py-3 px-4">Support</th>
                    <th className="py-3 px-4">True Positives (TP)</th>
                    <th className="py-3 px-4">False Positives (FP)</th>
                    <th className="py-3 px-4">False Negatives (FN)</th>
                    <th className="py-3 px-4 font-mono">Precision</th>
                    <th className="py-3 px-4 font-mono">Recall</th>
                    <th className="py-3 px-4 font-mono">F1-Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {Object.entries(selectedRun.per_class_metrics).map(([clsName, m]) => (
                    <tr key={clsName} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <DataClassBadge dataClass={clsName} />
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{m.support}</td>
                      <td className="py-3 px-4 font-mono text-emerald-600 font-bold">{m.true_positives}</td>
                      <td className="py-3 px-4 font-mono text-rose-600">{m.false_positives}</td>
                      <td className="py-3 px-4 font-mono text-amber-600">{m.false_negatives}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {(m.precision * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {(m.recall * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {(m.f1_score * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Predictions vs Ground Truth Comparison */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Sample-by-Sample Comparison ({filteredPredictions.length} displayed)
                </h4>
                <p className="text-xs text-slate-500">
                  Transparent validation comparing expected labels with scanner predictions
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setPredFilter('all')}
                  className={`px-3 py-1 rounded-md transition ${predFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  All ({selectedRun.predictions_breakdown.length})
                </button>
                <button
                  onClick={() => setPredFilter('errors')}
                  className={`px-3 py-1 rounded-md transition ${predFilter === 'errors' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Mismatches ({selectedRun.predictions_breakdown.filter(p => !p.is_correct).length})
                </button>
                <button
                  onClick={() => setPredFilter('correct')}
                  className={`px-3 py-1 rounded-md transition ${predFilter === 'correct' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Correct ({selectedRun.predictions_breakdown.filter(p => p.is_correct).length})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Column Name</th>
                    <th className="py-2.5 px-4">Sample Value</th>
                    <th className="py-2.5 px-4">Ground Truth Class</th>
                    <th className="py-2.5 px-4">Scanner Predicted Class</th>
                    <th className="py-2.5 px-4">Confidence</th>
                    <th className="py-2.5 px-4">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredPredictions.map((p) => (
                    <tr key={p.index} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 text-slate-400 font-mono">{p.index + 1}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{p.column_name}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">{p.sample_value}</td>
                      <td className="py-2.5 px-4">
                        <DataClassBadge dataClass={p.true_class} />
                      </td>
                      <td className="py-2.5 px-4">
                        <DataClassBadge dataClass={p.predicted_class} />
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-700">
                        {Math.round(p.confidence * 100)}%
                      </td>
                      <td className="py-2.5 px-4">
                        {p.is_correct ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Match
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-xs">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Mismatch
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
          <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-900 mb-1">No Evaluation Runs Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Run an evaluation against the synthetic labelled test set to compute precision, recall, and F1 metrics.
          </p>
          <button
            onClick={handleRunEvaluation}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
          >
            Run Baseline Evaluation
          </button>
        </div>
      )}
    </div>
  );
};
