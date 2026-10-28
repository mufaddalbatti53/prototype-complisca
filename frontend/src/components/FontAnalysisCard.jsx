import React from 'react';
import { Ruler } from 'lucide-react';

export default function FontAnalysisCard({ pdpArea = 100, declarations = [] }) {
  const getPrescribedMin = (area) => {
    if (area <= 50) return 1.0;
    if (area <= 100) return 1.5;
    if (area <= 500) return 2.5;
    if (area <= 2500) return 4.0;
    return 6.0;
  };

  const minRequired = getPrescribedMin(pdpArea);

  const fontSensitiveDecls = declarations.filter(
    (d) => ['NET_QUANTITY', 'MRP', 'DATE_OF_MANUFACTURE'].includes(d.field_code)
  );

  return (
    <div className="glass-panel rounded-2xl border border-slate-200 shadow-xs bg-white p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Ruler className="w-4 h-4 text-sky-600" />
          <span>Rule 7 & 8: Principal Display Panel Font Height Audit</span>
        </h4>
        <span className="text-xs bg-sky-50 text-sky-700 font-mono font-bold px-3 py-1 rounded-full border border-sky-200 shadow-xs">
          PDP: {pdpArea} cm²
        </span>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Under <b>Rule 7 and the First Schedule</b> of LMPC Rules 2011, the minimum height of numerals and letters is determined by the Principal Display Panel area:
      </p>

      {/* Statutory Height Reference Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-bold">
            <tr>
              <th className="p-3">Area of PDP (cm²)</th>
              <th className="p-3">Statutory Min. Height</th>
              <th className="p-3">Active Applicability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
            <tr className={pdpArea <= 50 ? 'bg-sky-50/80 text-sky-800 font-bold' : ''}>
              <td className="p-3">≤ 50 cm²</td>
              <td className="p-3">1.0 mm</td>
              <td className="p-3">{pdpArea <= 50 ? '← ACTIVE RULE' : '-'}</td>
            </tr>
            <tr className={pdpArea > 50 && pdpArea <= 100 ? 'bg-sky-50/80 text-sky-800 font-bold' : ''}>
              <td className="p-3">50 to 100 cm²</td>
              <td className="p-3">1.5 mm</td>
              <td className="p-3">{pdpArea > 50 && pdpArea <= 100 ? '← ACTIVE RULE' : '-'}</td>
            </tr>
            <tr className={pdpArea > 100 && pdpArea <= 500 ? 'bg-sky-50/80 text-sky-800 font-bold' : ''}>
              <td className="p-3">100 to 500 cm²</td>
              <td className="p-3">2.5 mm</td>
              <td className="p-3">{pdpArea > 100 && pdpArea <= 500 ? '← ACTIVE RULE' : '-'}</td>
            </tr>
            <tr className={pdpArea > 500 && pdpArea <= 2500 ? 'bg-sky-50/80 text-sky-800 font-bold' : ''}>
              <td className="p-3">500 to 2500 cm²</td>
              <td className="p-3">4.0 mm</td>
              <td className="p-3">{pdpArea > 500 && pdpArea <= 2500 ? '← ACTIVE RULE' : '-'}</td>
            </tr>
            <tr className={pdpArea > 2500 ? 'bg-sky-50/80 text-sky-800 font-bold' : ''}>
              <td className="p-3">&gt; 2500 cm²</td>
              <td className="p-3">6.0 mm</td>
              <td className="p-3">{pdpArea > 2500 ? '← ACTIVE RULE' : '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Measured Values Check */}
      <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-2">
        Measured Critical Declarations:
      </h5>
      <div className="space-y-2">
        {fontSensitiveDecls.map((d, i) => {
          const measured = d.measured_font_height_mm || 2.0;
          const isCompliant = measured >= minRequired;
          return (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs shadow-xs"
            >
              <div>
                <span className="font-bold text-slate-800 block">{d.field_name}</span>
                <span className="text-slate-500 text-[11px] font-mono">{d.statutory_rule_ref}</span>
              </div>
              <div className="text-right">
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded ${
                    isCompliant ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {measured} mm
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                  Min: {minRequired} mm
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
