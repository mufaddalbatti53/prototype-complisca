import React, { useState } from 'react';
import {
  Sliders,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileCode,
  Layers,
  Sparkles,
  Calendar
} from 'lucide-react';
import { useAicte } from '../context/AicteContext';
import { useRole } from '../context/RoleContext';

export default function Timelines() {
  const { config, updateConfig, resetConfigDefaults, simulatedDate, showToast, logAuditEvent } = useAicte();
  const { role, roleConfig } = useRole();

  // JSON editor state
  const [jsonText, setJsonText] = useState(() => JSON.stringify(config, null, 2));
  const [jsonError, setJsonError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Synchronize when config changes externally (e.g. reset)
  React.useEffect(() => {
    setJsonText(JSON.stringify(config, null, 2));
    setJsonError(null);
  }, [config]);

  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonError(null);
      updateConfig(parsed, role, roleConfig.title);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setJsonError(err.message);
    }
  };

  const handleReset = () => {
    resetConfigDefaults(role, roleConfig.title);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="kicker-line mb-1">MODULE F · APPROVAL PROCESS HANDBOOK (APH) CONFIGURATION</div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Approval Rules & Timeline Limits
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Customize time limits for document checks, inspection committee visits, and committee reviews.
            Also controls document expiration warning dates (90, 60, and 30 days ahead) and automatic escalation rules.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset to Standard AICTE Rules</span>
          </button>
        </div>
      </div>

      {/* Visual Rule Parameter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stage SLA Card */}
        <div className="civic-card p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Clock className="w-4 h-4 text-[#1e3a8a]" />
            <span className="font-serif font-bold text-sm text-slate-900">Stage SLA Durations</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-600">Initial Scrutiny SLA:</span>
              <span className="font-bold text-[#1e3a8a]">{config.stage_sla_days.scrutiny} Days</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-600">EVC Queue Window:</span>
              <span className="font-bold text-[#1e3a8a]">{config.stage_sla_days.evc_queue} Days</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-600">New Institution EVC:</span>
              <span className="font-bold text-amber-700">{config.stage_sla_days.evc_new_institution} Days</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-600">SAC Review Window:</span>
              <span className="font-bold text-[#1e3a8a]">{config.stage_sla_days.sac_review} Days</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600">Final Decision SLA:</span>
              <span className="font-bold text-[#1e3a8a]">{config.stage_sla_days.decision} Days</span>
            </div>
          </div>
        </div>

        {/* Document & Undertakings SLA Card */}
        <div className="civic-card p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-serif font-bold text-sm text-slate-900">Compliance & Alerts</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-600">Undertaking Due Window:</span>
              <span className="font-bold text-emerald-700">{config.undertaking_due_days} Days</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-600">Advance Expiry Alerts:</span>
              <span className="font-bold text-slate-900">
                {config.doc_expiry_alerts_days.join('d, ')}d
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-600">Regulatory Safeguard:</span>
              <span className="font-bold text-emerald-700">Enforced</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600">Statutory Protected:</span>
              <span className="font-bold text-purple-700">{config.protected ? 'YES (APH 2026)' : 'NO'}</span>
            </div>
          </div>
        </div>

        {/* Escalation Hierarchy Card */}
        <div className="civic-card p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-rose-600" />
            <span className="font-serif font-bold text-sm text-slate-900">4-Tier Escalation Ladder</span>
          </div>
          <div className="space-y-1.5 text-xs">
            {config.escalation_ladder.map((ladder) => (
              <div key={ladder.level} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100 font-mono text-[11px]">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-900">L{ladder.level}:</span>
                  <span className="text-slate-600 truncate max-w-[120px]">{ladder.target}</span>
                </div>
                <span className={`font-bold ${ladder.days < 0 ? 'text-blue-600' : ladder.days === 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {ladder.days <= 0 ? `${ladder.days}d` : `+${ladder.days}d`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive JSON Editor */}
      <div className="civic-card p-5 rounded-2xl bg-slate-950 text-white border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-amber-400" />
            <div>
              <span className="font-serif font-bold text-sm text-white">Live APH Statutory Rule Schema (JSON)</span>
              <span className="text-[11px] text-slate-400 font-mono block">
                Any modifications take immediate effect across SLA sweeps and simulated clock ticks
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {saveSuccess && (
              <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1 mr-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Saved & Synchronized</span>
              </span>
            )}
            <button
              onClick={handleSaveJson}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-slate-950" />
              <span>Save & Apply Configuration</span>
            </button>
          </div>
        </div>

        {jsonError && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>JSON Parse Error: {jsonError}</span>
          </div>
        )}

        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
          <textarea
            rows={18}
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setJsonError(null);
            }}
            spellCheck={false}
            className="w-full p-4 font-mono text-xs text-amber-200 bg-transparent focus:outline-none leading-relaxed resize-y"
          />
        </div>
      </div>
    </div>
  );
}
