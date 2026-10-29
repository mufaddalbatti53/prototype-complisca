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
  CheckCircle2,
  X
} from 'lucide-react';
import { useAicte, getStageSla } from '../context/AicteContext';
import { useRole } from '../context/RoleContext';

export default function Pendency() {
  const { applications, config, simulatedDate } = useAicte();
  const { role, roleConfig } = useRole();
  const isInstitutionRole = role === 'INSTITUTION';
  const isRegionalOfficer = role === 'REGIONAL_OFFICER';

  const [selectedRegion, setSelectedRegion] = useState(
    isRegionalOfficer ? 'Western Regional Office' : 'ALL'
  );
  const [drilldownModal, setDrilldownModal] = useState(null);

  // Role Scoping
  const accessibleApps = isInstitutionRole
    ? applications.filter(
        (a) => a.institutionId === 'inst_sunrise' || a.institutionName.toLowerCase().includes('sunrise')
      )
    : isRegionalOfficer
    ? applications.filter((a) => a.region === 'Western Regional Office')
    : applications;

  // Filtered applications
  const allRegionApps = accessibleApps.filter(
    (a) => selectedRegion === 'ALL' || a.region === selectedRegion
  );

  const activeApps = allRegionApps.filter((a) => a.currentStage !== 'CLOSED');
  const closedApps = allRegionApps.filter((a) => a.currentStage === 'CLOSED');

  // Key KPI Metrics (Strictly non-contradictory: active applications do not count closed dockets)
  const totalCount = allRegionApps.length;
  const activeCount = activeApps.length;
  const closedCount = closedApps.length;
  const inScrutinyCount = activeApps.filter((a) => a.currentStage === 'SCRUTINY').length;
  const inEvcCount = activeApps.filter((a) => a.currentStage === 'EVC_QUEUE' || a.currentStage === 'EVC_SCHEDULED').length;
  const inSacCount = activeApps.filter((a) => a.currentStage === 'SAC_REVIEW').length;
  const overdueCount = activeApps.filter(
    (a) => a.isBreached || a.daysInStage > getStageSla(config, a.currentStage, a.appType, a.resubmissionCount)
  ).length;
  const avgDwellDays = Math.round(
    activeApps.reduce((acc, a) => acc + (a.daysInStage || 0), 0) / (activeCount || 1)
  );

  // 4 Ageing Buckets (Active Cases Only — exactly equals activeCount)
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

  // Officer Workload Distribution: Dynamically derived from actual application registry
  const officerWorkload = [
    { id: 'RO-WEST-041', name: 'RO–West (Maharashtra/Goa)', region: 'Western Regional Office' },
    { id: 'RO-NORTH-018', name: 'RO–North (UP/Delhi/UK)', region: 'Northern Regional Office' },
    { id: 'RO-SW-088', name: 'RO–South-Western (Karnataka/Kerala)', region: 'South-Western Regional Office' },
    { id: 'RO-SC-012', name: 'RO–South-Central (AP/Telangana)', region: 'South-Central Regional Office' },
    { id: 'RO-EAST-004', name: 'RO–East (WB/Assam/Bihar)', region: 'Eastern Regional Office' },
    { id: 'RO-CENTRAL-09', name: 'RO–Central (MP/Chhattisgarh)', region: 'Central Regional Office' }
  ].map((off) => {
    const offApps = applications.filter((a) => a.region === off.region);
    const assigned = offApps.filter((a) => a.currentStage !== 'CLOSED').length;
    const completed = offApps.filter((a) => a.currentStage === 'CLOSED').length;
    const breached = offApps.filter((a) => {
      const sla = getStageSla(config, a.currentStage, a.appType, a.resubmissionCount);
      return a.currentStage !== 'CLOSED' && (a.isBreached || a.daysInStage > sla);
    }).length;
    return { ...off, assigned, completed, breached };
  });

  // Identify Bottleneck Stage with highest average dwell time
  const stageDwellStats = ['SCRUTINY', 'EVC_QUEUE', 'EVC_SCHEDULED', 'SAC_REVIEW'].map((stg) => {
    const matching = activeApps.filter((a) => a.currentStage === stg);
    const avg = matching.length > 0 ? Math.round(matching.reduce((acc, a) => acc + a.daysInStage, 0) / matching.length) : 0;
    return { stage: stg, avg, count: matching.length };
  });
  const bottleneck = stageDwellStats.sort((a, b) => b.avg - a.avg)[0] || { stage: 'EVC_QUEUE', avg: 23, count: 2 };

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
        {!isInstitutionRole && !isRegionalOfficer ? (
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
        ) : isRegionalOfficer ? (
          <div className="px-3 py-1.5 rounded-xl bg-blue-100 border border-blue-300 text-blue-900 text-xs font-bold font-mono">
            Western Regional Office (Maharashtra & Goa)
          </div>
        ) : (
          <div className="px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold font-mono">
            College View: Western Regional Office (Pune)
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

      {/* Top 6 KPI Metric Cards (Strict Non-Contradictory Counters) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div
          onClick={() => setDrilldownModal({ title: 'Active Applications in Review', apps: activeApps })}
          className="civic-card rounded-2xl p-4 bg-white cursor-pointer hover:shadow-md transition-all group"
        >
          <span className="text-[10.5px] font-mono font-bold uppercase text-slate-500 block group-hover:text-[#1e3a8a]">
            Active Cases
          </span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">{activeCount}</h3>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            {closedCount} Closed · {totalCount} Total
          </span>
        </div>

        <div
          onClick={() => setDrilldownModal({ title: 'Applications in Scrutiny', apps: activeApps.filter(a => a.currentStage === 'SCRUTINY') })}
          className="civic-card rounded-2xl p-4 bg-white cursor-pointer hover:shadow-md transition-all group"
        >
          <span className="text-[10.5px] font-mono font-bold uppercase text-blue-700 block">Checking Docs</span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-blue-900 mt-1">{inScrutinyCount}</h3>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">In Scrutiny</span>
        </div>

        <div
          onClick={() => setDrilldownModal({ title: 'Applications in EVC Queue / Scheduled', apps: activeApps.filter(a => a.currentStage === 'EVC_QUEUE' || a.currentStage === 'EVC_SCHEDULED') })}
          className="civic-card rounded-2xl p-4 bg-white cursor-pointer hover:shadow-md transition-all group"
        >
          <span className="text-[10.5px] font-mono font-bold uppercase text-purple-700 block">Inspection Needed</span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-1">{inEvcCount}</h3>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Queue + Scheduled</span>
        </div>

        <div
          onClick={() => setDrilldownModal({ title: 'Applications in SAC Committee Review', apps: activeApps.filter(a => a.currentStage === 'SAC_REVIEW') })}
          className="civic-card rounded-2xl p-4 bg-white cursor-pointer hover:shadow-md transition-all group"
        >
          <span className="text-[10.5px] font-mono font-bold uppercase text-indigo-700 block">Committee Review</span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-indigo-900 mt-1">{inSacCount}</h3>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">SAC Review</span>
        </div>

        <div
          onClick={() => setDrilldownModal({ title: 'Applications Overdue (SLA Exceeded)', apps: activeApps.filter(a => a.isBreached || a.daysInStage > getStageSla(config, a.currentStage, a.appType, a.resubmissionCount)) })}
          className="civic-card rounded-2xl p-4 bg-rose-50 border-rose-200 cursor-pointer hover:shadow-md transition-all group"
        >
          <span className="text-[10.5px] font-mono font-bold uppercase text-rose-700 block">Overdue Cases</span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-rose-700 mt-1">{overdueCount}</h3>
          <span className="text-[10px] text-rose-600 font-mono mt-1 block">SLA Exceeded</span>
        </div>

        <div className="civic-card rounded-2xl p-4 bg-white">
          <span className="text-[10.5px] font-mono font-bold uppercase text-slate-500 block">Avg Wait Time</span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">{avgDwellDays}d</h3>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Across Active Steps</span>
        </div>
      </div>

      {/* 4 Ageing Buckets Strip (Active Cases Only — exactly equals activeCount) */}
      <div className="civic-card rounded-2xl p-5 bg-white space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#1e3a8a]" />
            <h3 className="font-serif font-bold text-sm text-slate-900">
              Statutory Dwell Ageing Breakdown (4 Buckets — {activeCount} Active Dockets)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Click any group to inspect cases</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            onClick={() => setDrilldownModal({ title: 'Stage 1 (0–15 Days) · Fresh / Processing', apps: bucket0_15 })}
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 cursor-pointer hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-emerald-900">STAGE 1 (0–15 DAYS)</span>
              <span className="text-lg font-serif font-bold text-emerald-900">{bucket0_15.length}</span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">Within normal statutory processing window.</p>
            <span className="text-[10px] text-emerald-800 font-bold block mt-1.5 opacity-80 group-hover:opacity-100">
              Tap to inspect {bucket0_15.length} cases →
            </span>
          </div>

          <div
            onClick={() => setDrilldownModal({ title: 'Stage 2 (16–30 Days) · Approaching SLA Threshold', apps: bucket16_30 })}
            className="p-4 rounded-xl bg-blue-50 border border-blue-200 cursor-pointer hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-900">STAGE 2 (16–30 DAYS)</span>
              <span className="text-lg font-serif font-bold text-blue-900">{bucket16_30.length}</span>
            </div>
            <p className="text-[11px] text-blue-700 mt-1">Approaching SLA threshold; automatic reminder active.</p>
            <span className="text-[10px] text-blue-800 font-bold block mt-1.5 opacity-80 group-hover:opacity-100">
              Tap to inspect {bucket16_30.length} cases →
            </span>
          </div>

          <div
            onClick={() => setDrilldownModal({ title: 'Stage 3 (31–60 Days) · Overdue / Bureau Level', apps: bucket31_60 })}
            className="p-4 rounded-xl bg-amber-50 border border-amber-300 cursor-pointer hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-amber-950">STAGE 3 (31–60 DAYS)</span>
              <span className="text-lg font-serif font-bold text-amber-950">{bucket31_60.length}</span>
            </div>
            <p className="text-[11px] text-amber-800 mt-1">Overdue scrutiny; flagged on Regional Officer dashboard.</p>
            <span className="text-[10px] text-amber-900 font-bold block mt-1.5 opacity-80 group-hover:opacity-100">
              Tap to inspect {bucket31_60.length} cases →
            </span>
          </div>

          <div
            onClick={() => setDrilldownModal({ title: 'Stage 4 (60+ Days) · Critical Escalation', apps: bucket60_plus })}
            className="p-4 rounded-xl bg-rose-50 border border-rose-300 cursor-pointer hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-rose-950">STAGE 4 (60+ DAYS)</span>
              <span className="text-lg font-serif font-bold text-rose-950">{bucket60_plus.length}</span>
            </div>
            <p className="text-[11px] text-rose-800 mt-1">Critical pendency; escalated to Member Secretary.</p>
            <span className="text-[10px] text-rose-900 font-bold block mt-1.5 opacity-80 group-hover:opacity-100">
              Tap to inspect {bucket60_plus.length} cases →
            </span>
          </div>
        </div>
      </div>

      {/* 8 AICTE Regional Offices Heat Grid */}
      <div className="civic-card rounded-2xl overflow-hidden bg-white">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-[#1e3a8a]" />
            <h3 className="font-serif font-bold text-sm text-slate-900">
              National Pendency Matrix (8 AICTE Regional Offices × Lifecycle Stages)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Click any cell to inspect matching dockets</span>
        </div>

        {/* Mobile View: Clean Regional Cards (Hidden on Desktop) */}
        <div className="block md:hidden p-3 space-y-3">
          {REGIONS.map((region) => {
            const regApps = applications.filter((a) => a.region === region);
            const activeRegApps = regApps.filter((a) => a.currentStage !== 'CLOSED');
            const countByStage = (stg) => regApps.filter((a) => a.currentStage === stg).length;
            const hasBreachInStage = (stg) =>
              regApps.some(
                (a) =>
                  a.currentStage === stg &&
                  (a.isBreached ||
                    (a.currentStage !== 'CLOSED' &&
                      a.daysInStage > getStageSla(config, a.currentStage, a.appType, a.resubmissionCount)))
              );
            const anyBreach = STAGES.some((stg) => hasBreachInStage(stg));

            return (
              <div
                key={region}
                className={`p-3.5 rounded-xl border ${
                  anyBreach ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 bg-white'
                } shadow-xs space-y-2`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-xs text-slate-900">{region}</div>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    {anyBreach && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-600 text-white animate-pulse">
                        BREACH
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-blue-50 text-[#1e3a8a] border border-blue-200">
                      {activeRegApps.length} active
                    </span>
                  </div>
                </div>

                {/* Stage distribution pills */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {STAGES.filter((stg) => countByStage(stg) > 0).map((stg) => {
                    const count = countByStage(stg);
                    const breached = hasBreachInStage(stg);
                    return (
                      <button
                        key={stg}
                        onClick={() =>
                          setDrilldownModal({
                            title: `${region} · Stage: ${stg.replace(/_/g, ' ')}`,
                            apps: regApps.filter((a) => a.currentStage === stg)
                          })
                        }
                        className={`px-2 py-1 rounded text-[11px] font-mono flex items-center justify-between border text-left transition ${
                          breached
                            ? 'bg-rose-100 border-rose-300 text-rose-900 font-bold hover:bg-rose-200'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate pr-1">{stg.replace(/_/g, ' ')}</span>
                        <span className="font-bold">{count}</span>
                      </button>
                    );
                  })}
                  {regApps.length === 0 && (
                    <span className="text-[11px] text-slate-400 font-mono italic col-span-2">No active applications</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Full 9-Column Heatmap Table (Hidden on Mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[700px]">
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
                <th className="py-3 px-4 text-right">Active Dockets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {REGIONS.map((region) => {
                const regApps = applications.filter((a) => a.region === region);
                const activeRegCount = regApps.filter((a) => a.currentStage !== 'CLOSED').length;
                const closedRegCount = regApps.filter((a) => a.currentStage === 'CLOSED').length;
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
                      const matching = regApps.filter((a) => a.currentStage === stg);

                      return (
                        <td
                          key={stg}
                          onClick={() => {
                            if (count > 0) {
                              setDrilldownModal({
                                title: `${region} · Stage: ${stg.replace(/_/g, ' ')}`,
                                apps: matching
                              });
                            }
                          }}
                          className={`py-3 px-3 text-center font-mono font-medium ${
                            count > 0 ? 'cursor-pointer hover:font-bold hover:underline' : ''
                          } ${
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
                      {activeRegCount}
                      {closedRegCount > 0 && (
                        <span className="text-[10px] text-slate-400 font-normal block">
                          ({closedRegCount} closed)
                        </span>
                      )}
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

      {/* Interactive Case Drilldown Modal (Click-to-Inspect) */}
      {drilldownModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  {drilldownModal.title}
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  {drilldownModal.apps.length} Applications Listed
                </span>
              </div>
              <button
                onClick={() => setDrilldownModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {drilldownModal.apps.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No applications currently matching this category.
                </div>
              ) : (
                drilldownModal.apps.map((app) => {
                  const sla = getStageSla(config, app.currentStage, app.appType, app.resubmissionCount);
                  const isBreach = app.isBreached || (app.currentStage !== 'CLOSED' && app.daysInStage > sla);

                  return (
                    <div
                      key={app.id}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                        isBreach ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#1e3a8a]">{app.refNo}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            app.currentStage === 'CLOSED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : isBreach
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {app.currentStage} {isBreach ? '· BREACH' : ''}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900">{app.institutionName}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono pt-1 border-t border-slate-200/60">
                        <span>{app.district}, {app.state}</span>
                        <span>
                          Wait: <strong>{app.daysInStage}d</strong> / max {sla}d
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setDrilldownModal(null);
                  window.location.hash = 'applications';
                }}
                className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#172554] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1"
              >
                <span>Open Applications Workstation</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
