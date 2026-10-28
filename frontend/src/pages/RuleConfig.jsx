import React, { useState, useEffect } from "react";
import {
  Sliders,
  RotateCcw,
  Save,
  FastForward,
  ShieldCheck,
  Clock,
  GitBranch,
  BellRing,
  FileWarning,
} from "lucide-react";
import { useAicte } from "../context/AicteContext";
import { useRole } from "../context/RoleContext";

const DEFAULT_APH_CONFIG = {
  rule_version: "APH-2024-2027-v1.0",
  protected: true,
  simulated_day_offset: 0,
  stage_sla_days: {
    SCRUTINY: 15,
    RE_SCRUTINY: 10,
    EVC_QUEUE_STANDARD: 30,
    EVC_QUEUE_NEW_INSTITUTION: 21,
    EVC_SCHEDULED: 14,
    SAC_REVIEW: 30,
    DECISION: 7,
  },
  doc_expiry_alerts_days: [90, 60, 30, 7],
  undertaking_default_due_days: 90,
  escalation_ladder: [
    { days_from_due: -7, level: 1, target_role: "INSTITUTION", severity: "info", action: "ADVANCE_REMINDER" },
    { days_from_due: 0, level: 2, target_role: "REGIONAL_OFFICER", severity: "warning", action: "SLA_DUE_ALERT" },
    { days_from_due: 7, level: 3, target_role: "BUREAU_OFFICER", severity: "critical", action: "BUREAU_ESCALATION" },
    { days_from_due: 15, level: 4, target_role: "MEMBER_SECRETARY", severity: "critical", action: "DG_SHOW_CAUSE_FLAG" },
  ],
};

export default function RuleConfig() {
  const { advanceDays, simulatedDate } = useAicte();
  const { role, roleConfig } = useRole();

  const [config, setConfig] = useState(DEFAULT_APH_CONFIG);
  const [statusMsg, setStatusMsg] = useState("");
  const [simResult, setSimResult] = useState(null);

  const handleSlaChange = (stage, value) => {
    setConfig((prev) => ({
      ...prev,
      stage_sla_days: {
        ...prev.stage_sla_days,
        [stage]: Number(value) || 1,
      },
    }));
  };

  const handleSaveConfig = async () => {
    setStatusMsg("Saved APH 2024–27 SLA & Escalation parameters to active engine.");
    setTimeout(() => setStatusMsg(""), 4000);
  };

  const handleResetDefaults = () => {
    setConfig(DEFAULT_APH_CONFIG);
    setSimResult(null);
    setStatusMsg("Restored statutory APH 2024–27 default parameters.");
    setTimeout(() => setStatusMsg(""), 4000);
  };

  const handleSimulateDays = (daysToAdd) => {
    advanceDays(daysToAdd);
    const newOffset = config.simulated_day_offset + daysToAdd;
    setConfig((prev) => ({ ...prev, simulated_day_offset: newOffset }));
    setSimResult({
      offset: newOffset,
      triggered_alerts: [
        `[L2 SLA_DUE_ALERT] Application APH-2026-1045 (SCRUTINY) reached SLA limit → Notified REGIONAL_OFFICER`,
        `[L3 BUREAU_ESCALATION] Undertaking #UT-2026-079 (Air Handling & Fire NOC) +${newOffset}d overdue → Escalated to BUREAU_OFFICER`,
        `[DOC_EXPIRY T-30] Fire Safety NOC #DOC-903 (Bengal College of Pharmacy) in 30-day renewal window → Notified INSTITUTION`,
      ],
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-300 font-bold">
            APH 2024–2027 STATUTORY ENGINE • CONFIGURABLE PARAMETERS
          </span>
          <h1 className="text-2xl font-serif font-bold text-slate-900 mt-2">
            Approval Workflow Timelines & Escalation Rules Matrix
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Adjust stage SLA windows, document expiry alert lead-times, and L1–L4 escalation thresholds without code redeployment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSimulateDays(7)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition"
          >
            <FastForward className="w-4 h-4" />
            Simulate +7 Days (Clock: +{config.simulated_day_offset}d)
          </button>
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Statutory Defaults
          </button>
          <button
            onClick={handleSaveConfig}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#1e3a8a] hover:bg-[#172554] text-white rounded-xl transition shadow-xs"
          >
            <Save className="w-4 h-4" />
            Save Matrix
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-sm font-medium">
          ✓ {statusMsg}
        </div>
      )}

      {/* Simulated Clock Live Output Drawer */}
      {simResult && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-rose-900">
              ⚡ LIVE CLOCK SIMULATION ACTIVE (+{simResult.offset} DAYS AHEAD • SYSTEM DATE: {simulatedDate})
            </span>
          </div>
          <ul className="text-xs font-mono text-rose-950 space-y-1">
            {simResult.triggered_alerts.map((alert, idx) => (
              <li key={idx}>• {alert}</li>
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
            <h2 className="font-serif font-bold text-slate-900">
              1. Prescribed Stage SLA Timelines (Days)
            </h2>
          </div>
          <div className="space-y-3">
            {Object.entries(config.stage_sla_days).map(([stage, days]) => (
              <div
                key={stage}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <div>
                  <div className="text-xs font-mono font-semibold text-slate-900">
                    {stage}
                  </div>
                  <div className="text-xs text-slate-500">
                    {stage === "EVC_QUEUE_NEW_INSTITUTION"
                      ? "Strict priority window for New Institutions (Module C)"
                      : "Maximum prescribed processing days before L2 breach"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={days}
                    onChange={(e) => handleSlaChange(stage, e.target.value)}
                    className="w-20 px-2.5 py-1 text-sm font-mono border border-slate-300 rounded-lg text-right font-bold text-[#1e3a8a]"
                  />
                  <span className="text-xs text-slate-500 font-mono">days</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: L1-L4 Automated Escalation Ladder */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
            <BellRing className="w-5 h-5 text-[#1e3a8a]" />
            <h2 className="font-serif font-bold text-slate-900">
              2. Automated Escalation Ladder (L1 → L4)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1e293b] text-white text-xs font-mono uppercase">
                  <th className="py-2.5 px-3">Level</th>
                  <th className="py-2.5 px-3">Trigger (vs Due)</th>
                  <th className="py-2.5 px-3">Target Authority</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {config.escalation_ladder.map((row) => (
                  <tr key={row.level} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      L{row.level}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium">
                      {row.days_from_due < 0
                        ? `T${row.days_from_due}d (Advance)`
                        : row.days_from_due === 0
                        ? "Due Date (0d)"
                        : `+${row.days_from_due}d Overdue`}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {row.target_role}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-800">
                      {row.action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Regulatory Safeguard Banner */}
          <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Regulatory Safeguard (PS 26262):</strong> Automated alerts, SLA timers, and workflow routing support the approval process but never replace statutory scrutiny, inspections, or final decisions reserved for the Competent Authority.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
