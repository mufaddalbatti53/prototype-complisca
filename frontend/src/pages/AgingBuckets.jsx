import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertOctagon,
  FileDown,
  Gavel,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api, STORAGE_BASE } from '../services/api';
import { useRole } from '../context/RoleContext';

export default function AgingBuckets({ onSelectInspection }) {
  const { role } = useRole();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeBucketKey, setActiveBucketKey] = useState('active_0_15');
  const [actionNoticeId, setActionNoticeId] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  const loadBuckets = async () => {
    setLoading(true);
    try {
      const res = await api.getAgingBuckets();
      setData(res);
    } catch (err) {
      console.error('Failed to load aging buckets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuckets();
  }, []);

  const handleEscalate = async (noticeId, action) => {
    try {
      await api.escalateNotice(noticeId, { action });
      setActionSuccessMsg(`Notice escalated: ${action}`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
      loadBuckets();
    } catch (err) {
      alert('Failed to escalate notice status.');
    }
  };

  const buckets = data?.buckets || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 mb-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] uppercase font-bold tracking-wider text-cyan-300">
              Statutory Enforcement & Show-Cause Aging Monitor
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Show-Cause Notice Aging Buckets
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-3xl">
            Under <b>Section 15, 18 & 36 of the Legal Metrology Act, 2009</b>, parties issued non-compliance inspection notices must respond within <b>15 days</b>. This module monitors delinquency aging, escalation milestones, and judicial prosecution readiness.
          </p>
        </div>

        <button
          onClick={loadBuckets}
          className="p-2.5 rounded-xl bg-gov-800 hover:bg-gov-700 text-slate-300 border border-white/10 transition self-start"
          title="Reload Notice Buckets"
        >
          <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Action Toast */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center space-x-2 shadow-glow-emerald">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* 4 Interactive Aging Buckets Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bucket 1: 0 - 15 Days */}
        <div
          onClick={() => setActiveBucketKey('active_0_15')}
          className={`cursor-pointer glass-panel rounded-2xl p-5 border transition-all duration-200 ${
            activeBucketKey === 'active_0_15'
              ? 'border-emerald-500 bg-emerald-950/20 shadow-glow-emerald'
              : 'border-white/[0.08] hover:border-emerald-500/40'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Stage 1 (0 – 15 Days)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <h3 className="text-3xl font-mono font-extrabold text-emerald-400 mt-2">
            {buckets?.active_0_15?.count || 0}
          </h3>
          <p className="text-xs text-slate-300 mt-1 font-semibold">Active Show-Cause Window</p>
          <span className="text-[10px] text-slate-500 mt-2 block font-mono">
            Noticee within 15-day statutory response limit.
          </span>
        </div>

        {/* Bucket 2: 16 - 30 Days */}
        <div
          onClick={() => setActiveBucketKey('overdue_16_30')}
          className={`cursor-pointer glass-panel rounded-2xl p-5 border transition-all duration-200 ${
            activeBucketKey === 'overdue_16_30'
              ? 'border-amber-500 bg-amber-950/20 shadow-glow-amber'
              : 'border-white/[0.08] hover:border-amber-500/40'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Stage 2 (16 – 30 Days)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          </div>
          <h3 className="text-3xl font-mono font-extrabold text-amber-400 mt-2">
            {buckets?.overdue_16_30?.count || 0}
          </h3>
          <p className="text-xs text-slate-300 mt-1 font-semibold">Overdue / Final Warning</p>
          <span className="text-[10px] text-slate-500 mt-2 block font-mono">
            Response window expired. Final show-cause active.
          </span>
        </div>

        {/* Bucket 3: 31 - 60 Days */}
        <div
          onClick={() => setActiveBucketKey('actionable_31_60')}
          className={`cursor-pointer glass-panel rounded-2xl p-5 border transition-all duration-200 ${
            activeBucketKey === 'actionable_31_60'
              ? 'border-red-500 bg-red-950/25 shadow-glow-red'
              : 'border-white/[0.08] hover:border-red-500/40'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Stage 3 (31 – 60 Days)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          </div>
          <h3 className="text-3xl font-mono font-extrabold text-red-400 mt-2">
            {buckets?.actionable_31_60?.count || 0}
          </h3>
          <p className="text-xs text-slate-300 mt-1 font-semibold">Actionable Seizure (Sec 36)</p>
          <span className="text-[10px] text-slate-500 mt-2 block font-mono">
            Subject to Section 15 seizure and ₹25,000 fine.
          </span>
        </div>

        {/* Bucket 4: 60+ Days */}
        <div
          onClick={() => setActiveBucketKey('prosecution_60_plus')}
          className={`cursor-pointer glass-panel rounded-2xl p-5 border transition-all duration-200 ${
            activeBucketKey === 'prosecution_60_plus'
              ? 'border-purple-500 bg-purple-950/25 shadow-glow-purple'
              : 'border-white/[0.08] hover:border-purple-500/40'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Stage 4 (60+ Days)
            </span>
            <Gavel className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <h3 className="text-3xl font-mono font-extrabold text-purple-400 mt-2">
            {buckets?.prosecution_60_plus?.count || 0}
          </h3>
          <p className="text-xs text-slate-300 mt-1 font-semibold">Court Prosecution</p>
          <span className="text-[10px] text-slate-500 mt-2 block font-mono">
            Judicial Magistrate prosecution lodged.
          </span>
        </div>
      </div>

      {/* Selected Bucket Detail List */}
      <div className="glass-panel rounded-2xl border border-white/[0.08] shadow-card-dark p-6 space-y-4">
        <div className="border-b border-white/[0.08] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-white">
              {buckets?.[activeBucketKey]?.title || 'Notice Records'}
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Total Delinquent Notices in this Bucket: {buckets?.[activeBucketKey]?.count || 0}
            </span>
          </div>

          <div className="text-xs font-mono bg-gov-950 px-3 py-1.5 rounded-xl border border-white/10 text-cyan-300">
            Estimated Compounding Exposure: ₹{(buckets?.[activeBucketKey]?.notices || []).reduce((acc, n) => acc + (n.penalty_estimate_inr || 25000), 0).toLocaleString()}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Calculating statutory notice delinquency timelines...
          </div>
        ) : (buckets?.[activeBucketKey]?.notices || []).length === 0 ? (
          <div className="py-14 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">Zero delinquent notices in this aging bracket.</p>
            <p className="text-xs text-slate-500">All registered entities in this period are compliant or closed.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06] space-y-3">
            {(buckets?.[activeBucketKey]?.notices || []).map((notice) => (
              <div
                key={notice.id}
                className="pt-3 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-gov-950/70 border border-white/[0.06] hover:border-cyan-500/30 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/40">
                      {notice.notice_number || notice.id}
                    </span>
                    <span className="text-xs font-bold text-white">{notice.product_name}</span>
                    <span className="text-xs text-slate-400">({notice.brand})</span>
                  </div>

                  <div className="text-xs text-slate-300 flex items-center space-x-3 text-[11px] pt-1">
                    <span className="text-slate-400">Store: <b>{notice.store_name}</b></span>
                    <span>•</span>
                    <span className="text-slate-400">Zone: {notice.location}</span>
                    <span>•</span>
                    <span className="font-mono text-amber-300">Age: <b>{notice.age_days} days</b></span>
                  </div>

                  <div className="pt-1 flex items-center space-x-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                      notice.notice_status === 'PROSECUTION_INITIATED'
                        ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                        : notice.notice_status === 'FINAL_WARNING'
                        ? 'bg-red-950 text-red-300 border-red-500/40'
                        : notice.has_reply
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-950 text-amber-300 border-amber-500/40'
                    }`}>
                      {notice.has_reply ? 'REPLY SUBMITTED' : notice.notice_status}
                    </span>
                    <span className="text-[11px] font-mono text-red-400 font-bold">
                      Sec 36 Penalty: ₹{notice.penalty_estimate_inr.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => onSelectInspection && onSelectInspection(notice.id)}
                    className="px-3 py-1.5 rounded-lg bg-gov-800 hover:bg-gov-700 text-xs font-semibold text-cyan-300 border border-white/10 flex items-center space-x-1 transition"
                  >
                    <span>View Evidence</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={api.getPdfReportUrl(notice.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-red-950/80 text-red-300 hover:text-white border border-red-700/60"
                    title="Form 1 Notice PDF"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                  </a>

                  {(role === 'SUPERADMIN' || role === 'OFFICER') && (
                    <div className="flex items-center space-x-1">
                      {notice.notice_status !== 'FINAL_WARNING' && (
                        <button
                          onClick={() => handleEscalate(notice.id, 'FINAL_WARNING')}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition"
                        >
                          Issue Final Warning
                        </button>
                      )}
                      {notice.notice_status !== 'PROSECUTION_INITIATED' && (
                        <button
                          onClick={() => handleEscalate(notice.id, 'PROSECUTION_INITIATED')}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-500/40 text-[10px] font-bold transition"
                        >
                          Lodge Prosecution
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
