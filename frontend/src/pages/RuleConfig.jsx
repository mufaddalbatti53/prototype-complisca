import React, { useState, useEffect } from "react";
import {
  Sliders,
  RotateCcw,
  Save,
  FastForward,
  ShieldCheck,
  Clock,
  BellRing,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useAicte, getStageSla } from "../context/AicteContext";
import { useRole } from "../context/RoleContext";

export default function RuleConfig() {
  const {
    config,
    updateConfig,
    resetConfigDefaults,
    advanceDays,
    simulatedDate,
    applications,
    undertakings,
    documents,
  } = useAicte();
  const { role, roleConfig } = useRole();

  const [localConfig, setLocalConfig] = useState(config);
  const [statusMsg, setStatusMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [simResult, setSimResult] = useState(null);

  // Synchronize localConfig whenever context config changes (e.g. from JSON editor or reset)
  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  const handleSlaChange = (stage, value) => {
    const num = Math.max(1, parseInt(value, 10) || 1);
    setLocalConfig((prev) => {
      const curSla = { ...(prev?.stage_sla_days || {}) };
      curSla[stage] = num;
      curSla[stage.toUpperCase()] = num;
      curSla[stage.toLowerCase()] = num;
      return {
        ...prev,
        stage_sla_days: curSla,
      };
    });
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const success = await updateConfig(
        localConfig,
        role,
        roleConfig?.title || "Regulatory Officer"
      );
      if (success) {
        setStatusMsg(
          "Saved APH 2024–27 SLA & Escalation parameters! Synced live across Applications, Pendency, Compliance, and Backend Engine."
        );
      }
    } catch (e) {
      setStatusMsg(`Save warning: ${e.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMsg(""), 4500);
    }
  };

  const handleResetDefaults = async () => {
    setIsSaving(true);
    try {
      await resetConfigDefaults(role, roleConfig?.title || "Regulatory Officer");
      setSimResult(null);
      setStatusMsg("Restored statutory APH 2024–27 default parameters across all modules.");
    } catch (e) {
      setStatusMsg(`Reset warning: ${e.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMsg(""), 4500);
    }
  };

  const handleSimulateDays = (daysToAdd) => {
    advanceDays(daysToAdd);
    const triggered = [];

    // Dynamically evaluate breached applications
    applications.forEach((app) => {
      const sla = getStageSla(
        localConfig,
        app.currentStage,
        app.appType,
        app.resubmissionCount
      );
      if (app.daysInStage + daysToAdd > sla && app.currentStage !== "CLOSED") {
        triggered.push(
          `[L2 SLA_DUE_ALERT] Application ${app.refNo} (${app.currentStage}) reached ${
            app.daysInStage + daysToAdd
          }d (max ${sla}d) → Flagged for Regional Officer`
        );
      }
    });

    // Dynamically evaluate overdue undertakings
    undertakings.forEach((ut) => {
      if (ut.status !== "VERIFIED") {
        const now = new Date(simulatedDate);
        now.setDate(now.getDate() + daysToAdd);
        const diffDays = Math.ceil((new Date(ut.dueDate) - now) / 86400000);
        if (diffDays <= 0) {
          triggered.push(
            `[L3 ESCALATION] Undertaking #${ut.id} (${ut.conditionTitle}) is ${Math.abs(
              diffDays
            )}d overdue → Dispatched to Bureau Officer`
          );
        }
      }
    });

    // Dynamically evaluate expiring documents
    documents.forEach((doc) => {
      if (doc.status !== "RENEWED" && doc.status !== "RENEWAL_SUBMITTED") {
        const now = new Date(simulatedDate);
        now.setDate(now.getDate() + daysToAdd);
        const daysToExpiry = Math.ceil((new Date(doc.expiryDate) - now) / 86400000);
        if (daysToExpiry <= 30) {
          triggered.push(
            `[DOC_EXPIRY T-${Math.max(0, daysToExpiry)}] Document ${doc.docType} (${
              doc.institutionName
            }) entering renewal window`
          );
        }
      }
    });

    setSimResult({
      offset: (localConfig.simulated_day_offset || 0) + daysToAdd,
      triggered_alerts:
        triggered.length > 0
          ? triggered.slice(0, 6)
          : [
              `All active application stages and undertakings remain within SLA limits. Time advanced +${daysToAdd} days.`,
            ],
    });
  };

  // Only display unique uppercase stage keys in the form to avoid duplicate rows
  const stageEntries = Object.entries(localConfig?.stage_sla_days || {}).filter(
    ([k]) => k === k.toUpperCase()
  );

  const escalationRows = localConfig?.escalation_ladder || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-300 font-bold">
            APH 2024–2027 STATUTORY ENGINE • LIVE CONFIGURABLE MATRIX
          </span>
          <h1 className="text-2xl font-serif font-bold text-slate-900 mt-2">
            Approval Workflow Timelines & Escalation Rules Matrix
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Adjust stage SLA windows, document expiry alert lead-times, and L1–L4 escalation thresholds. Changes synchronize live across every tab and the FastAPI engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSimulateDays(7)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition"
            title="Ticks the system clock forward +7 days to simulate SLA breaches live"
          >
            <FastForward className="w-4 h-4" />
            Simulate +7 Days (Date: {simulatedDate})
          </button>
          <button
            onClick={handleResetDefaults}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Defaults
          </button>
          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#1e3a8a] hover:bg-[#172554] text-white rounded-xl transition shadow-xs"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Matrix"}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-sm font-medium flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Simulated Clock Live Output Drawer */}
      {simResult && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-xl space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-rose-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
              LIVE CLOCK SIMULATION ACTIVE (SYSTEM DATE: {simulatedDate})
            </span>
            <span className="text-[11px] font-mono text-rose-700 font-semibold">
              APH Due-Date Sweeper Result
            </span>
          </div>
          <ul className="text-xs font-mono text-rose-950 space-y-1">
            {simResult.triggered_alerts.map((alert, idx) => (
              <li key={idx} className="leading-relaxed">
                • {alert}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Grid: Stage SLA Days & Escalation Ladder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Per-Stage SLA Days */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
            <Clock className="w-5 h-5 text-[#1e3a8a]" />
            <div>
              <h2 className="font-serif font-bold text-slate-900 text-base">
                1. Prescribed Stage SLA Timelines (Days)
              </h2>
              <p className="text-[11px] text-slate-500">
                Regulates maximum processing window per approval stage before an automated L2 breach alert is fired.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {stageEntries.map(([stage, days]) => {
              const description =
                stage === "EVC_QUEUE_NEW_INSTITUTION"
                  ? "Strict 21-day priority window for New Institutions (Module C)"
                  : stage === "EVC_QUEUE_STANDARD"
                  ? "Standard queue for existing institutions (Extension / Intake)"
                  : stage === "SCRUTINY"
                  ? "Regional Officer initial document scrutiny window"
                  : stage === "RE_SCRUTINY"
                  ? "Re-scrutiny window following institution deficiency resubmission"
                  : stage === "EVC_SCHEDULED"
                  ? "Inspection committee campus visit execution window"
                  : stage === "SAC_REVIEW"
                  ? "Standing Appellate Committee appellate review window"
                  : stage === "DECISION"
                  ? "Competent Authority final decision recording window"
                  : "Maximum allowable days before SLA breach";

              return (
                <div
                  key={stage}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div className="pr-4">
                    <div className="text-xs font-mono font-bold text-slate-900">
                      {stage}
                    </div>
                    <div className="text-[11px] text-slate-500">{description}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={days}
                      onChange={(e) => handleSlaChange(stage, e.target.value)}
                      className="w-20 px-2.5 py-1 text-sm font-mono border border-slate-300 rounded-lg text-right font-bold text-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                    />
                    <span className="text-xs text-slate-500 font-mono">days</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: L1-L4 Automated Escalation Ladder */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
              <BellRing className="w-5 h-5 text-[#1e3a8a]" />
              <div>
                <h2 className="font-serif font-bold text-slate-900 text-base">
                  2. Automated Escalation Ladder (L1 → L4)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Time-bound escalation path triggered against overdue undertakings and application stages.
                </p>
              </div>
            </div>

            {/* Mobile View: Escalation Cards (Hidden on sm screens and up) */}
            <div className="block sm:hidden space-y-2.5">
              {escalationRows.map((row) => {
                const daysVal =
                  row.days_from_due !== undefined ? row.days_from_due : row.days;
                const targetVal = row.target_role || row.target;

                return (
                  <div
                    key={row.level}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold ${
                          row.level === 4
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : row.level === 3
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : row.level === 2
                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        Level {row.level}
                      </span>
                      <span className="font-mono text-[11px] text-slate-600 font-medium">
                        {daysVal < 0
                          ? `T${daysVal}d (Advance Reminder)`
                          : daysVal === 0
                          ? "Due Date (0d Breach)"
                          : `+${daysVal}d Overdue`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-800 pt-0.5">
                      <span className="font-medium text-[11px] text-slate-500">Target Authority:</span>
                      <span className="font-bold">{targetVal}</span>
                    </div>
                    <div className="flex items-center justify-between pt-0.5 border-t border-slate-200">
                      <span className="font-medium text-[11px] text-slate-500">Action:</span>
                      <span className="font-mono font-bold text-amber-900 text-[11px]">{row.action}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Table (Hidden on Mobile) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1e293b] text-white text-[11px] font-mono uppercase">
                    <th className="py-2.5 px-3">Level</th>
                    <th className="py-2.5 px-3">Trigger (vs Due)</th>
                    <th className="py-2.5 px-3">Target Authority</th>
                    <th className="py-2.5 px-3">Action Dispatched</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {escalationRows.map((row) => {
                    const daysVal =
                      row.days_from_due !== undefined ? row.days_from_due : row.days;
                    const targetVal = row.target_role || row.target;

                    return (
                      <tr key={row.level} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10.5px] ${
                              row.level === 4
                                ? "bg-rose-100 text-rose-800 border border-rose-300 font-bold"
                                : row.level === 3
                                ? "bg-amber-100 text-amber-800 border border-amber-300 font-bold"
                                : row.level === 2
                                ? "bg-blue-100 text-blue-800 border border-blue-300 font-bold"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            L{row.level}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                          {daysVal < 0
                            ? `T${daysVal}d (Advance Reminder)`
                            : daysVal === 0
                            ? "Due Date (0d Breach)"
                            : `+${daysVal}d Overdue`}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {targetVal}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-900">
                          {row.action}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Regulatory Safeguard Banner */}
          <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Regulatory Safeguard (PS 26262):</strong> Automated alerts, SLA timers, and workflow routing support the administrative process but never replace statutory scrutiny, physical inspections, or decisions reserved for the Competent Authority.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
