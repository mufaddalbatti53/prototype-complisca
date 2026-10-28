import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileDown,
  FileJson,
  Loader2,
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Gavel
} from 'lucide-react';
import { api } from '../services/api';
import { useRole } from '../context/RoleContext';
import { subscribeSync, broadcastSync } from '../services/sync';
import InspectionCanvas from '../components/InspectionCanvas';
import DeclarationTable from '../components/DeclarationTable';
import FontAnalysisCard from '../components/FontAnalysisCard';
import ViolationSummary from '../components/ViolationSummary';

export default function InspectionDetail({ inspectionId, onBack }) {
  const { role } = useRole();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDecl, setSelectedDecl] = useState(null);

  // Party reply form
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  const fetchDetail = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await api.getInspectionDetail(inspectionId);
      setInspection(data);
      if (data?.party_reply) {
        setReplyText(data.party_reply);
      }
      if (data?.declarations?.length > 0 && !selectedDecl) {
        setSelectedDecl(data.declarations[0]);
      }
    } catch (err) {
      console.error('Failed to fetch inspection detail', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    if (inspectionId) {
      fetchDetail(true);
    }
  }, [inspectionId]);

  // Real-time synchronization across all browser tabs and focus events
  useEffect(() => {
    const unsubscribe = subscribeSync((event) => {
      // If this inspection or any notice was modified, refresh data
      if (inspectionId) {
        fetchDetail(false);
      }
    });
    return unsubscribe;
  }, [inspectionId]);

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const updated = await api.submitPartyReply(inspectionId, { reply_text: replyText.trim() });
      setInspection(updated);
      setReplySuccess(true);
      setTimeout(() => setReplySuccess(false), 4000);
      broadcastSync('REPLY_SUBMITTED', { inspectionId });
    } catch (err) {
      alert('Failed to submit show-cause reply.');
    } finally {
      setReplying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-28 text-center text-slate-500 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-brand-600" />
        <p className="text-sm font-semibold">Loading statutory audit evidence record...</p>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <p className="text-base font-bold text-slate-900">Inspection record not found.</p>
        <button onClick={onBack} className="mt-4 text-brand-600 hover:underline text-xs font-bold">
          Return to Audit History
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition shadow-sm"
            title="Back to History"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                Ref: {inspection.notice_number || inspection.id}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {new Date(inspection.created_at).toLocaleString()}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                inspection.notice_status === 'REPLIED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : inspection.notice_status === 'PROSECUTION_INITIATED'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {inspection.notice_status || 'SHOW_CAUSE_ISSUED'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              {inspection.product_name} <span className="text-brand-600 font-normal text-lg">({inspection.brand})</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <a
            href={api.getPdfReportUrl(inspection.id)}
            target="_blank"
            rel="noreferrer"
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm transition"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Form 1 Notice</span>
          </a>
          <a
            href={api.getJsonReportUrl(inspection.id)}
            target="_blank"
            rel="noreferrer"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 flex items-center space-x-1.5 transition shadow-sm"
          >
            <FileJson className="w-4 h-4 text-brand-600" />
            <span>Export JSON</span>
          </a>
        </div>
      </div>

      {/* Show-Cause Notice & Noticee Response Panel */}
      {inspection.compliance_verdict === 'NON_COMPLIANT' && (
        <div className="bg-amber-50/50 rounded-2xl border border-amber-200 p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Statutory Show-Cause Notice Period (Section 15 & 18, Legal Metrology Act)
              </h3>
            </div>
            <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300">
              Notice Window: 15 Statutory Days from Issuance
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Existing Explanation or Submission */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Inspected Entity Explanation & Rectification Record:
              </label>
              {inspection.party_reply ? (
                <div className="p-3.5 rounded-xl bg-white border border-emerald-300 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between text-[11px] text-emerald-700 font-bold">
                    <span>✓ Legal Reply Logged</span>
                    <span className="font-mono text-slate-500">
                      {inspection.party_reply_date ? new Date(inspection.party_reply_date).toLocaleDateString() : 'Recorded'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-mono">
                    "{inspection.party_reply}"
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 italic">
                  No show-cause explanation has been submitted yet by the noticee ({inspection.store_name}).
                </div>
              )}
            </div>

            {/* Response Form */}
            <form onSubmit={handleSubmitReply} className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700 block flex items-center justify-between">
                <span>Submit / Update Explanation (Noticee Action):</span>
                {replySuccess && (
                  <span className="text-emerald-700 text-[11px] font-bold flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Reply Recorded!
                  </span>
                )}
              </label>
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="State corrective remedy (e.g. Non-compliant packaging stock recalled; manufacturing stamping line re-calibrated with metric units)..."
                className="w-full rounded-xl p-3 text-xs text-slate-900 bg-white border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={replying || !replyText.trim()}
                  className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{replying ? 'Logging...' : 'Log Show-Cause Reply'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Statutory Enforcement Escalation Bar (Officer & Superadmin) */}
          {(role === 'SUPERADMIN' || role === 'OFFICER') && (
            <div className="pt-3 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-600">
                Statutory Enforcement Actions:
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const updated = await api.escalateNotice(inspection.id, { action: 'FINAL_WARNING' });
                      setInspection(updated);
                      broadcastSync('NOTICE_ESCALATED', { inspectionId: inspection.id, action: 'FINAL_WARNING' });
                    } catch (e) {
                      alert('Failed to escalate notice');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold hover:bg-amber-200 transition shadow-sm"
                >
                  Issue Final Warning
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Initiate formal court prosecution under Section 36 of Legal Metrology Act?')) {
                      try {
                        const updated = await api.escalateNotice(inspection.id, { action: 'PROSECUTION_INITIATED' });
                        setInspection(updated);
                        broadcastSync('NOTICE_ESCALATED', { inspectionId: inspection.id, action: 'PROSECUTION_INITIATED' });
                      } catch (e) {
                        alert('Failed to initiate prosecution');
                      }
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-purple-100 text-purple-900 border border-purple-300 text-[11px] font-bold hover:bg-purple-200 transition shadow-sm"
                >
                  Initiate Sec 36 Prosecution
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const updated = await api.escalateNotice(inspection.id, { action: 'CLOSED' });
                      setInspection(updated);
                      broadcastSync('NOTICE_ESCALATED', { inspectionId: inspection.id, action: 'CLOSED' });
                    } catch (e) {
                      alert('Failed to close notice');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold hover:bg-emerald-200 transition shadow-sm"
                >
                  Mark Rectified & Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Left Canvas + Right Audit Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 h-[500px] lg:h-[720px]">
          <InspectionCanvas
            inspection={inspection}
            selectedDecl={selectedDecl}
            onSelectDecl={setSelectedDecl}
          />
        </div>

        <div className="lg:col-span-5 space-y-6">
          <ViolationSummary inspection={inspection} />
          <DeclarationTable
            declarations={inspection.declarations}
            selectedDecl={selectedDecl}
            onSelectDecl={setSelectedDecl}
          />
          <FontAnalysisCard
            pdpArea={inspection.pdp_area_sqcm}
            declarations={inspection.declarations}
          />
        </div>
      </div>
    </div>
  );
}
