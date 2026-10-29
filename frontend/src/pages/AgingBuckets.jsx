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
import { subscribeSync, broadcastSync } from '../services/sync';
import { formatIST } from '../utils/date';

export default function AgingBuckets({ onSelectInspection }) {
  const { role } = useRole();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeBucketKey, setActiveBucketKey] = useState('active_0_15');
  const [actionNoticeId, setActionNoticeId] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  const loadBuckets = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await api.getAgingBuckets();
      setData(res);
    } catch (err) {
      console.error('Failed to load aging buckets', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    loadBuckets(true);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeSync(() => {
      loadBuckets(false);
    });
    return unsubscribe;
  }, []);

  const handleEscalate = async (noticeId, action) => {
    try {
      await api.escalateNotice(noticeId, { action });
      setActionSuccessMsg(`Notice escalated: ${action}`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
      loadBuckets(false);
      broadcastSync('NOTICE_ESCALATED', { noticeId, action });
    } catch (err) {
      alert('Failed to escalate notice status.');
    }
  };

  const buckets = data?.buckets || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 mb-2">
            <Clock className="w-3.5 h-3.5 text-brand-600" />
            <span className="text-[11px] uppercase font-bold tracking-wider text-brand-700">
              Statutory Enforcement & Show-Cause Aging Monitor
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Show-Cause Notice Aging Buckets
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Under <b>Section 15, 18 & 36 of the Legal Metrology Act, 2009</b>, parties issued non-compliance inspection notices must respond within <b>15 days</b>. This module monitors delinquency aging, escalation milestones, and judicial prosecution readiness.
          </p>
        </div>

        <button
          onClick={loadBuckets}
          className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm transition self-start"
          title="Reload Notice Buckets"
        >
          <RefreshCw className={`w-4 h-4 text-brand-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Action Toast */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* 4 Interactive Aging Buckets Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bucket 1: 0 - 15 Days */}
        <div
          onClick={() => setActiveBucketKey('active_0_15')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 bg-white ${
            activeBucketKey === 'active_0_15'
              ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500'
              : 'border-slate-200 hover:border-emerald-300 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Stage 1 (0 – 15 Days)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <h3 className="text-3xl font-mono font-extrabold text-emerald-600 mt-2">
            {buckets?.active_0_15?.count || 0}
          </h3>
          <p className="text-xs text-slate-800 mt-1 font-semibold">Active Show-Cause Window</p>
          <span className="text-[10px] text-slate-500 mt-2 block font-mono">
            Noticee within 15-day statutory response limit.
          </span>
        </div>

        {/* Bucket 2: 16 - 30 Days */}
        <div
          onClick={() => setActiveBucketKey('overdue_16_30')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 bg-white ${
            activeBucketKey === 'overdue_16_30'
              ? 'border-amber-500 bg-amber-50/50 shadow-sm ring-1 ring-amber-500'
              : 'border-slate-200 hover:border-amber-300 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Stage 2 (16 – 30 Days)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          </div>
          <h3 className="text-3xl font-mono font-extrabold text-amber-600 mt-2">
            {buckets?.overdue_16_30?.count || 0}
          </h3>
          <p className="text-xs text-slate-800 mt-1 font-semibold">Overdue / Final Warning</p>
          <span className="text-[10px] text-slate-500 mt-2 block font-mono">
            Response window expired. Final show-cause active.
          </span>
        </div>

        {/* Bucket 3: 31 - 60 Days */}
        <div
          onClick={() => setActiveBucketKey('actionable_31_60')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 bg-white ${
            activeBucketKey === 'actionable_31_60'
              ? 'border-rose-500 bg-rose-50/50 shadow-sm ring-1 ring-rose-500'
              : 'border-slate-200 hover:border-rose-300 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Stage 3 (31 – 60 Days)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          </div>
          <h3 className="text-3xl font-mono font-extrabold text-rose-600 mt-2">
            {buckets?.actionable_31_60?.count || 0}
          </h3>
          <p className="text-xs text-slate-800 mt-1 font-semibold">Actionable Seizure (Sec 36)</p>
          <span className="text-[10px] text-slate-500 mt-2 block font-mono">
            Subject to Section 15 seizure and ₹25,000 fine.
          </span>
        </div>

        {/* Bucket 4: 60+ Days */}
        <div
          onClick={() => setActiveBucketKey('prosecution_60_plus')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 bg-white ${
            activeBucketKey === 'prosecution_60_plus'
              ? 'border-purple-500 bg-purple-50/50 shadow-sm ring-1 ring-purple-500'
              : 'border-slate-200 hover:border-purple-300 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Stage 4 (60+ Days)
            </span>
            <Gavel className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <h3 className="text-3xl font-mono font-extrabold text-purple-600 mt-2">
            {buckets?.prosecution_60_plus?.count || 0}
          </h3>
          <p className="text-xs text-slate-800 mt-1 font-semibold">Court Prosecution</p>
          <span className="text-[10px] text-slate-500 mt-2 block font-mono">
            Judicial Magistrate prosecution lodged.
          </span>
        </div>
      </div>

      {/* Selected Bucket Detail List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {buckets?.[activeBucketKey]?.title || 'Notice Records'}
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Total Delinquent Notices in this Bucket: {buckets?.[activeBucketKey]?.count || 0}
            </span>
          </div>

          <div className="text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold">
            Estimated Compounding Exposure: ₹{(buckets?.[activeBucketKey]?.notices || []).reduce((acc, n) => acc + (n.penalty_estimate_inr || 25000), 0).toLocaleString()}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            Calculating statutory notice delinquency timelines...
          </div>
        ) : (buckets?.[activeBucketKey]?.notices || []).length === 0 ? (
          <div className="py-14 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">Zero delinquent notices in this aging bracket.</p>
            <p className="text-xs text-slate-500">All registered entities in this period are compliant or closed.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 space-y-3">
            {(buckets?.[activeBucketKey]?.notices || []).map((notice) => (
              <div
                key={notice.id}
                className="pt-3 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-brand-300 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {notice.notice_number || notice.id}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{notice.product_name}</span>
                    <span className="text-xs text-slate-500">({notice.brand})</span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center space-x-3 text-[11px] pt-1">
                    <span className="text-slate-500">Store: <b className="text-slate-800">{notice.store_name}</b></span>
                    <span>•</span>
                    <span className="text-slate-500">Zone: <span className="text-slate-800">{notice.location}</span></span>
                    <span>•</span>
                    <span className="font-mono text-amber-700">Age: <b>{notice.age_days} days</b></span>
                    <span>•</span>
                    <span className="font-mono text-slate-500">Issued: {formatIST(notice.created_at, false)}</span>
                  </div>

                  <div className="pt-1 flex items-center space-x-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                      notice.notice_status === 'PROSECUTION_INITIATED'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : notice.notice_status === 'FINAL_WARNING'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : notice.has_reply
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {notice.has_reply ? 'REPLY SUBMITTED' : notice.notice_status}
                    </span>
                    <span className="text-[11px] font-mono text-rose-600 font-bold">
                      Sec 36 Penalty: ₹{notice.penalty_estimate_inr.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => onSelectInspection && onSelectInspection(notice.id)}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-xs font-semibold text-brand-700 border border-slate-200 shadow-sm flex items-center space-x-1 transition"
                  >
                    <span>View Evidence</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={api.getPdfReportUrl(notice.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 shadow-sm"
                    title="Form 1 Notice PDF"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                  </a>

                  {(role === 'SUPERADMIN' || role === 'OFFICER') && (
                    <div className="flex items-center space-x-1">
                      {notice.notice_status !== 'FINAL_WARNING' && (
                        <button
                          onClick={() => handleEscalate(notice.id, 'FINAL_WARNING')}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold transition shadow-sm"
                        >
                          Issue Final Warning
                        </button>
                      )}
                      {notice.notice_status !== 'PROSECUTION_INITIATED' && (
                        <button
                          onClick={() => handleEscalate(notice.id, 'PROSECUTION_INITIATED')}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 text-[10px] font-bold transition shadow-sm"
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
