import React, { useState } from 'react';
import {
  BarChart3,
  Clock,
  AlertTriangle,
  Building2,
  Users,
  AlertOctagon,
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { useAicte, getStageSla } from '../context/AicteContext';
import { useRole } from '../context/RoleContext';

export default function Pendency() {
  const { applications, config, simulatedDate } = useAicte();
  const { role } = useRole();
  const isInstitutionRole = role === 'INSTITUTION';

  const [selectedRegion, setSelectedRegion] = useState('ALL');

  // Institution Isolation: If logged in as college, only see your own institution files
  const accessibleApps = isInstitutionRole
    ? applications.filter(
        (a) => a.institutionId === 'inst_sunrise' || a.institutionName.toLowerCase().includes('sunrise')
      )
    : applications;

  // Filtered applications
  const activeApps = accessibleApps.filter(
    (a) => selectedRegion === 'ALL' || a.region === selectedRegion
  );

  // Key KPI Metrics
  const totalCount = activeApps.length;
  const inScrutinyCount = activeApps.filter((a) => a.currentStage === 'SCRUTINY').length;
  const inEvcCount = activeApps.filter((a) => a.currentStage === 'EVC_QUEUE' || a.currentStage === 'EVC_SCHEDULED').length;
  const inSacCount = activeApps.filter((a) => a.currentStage === 'SAC_REVIEW').length;
  const overdueCount = activeApps.filter(
    (a) => a.currentStage !== 'CLOSED' && (a.isBreached || a.daysInStage > getStageSla(config, a.currentStage, a.appType, a.resubmissionCount))
  ).length;
  const avgDwellDays = Math.round(
    activeApps.reduce((acc, a) => acc + (a.daysInStage || 0), 0) / (totalCount || 1)
  );

  // 4 Ageing Buckets (0-15d, 16-30d, 31-60d, 60+d)
  const bucket0_15 = activeApps.filter((a) => a.daysInStage <= 15);
  const bucket16_30 = activeApps.filter((a) => a.daysInStage > 15 && a.daysInStage <= 30);
  const bucket31_60 = activeApps.filter((a) => a.daysInStage > 30 && a.daysInStage <= 60);
  const bucket60_plus = activeApps.filter((a) => a.daysInStage > 60);

  // 8 AICTE Regional Offices
  const REGIONS = [
    'Northern Regional Office',
    'North-Western Regional Office',
    'Central Regional Office',
    'Western Regional Office',
    'Eastern Regional Office',
    'Southern Regional Office',
    'South-Western Regional Office',
    'South-Central Regional Office'
  ];

  const STAGES = ['SUBMITTED', 'SCRUTINY', 'REVERTED', 'EVC_QUEUE', 'EVC_SCHEDULED', 'SAC_REVIEW', 'CLOSED'];

  // Officer Workload Distribution
  const officerWorkload = [
    { id: 'RO-WEST-041', name: 'RO–West (Maharashtra/Goa)', assigned: 8, completed: 5, breached: 0 },
    { id: 'RO-NORTH-018', name: 'RO–North (UP/Delhi/UK)', assigned: 6, completed: 3, breached: 1 },
    { id: 'RO-SW-088', name: 'RO–South-Western (Karnataka/Kerala)', assigned: 7, completed: 4, breached: 1 },
    { id: 'RO-SC-012', name: 'RO–South-Central (AP/Telangana)', assigned: 5, completed: 4, breached: 0 },
    { id: 'RO-EAST-004', name: 'RO–East (WB/Assam/Bihar)', assigned: 5, completed: 1, breached: 1 },
    { id: 'RO-CENTRAL-09', name: 'RO–Central (MP/Chhattisgarh)', assigned: 4, completed: 3, breached: 0 }
  ];

  // Identify Bottleneck Stage with highest average dwell time
  const stageDwellStats = ['SCRUTINY', 'EVC_QUEUE', 'EVC_SCHEDULED', 'SAC_REVIEW'].map((stg) => {
    const matching = activeApps.filter((a) => a.currentStage === stg);
    const avg = matching.length > 0 ? Math.round(matching.reduce((acc, a) => acc + a.daysInStage, 0) / matching.length) : 0;
    return { stage: stg, avg, count: matching.length };
  });
  const bottleneck = stageDwellStats.sort((a, b) => b.avg - a.avg)[0] || { stage: 'EVC_QUEUE', avg: 23 };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="kicker-line mb-1">MODULE B · REGULATORY OVERSIGHT & WORKLOAD INTELLIGENCE</div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Workload & Pendency Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Real-time tracking across all 8 AICTE Regional Offices. Shows how many cases are at each step,
            how long they have been waiting (0-15 days, 16-30 days, 31-60 days, 60+ days), and where delays are happening.
          </p>
        </div>

        {/* Region Quick Filter (Only for Officers/Admins) */}
        {!isInstitutionRole ? (
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
            >
              <option value="ALL">All 8 AICTE Regions (National View)</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold font-mono">
            Western Regional Office (Pune)
          </div>
        )}
      </div>

      {/* College Portal Banner (Shown ONLY for Institution role) */}
      {isInstitutionRole && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-sm">Sunrise Institute of Technology (Pune)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-200 text-amber-900">
                  YOUR COLLEGE PORTAL
                </span>
              </div>
              <p className="text-slate-600 mt-0.5">
                Viewing only your institution's files, review progress, and waiting time. Other colleges are kept private.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gold Bottleneck Strip */}
      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-amber-900">
            WORKFLOW BOTTLENECK DETECTED:
          </span>
          <span className="text-xs font-bold text-slate-900">
            {bottleneck.stage} (Avg. Wait: {bottleneck.avg} Days across {bottleneck.count} cases)
          </span>
        </div>
        <span className="text-[11px] text-amber-800 font-medium">
          Recommendation: Add more committee members in Western & South-Western regions to clear the inspection backlog.
        </span>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="civic-card rounded-2xl p-4 bg-white">
          <span className="text-[10.5px] font-mono font-bold uppercase text-slate-500 block">Total Cases</span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">{totalCount}</h3>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Active Applications</span>
        </div>

        <div className="civic-card rounded-2xl p-4 bg-white">
          <span className="text-[10.5px] font-mono font-bold uppercase text-blue-700 block">Checking Docs</span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-blue-900 mt-1">{inScrutinyCount}</h3>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">In Scrutiny</span>
        </div>

        <div className="civic-card rounded-2xl p-4 bg-white">
          <span className="text-[10.5px] font-mono font-bold uppercase text-purple-700 block">Inspection Needed</span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-1">{inEvcCount}</h3>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Queue + Scheduled</span>
        </div>

        <div className="civic-card rounded-2xl p-4 bg-white">
          <span className="text-[10.5px] font-mono font-bold uppercase text-indigo-700 block">Committee Review</span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-indigo-900 mt-1">{inSacCount}</h3>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">SAC Review</span>
        </div>

        <div className="civic-card rounded-2xl p-4 bg-rose-50 border-rose-200">
          <span className="text-[10.5px] font-mono font-bold uppercase text-rose-700 block">Overdue Cases</span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-rose-700 mt-1">{overdueCount}</h3>
          <span className="text-[10px] text-rose-600 font-mono mt-1 block">SLA Exceeded</span>
        </div>

        <div className="civic-card rounded-2xl p-4 bg-white">
          <span className="text-[10.5px] font-mono font-bold uppercase text-slate-500 block">Avg Wait Time</span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">{avgDwellDays}d</h3>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Across All Steps</span>
        </div>
      </div>

      {/* 4 Ageing Buckets Strip (Directly matching Blueprint Section 4.2) */}
      <div className="civic-card rounded-2xl p-5 bg-white space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#1e3a8a]" />
            <h3 className="font-serif font-bold text-sm text-slate-900">
              Statutory Dwell Ageing Breakdown (4 Buckets)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">APH Standard SLA: max 15d in Scrutiny, 30d in EVC</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-emerald-900">STAGE 1 (0–15 DAYS)</span>
              <span className="text-lg font-serif font-bold text-emerald-900">{bucket0_15.length}</span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">Within normal statutory processing window.</p>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-900">STAGE 2 (16–30 DAYS)</span>
              <span className="text-lg font-serif font-bold text-blue-900">{bucket16_30.length}</span>
            </div>
            <p className="text-[11px] text-blue-700 mt-1">Approaching SLA threshold; automatic reminder active.</p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-amber-950">STAGE 3 (31–60 DAYS)</span>
              <span className="text-lg font-serif font-bold text-amber-950">{bucket31_60.length}</span>
            </div>
            <p className="text-[11px] text-amber-800 mt-1">Overdue scrutiny; flagged on Regional Officer dashboard.</p>
          </div>

          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-rose-950">STAGE 4 (60+ DAYS)</span>
              <span className="text-lg font-serif font-bold text-rose-950">{bucket60_plus.length}</span>
            </div>
            <p className="text-[11px] text-rose-800 mt-1">Critical pendency; escalated to Member Secretary.</p>
          </div>
        </div>
      </div>

      {/* 8 AICTE Regional Offices Heat Grid */}
      <div className="civic-card rounded-2xl overflow-hidden bg-white">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-[#1e3a8a]" />
            <h3 className="font-serif font-bold text-sm text-slate-900">
              National Pendency Matrix (8 AICTE Regional Offices × Lifecycle Stages)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Red cell indicates SLA breach</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1e293b] text-white text-[11px] font-mono uppercase tracking-wider">
                <th className="py-3 px-4">Regional Office</th>
                <th className="py-3 px-3 text-center">Submitted</th>
                <th className="py-3 px-3 text-center">Scrutiny</th>
                <th className="py-3 px-3 text-center">Reverted</th>
                <th className="py-3 px-3 text-center">EVC Queue</th>
                <th className="py-3 px-3 text-center">EVC Sched</th>
                <th className="py-3 px-3 text-center">SAC Review</th>
                <th className="py-3 px-3 text-center">Closed</th>
                <th className="py-3 px-4 text-right">Total Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {REGIONS.map((region) => {
                const regApps = applications.filter((a) => a.region === region);
                const countByStage = (stg) => regApps.filter((a) => a.currentStage === stg).length;
                const hasBreachInStage = (stg) =>
                  regApps.some(
                    (a) =>
                      a.currentStage === stg &&
                      (a.isBreached ||
                        (a.currentStage !== 'CLOSED' &&
                          a.daysInStage > getStageSla(config, a.currentStage, a.appType, a.resubmissionCount)))
                  );

                return (
                  <tr key={region} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{region}</td>

                    {STAGES.map((stg) => {
                      const count = countByStage(stg);
                      const breached = hasBreachInStage(stg);

                      return (
                        <td
                          key={stg}
                          className={`py-3 px-3 text-center font-mono font-medium ${
                            breached
                              ? 'bg-rose-100 text-rose-800 font-bold'
                              : count > 0
                              ? 'text-slate-800'
                              : 'text-slate-300'
                          }`}
                        >
                          {count > 0 ? count : '—'}
                        </td>
                      );
                    })}

                    <td className="py-3 px-4 text-right font-mono font-bold text-[#1e3a8a]">
                      {regApps.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Officer Workload Distribution & SLA Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="civic-card rounded-2xl p-5 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#1e3a8a]" />
              <h3 className="font-serif font-bold text-sm text-slate-900">
                Officer Workload & Active Queue Distribution
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Assigned vs Completed</span>
          </div>

          <div className="space-y-3 pt-1">
            {officerWorkload.map((off) => {
              const total = off.assigned + off.completed;
              const completedPct = Math.round((off.completed / total) * 100);

              return (
                <div key={off.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{off.name}</span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      {off.completed} done / {off.assigned} active
                      {off.breached > 0 && <span className="text-rose-600 font-bold ml-1.5">(1 Breached)</span>}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-600 h-full" style={{ width: `${completedPct}%` }} />
                    <div className="bg-[#1e3a8a] h-full" style={{ width: `${100 - completedPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="civic-card rounded-2xl p-5 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#1e3a8a]" />
              <h3 className="font-serif font-bold text-sm text-slate-900">
                Statutory Regulatory Safeties & Alerts Summary
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Compliance Guards</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-800 block mb-0.5">Automated Escalation Rule (L1 to L4)</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Applications exceeding SLA dwell time auto-escalate from Regional Officer (Day 0) to Bureau Director
                (Day +7) and Member Secretary (Day +15).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-800 block mb-0.5">Revert-for-Deficiency Audit Locking</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Every deficiency recorded by scrutiny committee is permanently stamped with officer ID and justification,
                preventing arbitrary institutional rejections.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-800 block mb-0.5">Zero Paperwork Delays</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Institutional replies and rectified lease deeds are submitted and reviewed online, maintaining continuous
                real-time visibility across all 8 regions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
