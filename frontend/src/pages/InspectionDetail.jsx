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

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await api.getInspectionDetail(inspectionId);
      setInspection(data);
      if (data?.party_reply) {
        setReplyText(data.party_reply);
      }
      if (data?.declarations?.length > 0) {
        setSelectedDecl(data.declarations[0]);
      }
    } catch (err) {
      console.error('Failed to fetch inspection detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inspectionId) {
      fetchDetail();
    }
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
    } catch (err) {
      alert('Failed to submit show-cause reply.');
    } finally {
      setReplying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-28 text-center text-slate-400 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-cyan-400" />
        <p className="text-sm font-semibold">Loading statutory audit evidence record...</p>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 glass-panel rounded-2xl">
        <p className="text-base font-bold text-white">Inspection record not found.</p>
        <button onClick={onBack} className="mt-4 text-cyan-400 hover:underline text-xs font-bold">
          Return to Audit History
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-cyan-500/25 shadow-card-dark">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-gov-900 hover:bg-gov-800 border border-white/10 text-slate-300 hover:text-white transition shadow"
            title="Back to History"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-500/40">
                Ref: {inspection.notice_number || inspection.id}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(inspection.created_at).toLocaleString()}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                inspection.notice_status === 'REPLIED'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  : inspection.notice_status === 'PROSECUTION_INITIATED'
                  ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                  : 'bg-amber-950 text-amber-300 border-amber-500/40'
              }`}>
                {inspection.notice_status || 'SHOW_CAUSE_ISSUED'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              {inspection.product_name} <span className="text-cyan-400 font-normal text-lg">({inspection.brand})</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <a
            href={api.getPdfReportUrl(inspection.id)}
            target="_blank"
            rel="noreferrer"
            className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-glow-red transition"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Form 1 Notice</span>
          </a>
          <a
            href={api.getJsonReportUrl(inspection.id)}
            target="_blank"
            rel="noreferrer"
            className="bg-gov-800 hover:bg-gov-700 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-white/10 flex items-center space-x-1.5 transition shadow"
          >
            <FileJson className="w-4 h-4 text-cyan-400" />
            <span>Export JSON</span>
          </a>
        </div>
      </div>

      {/* Show-Cause Notice & Noticee Response Panel */}
      {inspection.compliance_verdict === 'NON_COMPLIANT' && (
        <div className="glass-panel rounded-2xl border border-amber-500/30 p-5 space-y-4 bg-gradient-to-r from-amber-950/20 via-gov-900/40 to-gov-950/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                Statutory Show-Cause Notice Period (Section 15 & 18, Legal Metrology Act)
              </h3>
            </div>
            <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-950 px-2.5 py-1 rounded-lg border border-amber-500/40">
              Notice Window: 15 Statutory Days from Issuance
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Existing Explanation or Submission */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Inspected Entity Explanation & Rectification Record:
              </label>
              {inspection.party_reply ? (
                <div className="p-3.5 rounded-xl bg-gov-950 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold">
                    <span>✓ Legal Reply Logged</span>
                    <span className="font-mono text-slate-400">
                      {inspection.party_reply_date ? new Date(inspection.party_reply_date).toLocaleDateString() : 'Recorded'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-mono">
                    "{inspection.party_reply}"
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-gov-950/80 border border-white/[0.06] text-xs text-slate-400 italic">
                  No show-cause explanation has been submitted yet by the noticee ({inspection.store_name}).
                </div>
              )}
            </div>

            {/* Response Form */}
            <form onSubmit={handleSubmitReply} className="space-y-2.5">
              <label className="text-xs font-bold text-slate-300 block flex items-center justify-between">
                <span>Submit / Update Explanation (Noticee Action):</span>
                {replySuccess && (
                  <span className="text-emerald-400 text-[11px] font-bold flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Reply Recorded!
                  </span>
                )}
              </label>
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="State corrective remedy (e.g. Non-compliant packaging stock recalled; manufacturing stamping line re-calibrated with metric units)..."
                className="w-full glass-input rounded-xl p-3 text-xs text-white placeholder-slate-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={replying || !replyText.trim()}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow transition disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{replying ? 'Logging...' : 'Log Show-Cause Reply'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Statutory Enforcement Escalation Bar (Officer & Superadmin) */}
          {(role === 'SUPERADMIN' || role === 'OFFICER') && (
            <div className="pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-400">
                Statutory Enforcement Actions:
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const updated = await api.escalateNotice(inspection.id, { action: 'FINAL_WARNING' });
                      setInspection(updated);
                    } catch (e) {
                      alert('Failed to escalate notice');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold hover:bg-amber-500/30 transition"
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
                      } catch (e) {
                        alert('Failed to initiate prosecution');
                      }
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-bold hover:bg-purple-500/30 transition"
                >
                  Initiate Sec 36 Prosecution
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const updated = await api.escalateNotice(inspection.id, { action: 'CLOSED' });
                      setInspection(updated);
                    } catch (e) {
                      alert('Failed to close notice');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold hover:bg-emerald-500/30 transition"
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
