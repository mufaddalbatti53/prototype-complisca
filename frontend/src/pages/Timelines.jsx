import React, { useState } from 'react';
import RuleConfig from './RuleConfig';
import { useAicte } from '../context/AicteContext';
import { useRole } from '../context/RoleContext';
import { FileCode, Sliders, CheckCircle2, AlertTriangle, Save } from 'lucide-react';

export default function Timelines() {
  const { config, updateConfig, simulatedDate } = useAicte();
  const { role, roleConfig } = useRole();

  const [activeView, setActiveView] = useState('VISUAL'); // 'VISUAL' or 'JSON'
  const [jsonText, setJsonText] = useState(() => JSON.stringify(config, null, 2));
  const [jsonError, setJsonError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Sub-navigation pill toggle between Visual Matrix and Raw JSON */}
      <div className="max-w-7xl mx-auto px-4 pt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveView('VISUAL')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeView === 'VISUAL'
                ? 'bg-white text-[#1e3a8a] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Visual Parameter Matrix & Simulation</span>
          </button>
          <button
            onClick={() => setActiveView('JSON')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeView === 'JSON'
                ? 'bg-white text-[#1e3a8a] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Raw JSON Schema</span>
          </button>
        </div>
      </div>

      {activeView === 'VISUAL' ? (
        <RuleConfig />
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-2 space-y-4">
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
      )}
    </div>
  );
}
