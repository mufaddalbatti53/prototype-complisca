import React, { useState } from 'react';
import { FileDown, FileJson, AlertOctagon, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function ViolationSummary({ inspection }) {
  const [downloading, setDownloading] = useState(false);

  if (!inspection) return null;

  const {
    id,
    overall_compliance_score = 0,
    compliance_verdict = 'NON_COMPLIANT',
    violations_count = 0,
    warnings_count = 0,
    declarations = []
  } = inspection;

  const violations = declarations.filter((d) => d.compliance_status === 'VIOLATION');
  const warnings = declarations.filter((d) => d.compliance_status === 'WARNING');

  const handleDownloadPdf = () => {
    setDownloading(true);
    const url = api.getPdfReportUrl(id);
    window.open(url, '_blank');
    setTimeout(() => setDownloading(false), 1500);
  };

  const handleExportJson = () => {
    const url = api.getJsonReportUrl(id);
    window.open(url, '_blank');
  };

  const getVerdictDetails = () => {
    switch (compliance_verdict) {
      case 'COMPLIANT':
        return {
          bg: 'from-emerald-950/60 to-emerald-900/30 border-emerald-500/50 shadow-glow-emerald',
          textColor: 'text-emerald-400',
          title: 'Fully Compliant Package',
          subtitle: 'Satisfies all mandatory declarations under LMPC Rules, 2011',
          icon: <CheckCircle2 className="w-9 h-9 text-emerald-400" />
        };
      case 'WARNING':
        return {
          bg: 'from-amber-950/60 to-amber-900/30 border-amber-500/50',
          textColor: 'text-amber-400',
          title: 'Irregularities Detected',
          subtitle: 'Minor deviations or borderline font height observed',
          icon: <AlertTriangle className="w-9 h-9 text-amber-400" />
        };
      case 'NON_COMPLIANT':
      default:
        return {
          bg: 'from-red-950/70 to-red-900/40 border-red-500/60 shadow-glow-red',
          textColor: 'text-red-400',
          title: 'Statutory Non-Compliance',
          subtitle: 'Breaches under Section 18/36 of Legal Metrology Act, 2009',
          icon: <AlertOctagon className="w-9 h-9 text-red-400" />
        };
    }
  };

  const verdict = getVerdictDetails();

  return (
    <div className="glass-panel rounded-2xl border border-white/[0.08] shadow-card-dark p-6 space-y-5">
      {/* Verdict Card Banner */}
      <div className={`p-4 rounded-2xl border bg-gradient-to-r ${verdict.bg} flex items-center space-x-4`}>
        <div className="flex-shrink-0">{verdict.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className={`text-base font-extrabold ${verdict.textColor}`}>{verdict.title}</h3>
            <span className="text-2xl font-mono font-extrabold text-white">
              {overall_compliance_score}%
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">{verdict.subtitle}</p>
        </div>
      </div>

      {/* 3 Metric Gauges */}
      <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
        <div className="p-3 bg-gov-950/80 rounded-xl border border-white/[0.08]">
          <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Compliance Score</span>
          <span className="text-xl font-extrabold text-cyan-300 mt-0.5 block">{overall_compliance_score}%</span>
        </div>
        <div className="p-3 bg-gov-950/80 rounded-xl border border-white/[0.08]">
          <span className="text-[10px] uppercase font-bold text-red-400 block font-sans">Violations</span>
          <span className="text-xl font-extrabold text-red-400 mt-0.5 block">{violations_count}</span>
        </div>
        <div className="p-3 bg-gov-950/80 rounded-xl border border-white/[0.08]">
          <span className="text-[10px] uppercase font-bold text-amber-400 block font-sans">Warnings</span>
          <span className="text-xl font-extrabold text-amber-300 mt-0.5 block">{warnings_count}</span>
        </div>
      </div>

      {/* Actionable Statutory Infringements */}
      {violations.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4" />
            <span>Violations Warranting Notice of Seizure ({violations.length})</span>
          </h4>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {violations.map((v, i) => (
              <div key={i} className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200">
                <span className="font-bold text-red-300 block">
                  [{v.statutory_rule_ref}] {v.violation_title || v.field_name}
                </span>
                <span className="text-slate-300 text-[11px] block mt-1 leading-relaxed">{v.violation_description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executive Findings */}
      {inspection.summary && (
        <div className="p-3.5 bg-gov-950/70 rounded-xl border border-white/[0.08] text-xs text-slate-300 space-y-1">
          <span className="font-bold text-white block">AI Legal Assessment:</span>
          <p className="leading-relaxed text-slate-300">{inspection.summary}</p>
        </div>
      )}

      {/* Export Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="flex-1 bg-gradient-to-r from-red-600 via-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-glow-red transition disabled:opacity-50"
        >
          <FileDown className="w-4 h-4" />
          <span>{downloading ? 'Generating Notice...' : 'Download Form 1 Notice (PDF)'}</span>
        </button>

        <button
          onClick={handleExportJson}
          className="bg-gov-800 hover:bg-gov-700 text-slate-200 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 border border-white/10 transition shadow"
          title="Export JSON for official ERP records"
        >
          <FileJson className="w-4 h-4 text-cyan-400" />
          <span>Export JSON</span>
        </button>
      </div>
    </div>
  );
}
