import React, { useState, useEffect } from 'react';
import { Check, Save, RefreshCw, Scale, SlidersHorizontal } from 'lucide-react';
import { api } from '../services/api';

export default function RuleConfig() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(null);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await api.getRules();
      setRules(data);
    } catch (err) {
      console.error('Failed to load rules', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggle = (ruleCode, field) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.rule_code === ruleCode) {
          return { ...r, [field]: !r[field] };
        }
        return r;
      })
    );
  };

  const handleSaveRule = async (rule) => {
    try {
      await api.updateRule(rule.rule_code, {
        is_mandatory: rule.is_mandatory,
        is_active: rule.is_active,
        parameters: rule.parameters,
        description: rule.description,
      });
      setSavedSuccess(rule.rule_code);
      setTimeout(() => setSavedSuccess(null), 3000);
    } catch (err) {
      alert(`Failed to save changes for ${rule.rule_name}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 mb-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] uppercase font-bold tracking-wider text-cyan-300">
              Statutory Parameter Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Configurable Legal Metrology Rules Engine
          </h1>
          <p className="text-sm text-slate-300 mt-1.5 max-w-3xl">
            Rules are stored as editable system settings (SIH 2026 methodology). Enforcement authorities can adjust thresholds, toggle mandates, or incorporate gazette amendments without code changes.
          </p>
        </div>

        <button
          onClick={loadRules}
          className="bg-gov-800 hover:bg-gov-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 border border-white/10 self-start transition shadow-md"
        >
          <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Rules</span>
        </button>
      </div>

      {/* Rules List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading rule definitions...</div>
      ) : (
        <div className="space-y-5">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="glass-panel rounded-2xl border border-white/[0.08] shadow-card-dark p-6 space-y-5 transition duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/90 px-2.5 py-1 rounded-lg border border-cyan-500/40">
                      {rule.statutory_reference}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {rule.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1.5">{rule.rule_name}</h3>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Modern Toggle: Mandatory */}
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.is_mandatory}
                      onChange={() => handleToggle(rule.rule_code, 'is_mandatory')}
                      className="w-4 h-4 rounded bg-gov-950 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <span>Mandatory</span>
                  </label>

                  {/* Modern Toggle: Active */}
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.is_active}
                      onChange={() => handleToggle(rule.rule_code, 'is_active')}
                      className="w-4 h-4 rounded bg-gov-950 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <span>Active in Engine</span>
                  </label>

                  <button
                    onClick={() => handleSaveRule(rule)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-glow-cyan transition"
                  >
                    {savedSuccess === rule.rule_code ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Rule</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block mb-1.5">Legal Description:</span>
                  <p className="text-slate-200 leading-relaxed bg-gov-950/70 p-3.5 rounded-xl border border-white/[0.06]">
                    {rule.description}
                  </p>
                </div>
                <div>
                  <span className="text-red-400 font-bold block mb-1.5">Statutory Breach Penalty:</span>
                  <p className="text-red-200 leading-relaxed bg-red-950/30 p-3.5 rounded-xl border border-red-900/50">
                    {rule.statutory_penalty_summary}
                  </p>
                </div>
              </div>

              {/* JSON Parameters Preview */}
              {rule.parameters && Object.keys(rule.parameters).length > 0 && (
                <div className="bg-gov-950/90 p-4 rounded-xl border border-white/[0.08] text-[11px] font-mono text-slate-300">
                  <span className="text-slate-500 block mb-1.5 font-sans font-bold">Active Engine Parameters:</span>
                  <pre className="overflow-x-auto whitespace-pre-wrap text-cyan-300">
                    {JSON.stringify(rule.parameters, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
