import React, { useState, useEffect } from 'react';
import { Check, Save, RefreshCw, Scale, SlidersHorizontal, RotateCcw, ShieldAlert, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function RuleConfig() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(null);
  const [isSandboxModified, setIsSandboxModified] = useState(false);

  const loadRules = async (forceServer = false) => {
    setLoading(true);
    try {
      const savedLocal = !forceServer ? sessionStorage.getItem('compliscan_local_rules') : null;
      if (savedLocal) {
        setRules(JSON.parse(savedLocal));
        setIsSandboxModified(true);
      } else {
        const data = await api.getRules();
        setRules(data);
        setIsSandboxModified(false);
      }
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
    setRules((prev) => {
      const updated = prev.map((r) => {
        if (r.rule_code === ruleCode) {
          return { ...r, [field]: !r[field] };
        }
        return r;
      });
      // Store in session storage for local testing
      try {
        sessionStorage.setItem('compliscan_local_rules', JSON.stringify(updated));
        setIsSandboxModified(true);
      } catch (e) {}
      return updated;
    });
  };

  const handleSaveRule = async (rule) => {
    try {
      // 1. Save to session storage for local testing
      try {
        sessionStorage.setItem('compliscan_local_rules', JSON.stringify(rules));
        setIsSandboxModified(true);
      } catch (e) {}

      // 2. Send simulation update to API
      await api.updateRule(rule.rule_code, {
        is_mandatory: rule.is_mandatory,
        is_active: rule.is_active,
        parameters: rule.parameters,
        description: rule.description,
      });

      setSavedSuccess(rule.rule_code);
      setTimeout(() => setSavedSuccess(null), 3500);
    } catch (err) {
      alert(`Failed to save changes for ${rule.rule_name}`);
    }
  };

  const handleResetToStatutoryDefaults = async () => {
    if (window.confirm('Reset all rules back to official LMPC Rules 2011 statutory defaults?')) {
      try {
        sessionStorage.removeItem('compliscan_local_rules');
        setIsSandboxModified(false);
        const data = await api.resetRules();
        setRules(data);
        setSavedSuccess('RESET_ALL');
        setTimeout(() => setSavedSuccess(null), 3000);
      } catch (e) {
        // Fallback to reload
        loadRules(true);
      }
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

        <div className="flex items-center space-x-2.5 self-start">
          <button
            onClick={handleResetToStatutoryDefaults}
            className="bg-gov-900 hover:bg-gov-800 text-amber-300 hover:text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border border-amber-500/30 transition shadow-md"
            title="Reset to official statutory defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={() => loadRules(true)}
            className="bg-gov-800 hover:bg-gov-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 border border-white/10 transition shadow-md"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload Rules</span>
          </button>
        </div>
      </div>

      {/* Sandbox Notice Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-gov-900/60 to-gov-950/80 border border-cyan-500/30 flex items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white">Local Testing Sandbox Active</span>
              {isSandboxModified && (
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Custom Testing Overrides Applied
                </span>
              )}
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Modifications apply to your current testing session and tests in the Inspector Scanner. Universal statutory rules are protected; pressing <b>Hard Refresh (F5 / Ctrl+F5)</b> or clicking <b>Reset Defaults</b> instantly restores original statutory standards.
            </p>
          </div>
        </div>
      </div>

      {savedSuccess === 'RESET_ALL' && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center space-x-2 shadow-glow-emerald">
          <Check className="w-4 h-4" />
          <span>All rules successfully restored to official statutory LMPC 2011 defaults!</span>
        </div>
      )}

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
                        <span>Saved to Session!</span>
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
