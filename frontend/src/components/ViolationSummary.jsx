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
          bg: 'bg-emerald-50 border-emerald-200',
          textColor: 'text-emerald-800',
          title: 'Fully Compliant Package',
          subtitle: 'Satisfies all mandatory declarations under LMPC Rules, 2011',
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        };
      case 'WARNING':
        return {
          bg: 'bg-amber-50 border-amber-200',
          textColor: 'text-amber-900',
          title: 'Irregularities Detected',
          subtitle: 'Minor deviations or borderline font height observed',
          icon: <AlertTriangle className="w-8 h-8 text-amber-600" />
        };
      case 'NON_COMPLIANT':
      default:
        return {
          bg: 'bg-rose-50 border-rose-200',
          textColor: 'text-rose-900',
          title: 'Statutory Non-Compliance',
          subtitle: 'Breaches under Section 18/36 of Legal Metrology Act, 2009',
          icon: <AlertOctagon className="w-8 h-8 text-rose-600" />
        };
    }
  };

  const verdict = getVerdictDetails();

  return (
    <div className="glass-panel rounded-2xl border border-slate-200 shadow-xs bg-white p-6 space-y-5">
      {/* Verdict Card Banner */}
      <div className={`p-4 rounded-2xl border ${verdict.bg} flex items-center space-x-4 shadow-xs`}>
        <div className="flex-shrink-0">{verdict.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className={`text-base font-extrabold ${verdict.textColor}`}>{verdict.title}</h3>
            <span className={`text-2xl font-mono font-extrabold ${verdict.textColor}`}>
              {overall_compliance_score}%
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">{verdict.subtitle}</p>
        </div>
      </div>

      {/* 3 Metric Gauges */}
      <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-500 block font-sans">Compliance Score</span>
          <span className="text-xl font-extrabold text-sky-700 mt-0.5 block">{overall_compliance_score}%</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-rose-600 block font-sans">Violations</span>
          <span className="text-xl font-extrabold text-rose-600 mt-0.5 block">{violations_count}</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-amber-700 block font-sans">Warnings</span>
          <span className="text-xl font-extrabold text-amber-700 mt-0.5 block">{warnings_count}</span>
        </div>
      </div>

      {/* Actionable Statutory Infringements */}
      {violations.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            <span>Violations Warranting Notice of Seizure ({violations.length})</span>
          </h4>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {violations.map((v, i) => (
              <div key={i} className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 shadow-xs">
                <span className="font-bold text-rose-800 block">
                  [{v.statutory_rule_ref}] {v.violation_title || v.field_name}
                </span>
                <span className="text-slate-600 text-[11px] block mt-1 leading-relaxed">{v.violation_description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executive Findings */}
      {inspection.summary && (
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
          <span className="font-bold text-slate-900 block">AI Legal Assessment:</span>
          <p className="leading-relaxed text-slate-600">{inspection.summary}</p>
        </div>
      )}

      {/* Export Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="flex-1 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition disabled:opacity-50"
        >
          <FileDown className="w-4 h-4" />
          <span>{downloading ? 'Generating Notice...' : 'Download Form 1 Notice (PDF)'}</span>
        </button>

        <button
          onClick={handleExportJson}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-200 transition shadow-xs"
          title="Export JSON for official ERP records"
        >
          <FileJson className="w-4 h-4 text-sky-600" />
          <span>Export JSON</span>
        </button>
      </div>
    </div>
  );
}
