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
import { formatIST } from '../utils/date';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
            <span className="text-[11px] uppercase font-bold tracking-wider text-sky-700">
              National Legal Metrology Enforcement Cell • Tech Setu
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Enforcement & Compliance Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Real-time analytics across retail & e-commerce packaging audits, repeat offender monitoring, and seizure notice issuance.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 border border-slate-200 self-start transition shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 text-sky-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Audits */}
        <div className="glass-panel rounded-2xl p-6 shadow-xs border border-slate-200 bg-white relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-500">Total Label Audits</span>
              <h3 className="text-3xl font-mono font-extrabold text-slate-900 mt-1.5">
                {stats?.total_inspections || 0}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
            <span>Under LMPC Rules, 2011</span>
          </div>
        </div>

        {/* Overall Compliance Rate */}
        <div className="glass-panel rounded-2xl p-6 shadow-xs border border-slate-200 bg-white relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-500">Compliance Rate</span>
              <h3 className="text-3xl font-mono font-extrabold text-emerald-600 mt-1.5">
                {stats?.overall_compliance_rate || 0}%
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            <span>Compliant Packages: <b className="text-slate-800 font-mono">{stats?.compliant_count || 0}</b></span>
          </div>
        </div>

        {/* Statutory Violations */}
        <div className="glass-panel rounded-2xl p-6 shadow-xs border border-slate-200 bg-white relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-rose-600">Statutory Violations</span>
              <h3 className="text-3xl font-mono font-extrabold text-rose-600 mt-1.5">
                {stats?.non_compliant_count || 0}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-pulse"></span>
            <span>Section 18 Notice Required</span>
          </div>
        </div>

        {/* Warnings / Borderline */}
        <div className="glass-panel rounded-2xl p-6 shadow-xs border border-slate-200 bg-white relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-amber-700">Warnings / Minor</span>
              <h3 className="text-3xl font-mono font-extrabold text-amber-800 mt-1.5">
                {stats?.warning_count || 0}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            <span>Font Size & Incomplete Address</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Violation Breakdown & Category Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Violations by Statutory Rule */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 shadow-xs border border-slate-200 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Infringements by Statutory Rule (LMPC 2011)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Enforcement Priority</span>
          </div>

          <div className="space-y-4 pt-1">
            {stats?.violations_by_rule?.length > 0 ? (
              stats.violations_by_rule.map((item, idx) => (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-bold text-slate-800">
                      [{item.rule_code}] {item.rule_name}
                    </span>
                    <span className="font-mono text-rose-600 font-bold">
                      {item.count} breaches ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                    <div
                      className="bg-gradient-to-r from-rose-500 to-amber-500 h-full rounded-full transition-all duration-500"
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
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 shadow-xs border border-slate-200 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>Category Compliance Performance</span>
            </h3>
          </div>

          <div className="space-y-3 pt-1">
            {stats?.category_stats?.length > 0 ? (
              stats.category_stats.map((cat, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{cat.category}</span>
                    <span className="text-slate-500 text-[11px] mt-0.5 block">
                      {cat.inspections_count} Audits • {cat.violations_count} Breaches
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-emerald-600 block text-sm">
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
      <div className="glass-panel rounded-2xl border border-slate-200 shadow-xs bg-white overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">Recent Enforcement Inspections</h3>
          <span className="text-xs text-slate-400 font-mono">Real-Time Audit Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-bold text-[11px] tracking-wider">
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
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {stats?.recent_inspections?.length > 0 ? (
                stats.recent_inspections.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="p-4 font-bold text-slate-900">
                      {item.product_name} <span className="text-slate-400 text-xs font-normal">({item.brand})</span>
                    </td>
                    <td className="p-4 text-slate-600">{item.category}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          item.compliance_verdict === 'COMPLIANT'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.compliance_verdict === 'WARNING'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.compliance_verdict}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-sky-700">{item.overall_compliance_score}%</td>
                    <td className="p-4 font-mono text-rose-600 font-bold">{item.violations_count}</td>
                    <td className="p-4 text-slate-500 font-mono text-[11px]">
                      {formatIST(item.created_at)}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => onSelectInspection && onSelectInspection(item.id)}
                        className="text-sky-600 hover:text-sky-700 font-bold"
                      >
                        Inspect Audit
                      </button>
                      <a
                        href={api.getPdfReportUrl(item.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 inline-flex items-center transition"
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
