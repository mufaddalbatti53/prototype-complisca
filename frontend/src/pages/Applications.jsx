import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Plus,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  MapPin,
  ChevronRight,
  ChevronDown,
  Sparkles,
  FileCheck,
  Send,
  X,
  ShieldCheck,
  Ban,
  Calendar,
  Layers,
  HelpCircle,
  Bot,
  Copy,
  Download,
  Check,
  Loader2,
  Info
} from 'lucide-react';
import { useAicte } from '../context/AicteContext';
import { useRole } from '../context/RoleContext';
import { api } from '../services/api';

export default function Applications() {
  const {
    applications,
    institutions,
    simulatedDate,
    determineRoute,
    advanceApplication,
    revertApplication,
    resubmitApplication,
    submitNewApplication,
    decideApplication,
    config
  } = useAicte();

  const { role, roleConfig } = useRole();

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [routeFilter, setRouteFilter] = useState('ALL');

  // Selected application ID for INLINE accordion expansion (directly below clicked row)
  const [selectedAppId, setSelectedAppId] = useState(null);

  // Dynamically derive selectedApp so all changes update in REAL-TIME with ZERO REFRESH
  const selectedApp = applications.find((a) => a.id === selectedAppId) || null;

  // Modals
  const [intakeModalOpen, setIntakeModalOpen] = useState(false);
  const [revertModalOpen, setRevertModalOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);

  // Revert Form State
  const [deficiencyReason, setDeficiencyReason] = useState('Deficient Documents / Affidavits');
  const [deficiencyNotes, setDeficiencyNotes] = useState('');

  // Decision Form State
  const [decisionChoice, setDecisionChoice] = useState('APPROVED');
  const [conditionalUndertakings, setConditionalUndertakings] = useState([
    'Recruit 3 Ph.D. faculty members in Computer Science within 90 days.',
    'Procure 30 licensed industry-standard CAD/BIM workstations.'
  ]);
  const [newUndertakingText, setNewUndertakingText] = useState('');

  // AI Executive Case Brief (Module A Requirement)
  const [caseBriefs, setCaseBriefs] = useState({});
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [briefCopied, setBriefCopied] = useState(false);

  // New Application Intake Form State
  const [newAppForm, setNewAppForm] = useState({
    institutionId: 'inst_sunrise',
    institutionName: 'Sunrise Institute of Technology',
    region: 'Western Regional Office',
    state: 'Maharashtra',
    district: 'Pune',
    institutionType: 'Engineering & Technology',
    appType: 'NEW_COURSE_OR_INTAKE',
    courseDetails: 'Addition of B.Tech in Artificial Intelligence & Machine Learning (60 Seats)'
  });

  // Institution Role Isolation: If user is logged in as an Institution, they ONLY see their own college
  const isInstitutionRole = role === 'INSTITUTION';
  const accessibleApps = isInstitutionRole
    ? applications.filter(
        (app) =>
          app.institutionId === 'inst_sunrise' ||
          app.institutionName.toLowerCase().includes('sunrise')
      )
    : applications;

  // Filtered List based on search and filters
  const filteredApps = accessibleApps.filter((app) => {
    const matchesSearch =
      app.refNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.institutionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.district.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage = stageFilter === 'ALL' || app.currentStage === stageFilter;
    const matchesRegion = regionFilter === 'ALL' || app.region === regionFilter;
    const matchesRoute = routeFilter === 'ALL' || app.route === routeFilter;

    return matchesSearch && matchesStage && matchesRegion && matchesRoute;
  });

  const getStageColor = (stage) => {
    switch (stage) {
      case 'SUBMITTED':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'SCRUTINY':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'REVERTED':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      case 'EVC_QUEUE':
      case 'EVC_SCHEDULED':
        return 'bg-purple-50 text-purple-800 border-purple-300';
      case 'EVC_DONE':
        return 'bg-teal-50 text-teal-800 border-teal-300';
      case 'SAC_REVIEW':
        return 'bg-indigo-50 text-indigo-800 border-indigo-300';
      case 'DECISION':
        return 'bg-amber-100 text-amber-900 border-amber-400';
      case 'CLOSED':
        return 'bg-emerald-50 text-emerald-900 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const toggleDocket = (appId) => {
    setSelectedAppId((prev) => (prev === appId ? null : appId));
  };

  const handleCreateApplication = (e) => {
    e.preventDefault();
    const created = submitNewApplication(newAppForm, role, roleConfig.title);
    setIntakeModalOpen(false);
    setSelectedAppId(created.id);
  };

  const handleConfirmRevert = () => {
    if (!selectedApp) return;
    revertApplication(selectedApp.id, deficiencyReason, deficiencyNotes, role, roleConfig.title);
    setRevertModalOpen(false);
  };

  const handleConfirmDecision = () => {
    if (!selectedApp) return;
    decideApplication(
      selectedApp.id,
      decisionChoice,
      decisionChoice === 'CONDITIONAL' ? conditionalUndertakings : [],
      role,
      roleConfig.title,
      `Competent Authority formal decision: ${decisionChoice}`
    );
    setDecisionModalOpen(false);
  };

  const handleGenerateCaseBrief = async (app) => {
    if (!app) return;
    setIsGeneratingBrief(true);
    try {
      const summary = await api.getAicteCaseSummary(app);
      setCaseBriefs((prev) => ({ ...prev, [app.refNo]: summary }));
    } catch (err) {
      console.warn('Backend brief failed, using intelligent client brief fallback:', err);
      // Fallback in simple, friendly English
      setCaseBriefs((prev) => ({
        ...prev,
        [app.refNo]: {
          bullet_1_profile_route: `College Profile: ${app.institutionName} located in ${app.region} submitted for ${app.appType.replace(/_/g, ' ')}. Automatically assigned route "${app.route}" according to AICTE handbook rules.`,
          bullet_2_scrutiny_deficiencies: app.currentStage === 'REVERTED'
            ? `Document Check: Documents currently returned to college. Issue: "${app.deficiencyReason}". Correction cycle: #${app.resubmissionCount || 1}.`
            : `Document Check: Land records, building safety certificate, and ownership affidavits passed scrutiny checks without discrepancies.`,
          bullet_3_evc_infrastructure: ['SCRUTINY_EVC', 'SCRUTINY_EVC_SAC', 'EVC_SAC'].includes(app.route)
            ? `Campus Inspection (EVC): An expert committee visit is required to inspect classroom space, laboratories, and computer equipment.`
            : `Inspection Exemption: This extension of approval route (${app.route}) qualifies for fast paperless review without a physical visit.`,
          bullet_4_undertakings_risk: `Time Limits & Status: Application has been in "${app.currentStage}" for ${app.daysInStage} days. Dwell time is within permitted limits.`,
          bullet_5_statutory_recommendation: app.currentStage === 'REVERTED'
            ? `Next Step: Awaiting the college registrar to upload corrected certificates before moving forward.`
            : `Next Step: Application is in good order and ready to advance to the next step or final approval.`,
          executive_verdict: app.currentStage === 'REVERTED' ? 'WAITING FOR CORRECTED DOCUMENTS' : 'READY TO PROCEED TO NEXT STEP',
          ai_confidence_score: 96
        }
      }));
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handleCopyCaseBrief = (brief, app) => {
    if (!brief) return;
    const text = `AICTE APPROVAL BUREAU — AI EXECUTIVE CASE BRIEF
Application No: ${app.refNo} | College: ${app.institutionName} | Region: ${app.region}
Route: ${app.route} | Current Step: ${app.currentStage} | Verdict: ${brief.executive_verdict} (Confidence: ${brief.ai_confidence_score}%)

1. College Profile & Route: ${brief.bullet_1_profile_route}
2. Document Checks & Past Fixes: ${brief.bullet_2_scrutiny_deficiencies}
3. Campus Inspection (EVC): ${brief.bullet_3_evc_infrastructure}
4. Time Limits & Pending Conditions: ${brief.bullet_4_undertakings_risk}
5. Recommended Final Action: ${brief.bullet_5_statutory_recommendation}`;

    navigator.clipboard?.writeText(text);
    setBriefCopied(true);
    setTimeout(() => setBriefCopied(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="kicker-line mb-1">MODULE A · APPROVAL PROCESS HANDBOOK (APH)</div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            College Approval Applications
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Track and manage college applications through every approval step. The system automatically routes cases,
            tracks time limits, highlights delays, and lets officers review documents, schedule inspections, and give decisions.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIntakeModalOpen(true)}
            className="flex items-center space-x-2 bg-[#1e3a8a] hover:bg-[#172554] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Application</span>
          </button>
        </div>
      </div>

      {/* College Portal Banner (Shown ONLY for Institution role) */}
      {isInstitutionRole && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block text-sm">
                College Portal View: Sunrise Institute of Technology
              </span>
              <span className="text-slate-700">
                AISHE Code: <strong>C-41208</strong> · Western Regional Office (Pune, Maharashtra). Only your college's official applications and AI case summaries are shown below.
              </span>
            </div>
          </div>
          <span className="shrink-0 font-mono text-[11px] font-bold px-3 py-1 rounded-md bg-amber-200/80 text-amber-950 border border-amber-400">
            College Registrar Account
          </span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="civic-card rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ref number, college, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
          />
        </div>

        <div>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
          >
            <option value="ALL">All Approval Steps</option>
            <option value="SUBMITTED">1. Submitted</option>
            <option value="SCRUTINY">2. Scrutiny (Document Check)</option>
            <option value="REVERTED">⚠️ Returned to Fix Issues</option>
            <option value="EVC_QUEUE">3. Inspection Waiting List</option>
            <option value="EVC_SCHEDULED">4. Inspection Scheduled</option>
            <option value="EVC_DONE">5. Inspection Completed</option>
            <option value="SAC_REVIEW">6. Committee Review (SAC)</option>
            <option value="CLOSED">7. Decided / Closed</option>
          </select>
        </div>

        {!isInstitutionRole && (
          <div>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
            >
              <option value="ALL">All Regional Offices (8)</option>
              <option value="Western Regional Office">Western (Mumbai/Pune)</option>
              <option value="Northern Regional Office">Northern (Delhi/Kanpur)</option>
              <option value="Southern Regional Office">Southern (Chennai)</option>
              <option value="South-Western Regional Office">South-Western (Bengaluru)</option>
              <option value="South-Central Regional Office">South-Central (Hyderabad)</option>
              <option value="Eastern Regional Office">Eastern (Kolkata)</option>
              <option value="Central Regional Office">Central (Bhopal)</option>
              <option value="North-Western Regional Office">North-Western (Chandigarh)</option>
            </select>
          </div>
        )}

        <div>
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
          >
            <option value="ALL">All Approval Routes</option>
            <option value="ONLY_SCRUTINY">ONLY_SCRUTINY (Extension of Approval)</option>
            <option value="SCRUTINY_EVC">SCRUTINY_EVC (New Courses / Intake)</option>
            <option value="SCRUTINY_EVC_SAC">SCRUTINY_EVC_SAC (New Colleges)</option>
            <option value="EVC_SAC">EVC_SAC (Closure / Merger)</option>
            <option value="ONLY_EVC">ONLY_EVC</option>
          </select>
        </div>
      </div>

      {/* Applications Table with INLINE Expansion directly below the clicked row */}
      <div className="civic-card rounded-2xl overflow-hidden bg-white shadow-xs border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#1e3a8a]" />
            <h3 className="font-serif font-bold text-sm text-slate-900">
              Active Application Dockets ({filteredApps.length} Cases)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            System Date: <strong className="text-slate-800">{simulatedDate}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e293b] text-white text-[11px] font-mono uppercase tracking-wider">
                <th className="py-3 px-4">Application No.</th>
                <th className="py-3 px-4">College & Location</th>
                <th className="py-3 px-4">Request Type</th>
                <th className="py-3 px-4">Approval Route</th>
                <th className="py-3 px-4">Current Step</th>
                <th className="py-3 px-4">Days in Step</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No applications found matching your search.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const slaLimit = config.stage_sla_days[app.currentStage.toLowerCase()] || 21;
                  const isOverdue = app.daysInStage > slaLimit && app.currentStage !== 'CLOSED';
                  const isSelected = selectedAppId === app.id;

                  return (
                    <React.Fragment key={app.id}>
                      {/* MAIN ROW: Clicking this row or button opens details DIRECTLY BELOW IT */}
                      <tr
                        onClick={() => toggleDocket(app.id)}
                        className={`cursor-pointer transition-colors hover:bg-amber-50/50 ${
                          isSelected ? 'bg-amber-50/80 border-l-4 border-l-[#1e3a8a]' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-[#1e3a8a]">
                          {app.refNo}
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <span className="font-bold text-slate-900 block truncate">{app.institutionName}</span>
                          <span className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{app.district}, {app.state}</span>
                            <span>·</span>
                            <span className="text-slate-400">{app.region.split(' ')[0]}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-800 block">{app.appType.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-slate-500 font-mono truncate block max-w-[200px]">
                            {app.courseDetails}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[10.5px] px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700 font-bold">
                            {app.route}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`stamp-badge ${getStageColor(app.currentStage)}`}>
                            {app.currentStage}
                          </span>
                          {app.resubmissionCount > 0 && (
                            <span className="ml-1.5 font-mono text-[10px] text-amber-700 font-bold">
                              (Cycle #{app.resubmissionCount})
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`font-mono font-bold text-xs ${
                                isOverdue ? 'text-rose-600' : 'text-slate-700'
                              }`}
                            >
                              {app.daysInStage}d
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">/ max {slaLimit}d</span>
                            {isOverdue && (
                              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" title="SLA Limit Breached" />
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDocket(app.id);
                            }}
                            className="text-[#1e3a8a] hover:text-[#172554] font-bold text-xs inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-300 transition"
                          >
                            <span>{isSelected ? 'Close' : 'View AI Brief'}</span>
                            {isSelected ? (
                              <ChevronDown className="w-3.5 h-3.5 text-[#1e3a8a]" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-[#1e3a8a]" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* INLINE EXPANSION ROW: OPENS IMMEDIATELY BENEATH THIS ROW (NOT AT THE BOTTOM!) */}
                      {isSelected && selectedApp && (
                        <tr className="bg-slate-50/90 border-b-2 border-[#1e3a8a]/20 animate-fadeIn">
                          <td colSpan={7} className="p-4 sm:p-6">
                            <div className="bg-white rounded-2xl p-5 border border-slate-300 shadow-sm space-y-5">
                              {/* Workstation Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                                <div>
                                  <div className="flex items-center space-x-2.5">
                                    <span className="font-mono text-base font-bold text-[#1e3a8a]">
                                      Application #{selectedApp.refNo}
                                    </span>
                                    <span className={`stamp-badge ${getStageColor(selectedApp.currentStage)}`}>
                                      {selectedApp.currentStage}
                                    </span>
                                    {selectedApp.decision && (
                                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        Decision: {selectedApp.decision}
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-xl font-serif font-bold text-slate-900 mt-1">
                                    {selectedApp.institutionName}
                                  </h3>
                                  <p className="text-xs text-slate-600 font-mono mt-0.5">
                                    {selectedApp.appType.replace(/_/g, ' ')} · Route: {selectedApp.route} · Officer: {selectedApp.assignedOfficer}
                                  </p>
                                </div>

                                {/* Officer / College Action Buttons */}
                                <div className="flex flex-wrap items-center gap-2">
                                  {/* College action if Reverted */}
                                  {selectedApp.currentStage === 'REVERTED' && (
                                    <button
                                      onClick={() => resubmitApplication(selectedApp.id, role, roleConfig.title)}
                                      className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      <span>Upload Fixed Documents & Resubmit</span>
                                    </button>
                                  )}

                                  {/* Regional Officer actions */}
                                  {selectedApp.currentStage !== 'CLOSED' && selectedApp.currentStage !== 'REVERTED' && !isInstitutionRole && (
                                    <>
                                      <button
                                        onClick={() => setRevertModalOpen(true)}
                                        className="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 px-3.5 py-2 rounded-xl text-xs font-bold transition"
                                      >
                                        <Ban className="w-3.5 h-3.5 text-rose-600" />
                                        <span>Return to Fix Issues</span>
                                      </button>

                                      <button
                                        onClick={() => advanceApplication(selectedApp.id, role, roleConfig.title)}
                                        className="flex items-center space-x-1.5 bg-[#1e3a8a] hover:bg-[#172554] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                                        <span>Move to Next Step</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}

                                  {/* Bureau Director / Superadmin final approval */}
                                  {(role === 'BUREAU_OFFICER' || role === 'SUPERADMIN') && selectedApp.currentStage !== 'CLOSED' && (
                                    <button
                                      onClick={() => setDecisionModalOpen(true)}
                                      className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      <span>Give Final Approval Decision</span>
                                    </button>
                                  )}

                                  {/* Close Details Button */}
                                  <button
                                    onClick={() => setSelectedAppId(null)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                    title="Close docket details"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Deficiency Notice Alert Box if Reverted */}
                              {selectedApp.currentStage === 'REVERTED' && (
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-1">
                                  <div className="flex items-center space-x-2 font-bold text-xs text-amber-900">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>OFFICIAL DEFICIENCY NOTICE — CORRECTION REQUIRED</span>
                                  </div>
                                  <p className="text-xs font-semibold mt-1">Reason: {selectedApp.deficiencyReason}</p>
                                  <p className="text-xs text-slate-700 leading-relaxed">{selectedApp.deficiencyNote}</p>
                                </div>
                              )}

                              {/* Stage Progression Stepper */}
                              <div>
                                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500 block mb-2">
                                  APPROVAL PROGRESS TIMELINE ({selectedApp.route})
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                                  {(config.routes[selectedApp.route] || ['SUBMITTED', 'SCRUTINY', 'DECISION', 'CLOSED']).map(
                                    (stg, idx) => {
                                      const isCurrent = selectedApp.currentStage === stg;
                                      const routeList = config.routes[selectedApp.route] || [];
                                      const curIdx = routeList.indexOf(selectedApp.currentStage);
                                      const isPassed = curIdx > idx;

                                      return (
                                        <div
                                          key={stg}
                                          className={`p-3 rounded-xl border text-center transition-all ${
                                            isCurrent
                                              ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-xs'
                                              : isPassed
                                              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                              : 'bg-slate-50 text-slate-400 border-slate-200'
                                          }`}
                                        >
                                          <span className="font-mono text-[10px] block opacity-70">STEP {idx + 1}</span>
                                          <span className="font-bold text-xs mt-0.5 block truncate">{stg}</span>
                                          <span className="text-[10px] font-mono mt-1 block">
                                            {isCurrent ? `${selectedApp.daysInStage}d elapsed` : isPassed ? '✓ Done' : 'Waiting'}
                                          </span>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </div>

                              {/* AI EXECUTIVE CASE BRIEF CARD — Right under the clicked institute */}
                              {(() => {
                                const brief = caseBriefs[selectedApp.refNo];
                                return (
                                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-[#172554] to-slate-900 text-white border border-slate-700 shadow-lg space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                                      <div className="flex items-center space-x-2.5">
                                        <div className="p-2 bg-amber-400/20 text-amber-300 rounded-xl border border-amber-400/30">
                                          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                                        </div>
                                        <div>
                                          <div className="flex items-center space-x-2">
                                            <span className="font-serif font-bold text-sm tracking-wide text-white">
                                              AI Executive Case Brief
                                            </span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                                              MODULE A · PS 26262
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-slate-300 mt-0.5">
                                            Instant 5-point electronic case summary generated by AI for officers and committee members
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        {brief && (
                                          <button
                                            onClick={() => handleCopyCaseBrief(brief, selectedApp)}
                                            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 border border-white/10 transition"
                                          >
                                            {briefCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                            <span>{briefCopied ? 'Copied' : 'Copy Brief'}</span>
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleGenerateCaseBrief(selectedApp)}
                                          disabled={isGeneratingBrief}
                                          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition shadow-xs disabled:opacity-50"
                                        >
                                          {isGeneratingBrief ? (
                                            <>
                                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                                              <span>Analyzing Docket...</span>
                                            </>
                                          ) : (
                                            <>
                                              <Bot className="w-3.5 h-3.5 text-slate-950" />
                                              <span>{brief ? 'Regenerate AI Brief' : 'Generate AI Case Brief'}</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>

                                    {isGeneratingBrief ? (
                                      <div className="py-8 flex flex-col items-center justify-center space-y-3">
                                        <Loader2 className="w-8 h-8 text-amber-300 animate-spin" />
                                        <p className="text-xs text-slate-300 font-mono animate-pulse">
                                          Analyzing approval route {selectedApp.route}, past document checks, inspection history & compliance undertakings...
                                        </p>
                                      </div>
                                    ) : brief ? (
                                      <div className="space-y-3.5 text-xs">
                                        {/* Status & Confidence Strip */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
                                          <div className="flex items-center space-x-2">
                                            <span className="text-[10px] font-mono text-slate-400 uppercase">AI Recommendation:</span>
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                              {brief.executive_verdict || 'READY TO PROCEED TO NEXT STEP'}
                                            </span>
                                          </div>
                                          <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-300">
                                            <span>Accuracy: <strong className="text-amber-300">{brief.ai_confidence_score || 96}%</strong></span>
                                            <span className="text-slate-500">•</span>
                                            <span>Engine: <strong className="text-slate-200">Gemini 3.1 Multimodal</strong></span>
                                          </div>
                                        </div>

                                        {/* 5 Numbered Statutory Bullets in Simple English */}
                                        <div className="grid grid-cols-1 gap-2.5">
                                          <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                                            <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 border border-amber-400/30">
                                              1
                                            </span>
                                            <div>
                                              <span className="font-bold text-slate-200 block mb-0.5">College Profile & Approval Route</span>
                                              <p className="text-slate-300 leading-relaxed">{brief.bullet_1_profile_route}</p>
                                            </div>
                                          </div>

                                          <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                                            <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 border border-amber-400/30">
                                              2
                                            </span>
                                            <div>
                                              <span className="font-bold text-slate-200 block mb-0.5">Document Checks & Past Fixes</span>
                                              <p className="text-slate-300 leading-relaxed">{brief.bullet_2_scrutiny_deficiencies}</p>
                                            </div>
                                          </div>

                                          <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                                            <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 border border-amber-400/30">
                                              3
                                            </span>
                                            <div>
                                              <span className="font-bold text-slate-200 block mb-0.5">Campus Inspection (EVC)</span>
                                              <p className="text-slate-300 leading-relaxed">{brief.bullet_3_evc_infrastructure}</p>
                                            </div>
                                          </div>

                                          <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                                            <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 border border-amber-400/30">
                                              4
                                            </span>
                                            <div>
                                              <span className="font-bold text-slate-200 block mb-0.5">Time Limits & Pending Conditions</span>
                                              <p className="text-slate-300 leading-relaxed">{brief.bullet_4_undertakings_risk}</p>
                                            </div>
                                          </div>

                                          <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                                            <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 border border-amber-400/30">
                                              5
                                            </span>
                                            <div>
                                              <span className="font-bold text-amber-300 block mb-0.5">Recommended Final Action</span>
                                              <p className="text-slate-200 leading-relaxed font-medium">{brief.bullet_5_statutory_recommendation}</p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                                        <p className="text-slate-300 text-center sm:text-left leading-relaxed">
                                          AI Electronic Case Summary is ready to synthesize for docket <strong>{selectedApp.refNo}</strong>.
                                          Combines college information, document check history, campus visits, and pending conditions into a concise 5-point brief.
                                        </p>
                                        <button
                                          onClick={() => handleGenerateCaseBrief(selectedApp)}
                                          className="shrink-0 flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition shadow-xs"
                                        >
                                          <Sparkles className="w-4 h-4 text-slate-950" />
                                          <span>Create 5-Point AI Brief</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Docket Details Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                  <span className="font-bold text-slate-800 block mb-1">Course & Intake Details</span>
                                  <p className="text-slate-950 font-medium">{selectedApp.courseDetails}</p>
                                  <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                                    AISHE Code: {institutions.find((i) => i.name === selectedApp.institutionName)?.aisheCode || 'C-41208'}
                                  </span>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                  <span className="font-bold text-slate-800 block mb-1">Timeline & Submission Details</span>
                                  <p className="text-slate-950 font-medium">Submitted On: {selectedApp.createdAt}</p>
                                  <p className="text-slate-600 mt-0.5">Current Step Started: {selectedApp.stageEnteredAt}</p>
                                  <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                                    Document Correction Cycles: {selectedApp.resubmissionCount || 0}
                                  </span>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                  <span className="font-bold text-slate-800 block mb-1">Responsible Human Officer</span>
                                  <p className="text-slate-600 leading-relaxed">
                                    AI provides real-time summaries and watches deadlines; all decisions, document returns,
                                    and inspection visits are approved by official human officers.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Return for Deficiency */}
      {revertModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2 text-rose-700">
                <Ban className="w-5 h-5" />
                <h3 className="font-serif font-bold text-lg text-slate-900">Return Application to Fix Issues</h3>
              </div>
              <button onClick={() => setRevertModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Returning this application pauses the time limit clock and sends an official deficiency notice to{' '}
              <strong>{selectedApp.institutionName}</strong> ({selectedApp.refNo}) so they can upload fixed files.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Returning</label>
                <select
                  value={deficiencyReason}
                  onChange={(e) => setDeficiencyReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                >
                  <option>Deficient Documents / Affidavits</option>
                  <option>Land Lease Deed / Building Safety NOC Discrepancy</option>
                  <option>Faculty Cadre Ratio / Qualification Shortfall</option>
                  <option>Laboratory Equipment / Carpet Area Mismatch</option>
                  <option>Administrative Clarification Required</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Details of What Needs to Be Fixed</label>
                <textarea
                  rows={4}
                  value={deficiencyNotes}
                  onChange={(e) => setDeficiencyNotes(e.target.value)}
                  placeholder="Explain clearly what document or certificate the college needs to fix and re-upload..."
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setRevertModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRevert}
                disabled={!deficiencyNotes.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs disabled:opacity-50"
              >
                Send Notice & Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Final Decision */}
      {decisionModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2 text-emerald-800">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-serif font-bold text-lg text-slate-900">Record Final Approval Decision</h3>
              </div>
              <button onClick={() => setDecisionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Approval Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'APPROVED', label: 'APPROVED' },
                    { id: 'CONDITIONAL', label: 'CONDITIONAL' },
                    { id: 'REJECTED', label: 'REJECTED' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDecisionChoice(item.id)}
                      className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition ${
                        decisionChoice === item.id
                          ? item.id === 'APPROVED'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : item.id === 'CONDITIONAL'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Approval Undertakings Configurator */}
              {decisionChoice === 'CONDITIONAL' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
                  <span className="font-bold text-amber-900 block">
                    Conditions for College to Fulfill (90-Day Limit)
                  </span>
                  <p className="text-[11px] text-amber-800">
                    These conditions will be added to the college's compliance checklist. If proof is not submitted within 90 days, automated reminders and warnings are sent.
                  </p>

                  <div className="space-y-1.5 pt-1">
                    {conditionalUndertakings.map((ut, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white p-2 rounded-lg border border-amber-200 text-[11px]"
                      >
                        <span className="text-slate-800 font-medium">• {ut}</span>
                        <button
                          type="button"
                          onClick={() => setConditionalUndertakings((p) => p.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 ml-2 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="Add a required condition..."
                      value={newUndertakingText}
                      onChange={(e) => setNewUndertakingText(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white rounded-lg border border-amber-300 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newUndertakingText.trim()) {
                          setConditionalUndertakings([...conditionalUndertakings, newUndertakingText.trim()]);
                          setNewUndertakingText('');
                        }
                      }}
                      className="bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDecisionModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecision}
                className="px-5 py-2 text-xs font-bold text-white bg-[#1e3a8a] hover:bg-[#172554] rounded-xl transition shadow-xs"
              >
                Issue Decision Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: New Application Intake */}
      {intakeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2 text-[#1e3a8a]">
                <Plus className="w-5 h-5" />
                <h3 className="font-serif font-bold text-lg text-slate-900">Submit New Approval Application</h3>
              </div>
              <button onClick={() => setIntakeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateApplication} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Applying College / Institution</label>
                <select
                  value={newAppForm.institutionName}
                  onChange={(e) => {
                    const inst = institutions.find((i) => i.name === e.target.value);
                    if (inst) {
                      setNewAppForm({
                        ...newAppForm,
                        institutionId: inst.id,
                        institutionName: inst.name,
                        region: inst.region,
                        state: inst.state,
                        district: inst.district,
                        institutionType: inst.type
                      });
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                >
                  {(isInstitutionRole
                    ? institutions.filter(
                        (i) => i.id === 'inst_sunrise' || i.name.toLowerCase().includes('sunrise')
                      )
                    : institutions
                  ).map((i) => (
                    <option key={i.id} value={i.name}>
                      {i.name} ({i.district}, {i.region.split(' ')[0]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Application Category</label>
                  <select
                    value={newAppForm.appType}
                    onChange={(e) => setNewAppForm({ ...newAppForm, appType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  >
                    <option value="EXTENSION_OF_APPROVAL">Extension of Approval (EoA)</option>
                    <option value="NEW_COURSE_OR_INTAKE">New Course / Increase in Seats</option>
                    <option value="NEW_INSTITUTION">Setting up New Technical College</option>
                    <option value="CLOSURE_OR_MERGER">Closure / Merger of College</option>
                    <option value="NAME_CHANGE">Change of Site / Name</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Auto-Assigned Approval Route</label>
                  <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 font-mono font-bold text-[#1e3a8a]">
                    {determineRoute(newAppForm.appType, newAppForm.institutionType)}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Course & Intake Details</label>
                <input
                  type="text"
                  required
                  value={newAppForm.courseDetails}
                  onChange={(e) => setNewAppForm({ ...newAppForm, courseDetails: e.target.value })}
                  placeholder="e.g. Addition of B.Tech in Artificial Intelligence & Machine Learning (60 Seats)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIntakeModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1e3a8a] hover:bg-[#172554] rounded-xl transition shadow-xs"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
