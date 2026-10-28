import React, { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  FileDown,
  Layers,
  Eye
} from 'lucide-react';
import { api, STORAGE_BASE } from '../services/api';
import { subscribeSync } from '../services/sync';

export default function Dashboard({ onSelectInspection }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await api.getDashboardAnalytics();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(true);
  }, []);

  // Real-time synchronization across all browser tabs and focus events
  useEffect(() => {
    const unsubscribe = subscribeSync(() => {
      fetchStats(false);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span className="text-[11px] uppercase font-bold tracking-wider text-cyan-300">
              National Legal Metrology Enforcement Cell
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Enforcement & Compliance Dashboard
          </h1>
          <p className="text-sm text-slate-300 mt-1.5">
            Real-time analytics across retail & e-commerce packaging audits, repeat offender monitoring, and seizure notice issuance.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="bg-gov-800 hover:bg-gov-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 border border-white/10 self-start transition shadow-md"
        >
          <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Audits */}
        <div className="glass-panel rounded-2xl p-6 shadow-card-dark relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400">Total Label Audits</span>
              <h3 className="text-3xl font-mono font-extrabold text-white mt-1.5">
                {stats?.total_inspections || 0}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
            <span>Under LMPC Rules, 2011</span>
          </div>
        </div>

        {/* Overall Compliance Rate */}
        <div className="glass-panel rounded-2xl p-6 shadow-card-dark relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400">Compliance Rate</span>
              <h3 className="text-3xl font-mono font-extrabold text-emerald-400 mt-1.5">
                {stats?.overall_compliance_rate || 0}%
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-glow-emerald">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-400">
            <span>Compliant Packages: <b className="text-white font-mono">{stats?.compliant_count || 0}</b></span>
          </div>
        </div>

        {/* Statutory Violations */}
        <div className="glass-panel rounded-2xl p-6 shadow-card-dark relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-red-400">Statutory Violations</span>
              <h3 className="text-3xl font-mono font-extrabold text-red-400 mt-1.5">
                {stats?.non_compliant_count || 0}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 shadow-glow-red">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-red-300">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5 animate-pulse"></span>
            <span>Section 18 Notice Required</span>
          </div>
        </div>

        {/* Warnings / Borderline */}
        <div className="glass-panel rounded-2xl p-6 shadow-card-dark relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-amber-400">Warnings / Minor</span>
              <h3 className="text-3xl font-mono font-extrabold text-amber-300 mt-1.5">
                {stats?.warning_count || 0}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-400">
            <span>Font Size & Incomplete Address</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Violation Breakdown & Category Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Violations by Statutory Rule */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 shadow-card-dark space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Infringements by Statutory Rule (LMPC 2011)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Enforcement Priority</span>
          </div>

          <div className="space-y-4 pt-1">
            {stats?.violations_by_rule?.length > 0 ? (
              stats.violations_by_rule.map((item, idx) => (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-bold text-white">
                      [{item.rule_code}] {item.rule_name}
                    </span>
                    <span className="font-mono text-red-400 font-bold">
                      {item.count} breaches ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gov-950 rounded-full h-2.5 overflow-hidden border border-white/[0.08]">
                    <div
                      className="bg-gradient-to-r from-red-500 to-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-slate-400 text-xs">
                No statutory violations logged yet. Scans recorded in the Inspector Scanner will populate real-time metrics here.
              </div>
            )}
          </div>
        </div>

        {/* Category Compliance Matrix */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 shadow-card-dark space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Category Compliance Performance</span>
            </h3>
          </div>

          <div className="space-y-3 pt-1">
            {stats?.category_stats?.length > 0 ? (
              stats.category_stats.map((cat, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-gov-950/80 border border-white/[0.08] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{cat.category}</span>
                    <span className="text-slate-400 text-[11px] mt-0.5 block">
                      {cat.inspections_count} Audits • {cat.violations_count} Breaches
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-emerald-400 block text-sm">
                      {cat.compliance_rate}%
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Compliant</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-slate-400 text-xs">
                Category distribution will appear as scans are recorded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Recent Inspections Table */}
      <div className="glass-panel rounded-2xl border border-white/[0.08] shadow-card-dark overflow-hidden">
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white">Recent Enforcement Inspections</h3>
          <span className="text-xs text-slate-400 font-mono">Real-Time Audit Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gov-950/90 text-slate-400 border-b border-white/[0.08] uppercase font-bold text-[11px] tracking-wider">
              <tr>
                <th className="p-4">Product & Brand</th>
                <th className="p-4">Category</th>
                <th className="p-4">Verdict</th>
                <th className="p-4">Score</th>
                <th className="p-4">Violations</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-200">
              {stats?.recent_inspections?.length > 0 ? (
                stats.recent_inspections.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition">
                    <td className="p-4 font-bold text-white">
                      {item.product_name} <span className="text-slate-400 text-xs font-normal">({item.brand})</span>
                    </td>
                    <td className="p-4 text-slate-300">{item.category}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          item.compliance_verdict === 'COMPLIANT'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : item.compliance_verdict === 'WARNING'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-red-500/15 text-red-400 border-red-500/30'
                        }`}
                      >
                        {item.compliance_verdict}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-cyan-300">{item.overall_compliance_score}%</td>
                    <td className="p-4 font-mono text-red-400 font-bold">{item.violations_count}</td>
                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => onSelectInspection && onSelectInspection(item.id)}
                        className="text-cyan-400 hover:text-cyan-300 font-bold"
                      >
                        Inspect Audit
                      </button>
                      <a
                        href={api.getPdfReportUrl(item.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-red-950/60 border border-red-800/80 text-red-400 hover:text-red-300 inline-flex items-center transition"
                        title="Download Form 1 Notice PDF"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    No inspections recorded yet. Start scanning packages in the Inspector Scanner.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
