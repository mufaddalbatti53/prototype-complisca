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
    <div className="glass-panel rounded-2xl border border-white/[0.08] shadow-card-dark p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <h4 className="text-sm font-bold text-white flex items-center space-x-2">
          <Ruler className="w-4 h-4 text-cyan-400" />
          <span>Rule 7 & 8: Principal Display Panel Font Height Audit</span>
        </h4>
        <span className="text-xs bg-cyan-950 text-cyan-300 font-mono font-bold px-3 py-1 rounded-full border border-cyan-500/30">
          PDP: {pdpArea} cm²
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        Under <b>Rule 7 and the First Schedule</b> of LMPC Rules 2011, the minimum height of numerals and letters is determined by the Principal Display Panel area:
      </p>

      {/* Statutory Height Reference Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-gov-950/60">
        <table className="w-full text-left text-xs">
          <thead className="bg-gov-900/80 text-slate-400 border-b border-white/[0.08] text-[11px] font-bold">
            <tr>
              <th className="p-3">Area of PDP (cm²)</th>
              <th className="p-3">Statutory Min. Height</th>
              <th className="p-3">Active Applicability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-slate-300 font-mono">
            <tr className={pdpArea <= 50 ? 'bg-cyan-950/60 text-cyan-300 font-bold' : ''}>
              <td className="p-3">≤ 50 cm²</td>
              <td className="p-3">1.0 mm</td>
              <td className="p-3">{pdpArea <= 50 ? '← ACTIVE RULE' : '-'}</td>
            </tr>
            <tr className={pdpArea > 50 && pdpArea <= 100 ? 'bg-cyan-950/60 text-cyan-300 font-bold' : ''}>
              <td className="p-3">50 to 100 cm²</td>
              <td className="p-3">1.5 mm</td>
              <td className="p-3">{pdpArea > 50 && pdpArea <= 100 ? '← ACTIVE RULE' : '-'}</td>
            </tr>
            <tr className={pdpArea > 100 && pdpArea <= 500 ? 'bg-cyan-950/60 text-cyan-300 font-bold' : ''}>
              <td className="p-3">100 to 500 cm²</td>
              <td className="p-3">2.5 mm</td>
              <td className="p-3">{pdpArea > 100 && pdpArea <= 500 ? '← ACTIVE RULE' : '-'}</td>
            </tr>
            <tr className={pdpArea > 500 && pdpArea <= 2500 ? 'bg-cyan-950/60 text-cyan-300 font-bold' : ''}>
              <td className="p-3">500 to 2500 cm²</td>
              <td className="p-3">4.0 mm</td>
              <td className="p-3">{pdpArea > 500 && pdpArea <= 2500 ? '← ACTIVE RULE' : '-'}</td>
            </tr>
            <tr className={pdpArea > 2500 ? 'bg-cyan-950/60 text-cyan-300 font-bold' : ''}>
              <td className="p-3">&gt; 2500 cm²</td>
              <td className="p-3">6.0 mm</td>
              <td className="p-3">{pdpArea > 2500 ? '← ACTIVE RULE' : '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Measured Values Check */}
      <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider pt-2">
        Measured Critical Declarations:
      </h5>
      <div className="space-y-2">
        {fontSensitiveDecls.map((d, i) => {
          const measured = d.measured_font_height_mm || 2.0;
          const isCompliant = measured >= minRequired;
          return (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl bg-gov-950/80 border border-white/[0.06] text-xs"
            >
              <div>
                <span className="font-bold text-white block">{d.field_name}</span>
                <span className="text-slate-400 text-[11px] font-mono">{d.statutory_rule_ref}</span>
              </div>
              <div className="text-right">
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded ${
                    isCompliant ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
                  }`}
                >
                  {measured} mm
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                  (Min: ≥ {minRequired} mm)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
