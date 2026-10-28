import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Scale } from 'lucide-react';

export default function DeclarationTable({ declarations = [], selectedDecl, onSelectDecl }) {
  const [expandedCode, setExpandedCode] = useState(null);

  const toggleExpand = (code) => {
    setExpandedCode(expandedCode === code ? null : code);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLIANT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
            COMPLIANT
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
            WARNING
          </span>
        );
      case 'VIOLATION':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
            VIOLATION
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-200 shadow-xs bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Scale className="w-4 h-4 text-sky-600" />
            <span>Statutory Declarations Audit Matrix</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Legal Metrology (Packaged Commodities) Rules, 2011 Clause-by-Clause Verification
          </p>
        </div>
        <span className="text-xs bg-white text-sky-700 px-3 py-1 rounded-full border border-slate-200 font-mono font-bold shadow-xs">
          {declarations.length} Clauses Audited
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100 overflow-y-auto max-h-[560px]">
        {declarations.map((decl, idx) => {
          const isSelected = selectedDecl?.field_code === decl.field_code;
          const isExpanded = expandedCode === decl.field_code || isSelected;

          return (
            <div
              key={idx}
              className={`transition-colors duration-150 ${
                isSelected ? 'bg-sky-50/50 border-l-4 border-l-sky-500' : 'hover:bg-slate-50/60'
              }`}
            >
              <div
                className="p-4 cursor-pointer flex items-start justify-between gap-4"
                onClick={() => {
                  toggleExpand(decl.field_code);
                  if (onSelectDecl) onSelectDecl(decl);
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1 mb-1.5">
                    <span className="text-[11px] font-mono font-bold text-slate-700 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
                      {decl.statutory_rule_ref}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate">{decl.field_name}</h4>
                  </div>

                  <div className="text-xs text-slate-800 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 mt-1.5 leading-relaxed">
                    {decl.detected_value ? (
                      decl.detected_value
                    ) : (
                      <span className="text-rose-600 font-semibold italic">[NOT DETECTED / STATUTORY BREACH]</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2.5 flex-shrink-0">
                  {getStatusBadge(decl.compliance_status)}

                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
                    {decl.measured_font_height_mm && (
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold ${
                          decl.measured_font_height_mm < (decl.minimum_prescribed_height_mm || 1.5)
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {decl.measured_font_height_mm} mm
                      </span>
                    )}
                    <button className="text-slate-400 hover:text-slate-700 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Statutory Findings */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 bg-slate-50/60 border-t border-slate-100 text-xs space-y-2.5">
                  {decl.violation_description ? (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1.5">
                      <div className="font-bold text-rose-700 flex items-center space-x-1.5">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>Statutory Breach: {decl.violation_title || 'Non-Compliance'}</span>
                      </div>
                      <p className="leading-relaxed text-slate-700">{decl.violation_description}</p>
                      {decl.legal_remedy_recommendation && (
                        <p className="text-amber-900 font-semibold pt-1.5 border-t border-rose-200">
                          <b>Mandatory Enforcement Remedy:</b> {decl.legal_remedy_recommendation}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Conforms with prescribed placement, metric unit symbols, and visibility standards.</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                    <span>
                      Prescribed Threshold (Rule 7): <b className="text-slate-800 font-mono">{decl.minimum_prescribed_height_mm || 1.5} mm</b>
                    </span>
                    <span>AI Confidence: <b className="text-sky-700 font-mono">{Math.round((decl.confidence_score || 0.95) * 100)}%</b></span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
