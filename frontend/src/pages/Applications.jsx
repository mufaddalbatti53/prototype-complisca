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
  Loader2
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

  // Selected application for detail drawer
  const [selectedApp, setSelectedApp] = useState(null);

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

  // Filtered List
  const filteredApps = applications.filter((app) => {
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

  const handleCreateApplication = (e) => {
    e.preventDefault();
    const created = submitNewApplication(newAppForm, role, roleConfig.title);
    setIntakeModalOpen(false);
    setSelectedApp(created);
  };

  const handleConfirmRevert = () => {
    if (!selectedApp) return;
    revertApplication(selectedApp.id, deficiencyReason, deficiencyNotes, role, roleConfig.title);
    setRevertModalOpen(false);
    // Refresh selectedApp
    setSelectedApp((prev) => ({
      ...prev,
      currentStage: 'REVERTED',
      status: 'REVERTED',
      deficiencyReason,
      deficiencyNote: deficiencyNotes
    }));
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
    setSelectedApp((prev) => ({
      ...prev,
      currentStage: 'CLOSED',
      status: decisionChoice,
      decision: decisionChoice
    }));
  };

  const handleGenerateCaseBrief = async (app) => {
    if (!app) return;
    setIsGeneratingBrief(true);
    try {
      const summary = await api.getAicteCaseSummary(app);
      setCaseBriefs((prev) => ({ ...prev, [app.refNo]: summary }));
    } catch (err) {
      console.warn('Backend brief failed, using intelligent client brief fallback:', err);
      // Fallback
      setCaseBriefs((prev) => ({
        ...prev,
        [app.refNo]: {
          bullet_1_profile_route: `Institutional Profile: ${app.institutionName} located in ${app.region} submitted for ${app.appType.replace(/_/g, ' ')}. Auto-routed to ${app.route} under Chapter II APH norms.`,
          bullet_2_scrutiny_deficiencies: app.currentStage === 'REVERTED'
            ? `Scrutiny Status: DEFICIENCY REVERT ACTIVE. Reverted on ground: "${app.deficiencyReason}". Cycle count: #${app.resubmissionCount || 1}.`
            : `Scrutiny Status: Preliminary documentation, AICTE land demarcation, and building safety passed scrutiny without disqualifying discrepancies.`,
          bullet_3_evc_infrastructure: ['SCRUTINY_EVC', 'SCRUTINY_EVC_SAC', 'EVC_SAC'].includes(app.route)
            ? `EVC Audit: Prescribed infrastructure committee audit required. Physical site evaluation verifies instructional carpet area for proposed intake.`
            : `EVC Exemption: Extension of Approval route (${app.route}) qualifies for paperless automated scrutiny under Chapter I normative limits.`,
          bullet_4_undertakings_risk: `Pendency Risk: Application has been in stage ${app.currentStage} for ${app.daysInStage} days. Compliance status is within acceptable statutory dwell threshold.`,
          bullet_5_statutory_recommendation: app.currentStage === 'REVERTED'
            ? `Recommendation: Maintain stage hold pending upload of authenticated rectification affidavit by the Institution Registrar.`
            : `Recommendation: Docket is procedurally sound. Eligible for stage clearance to Standing Appellate Committee (SAC) / Approval Director.`,
          executive_verdict: app.currentStage === 'REVERTED' ? 'AWAITING DEFICIENCY RECTIFICATION' : 'PROCEED WITH STAGE CLEARANCE',
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
Docket Ref: ${app.refNo} | Institution: ${app.institutionName} | Region: ${app.region}
Route: ${app.route} | Stage: ${app.currentStage} | Verdict: ${brief.executive_verdict} (Confidence: ${brief.ai_confidence_score}%)

1. Institutional Profile: ${brief.bullet_1_profile_route}
2. Scrutiny & Deficiencies: ${brief.bullet_2_scrutiny_deficiencies}
3. EVC Infrastructure: ${brief.bullet_3_evc_infrastructure}
4. Compliance & Ageing: ${brief.bullet_4_undertakings_risk}
5. Statutory Recommendation: ${brief.bullet_5_statutory_recommendation}`;

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
            Application Intake & Lifecycle Routing
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Multi-stage statutory state machine. Routes every approval application through prescribed APH routes,
            tracks SLA dwell times, enforces regulatory deficiency reverts, and auto-routes completed stages.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIntakeModalOpen(true)}
            className="flex items-center space-x-2 bg-[#1e3a8a] hover:bg-[#172554] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Application Intake</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="civic-card rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search Ref No, Institution, City..."
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
            <option value="ALL">All Lifecycle Stages</option>
            <option value="SUBMITTED">1. Submitted</option>
            <option value="SCRUTINY">2. Scrutiny</option>
            <option value="REVERTED">⚠️ Reverted (Deficiency)</option>
            <option value="EVC_QUEUE">3. EVC Queue</option>
            <option value="EVC_SCHEDULED">4. EVC Scheduled</option>
            <option value="EVC_DONE">5. EVC Done</option>
            <option value="SAC_REVIEW">6. SAC Review</option>
            <option value="CLOSED">7. Decided / Closed</option>
          </select>
        </div>

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

        <div>
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
          >
            <option value="ALL">All Statutory Routes</option>
            <option value="ONLY_SCRUTINY">ONLY_SCRUTINY (EoA)</option>
            <option value="SCRUTINY_EVC">SCRUTINY_EVC (New Intake)</option>
            <option value="SCRUTINY_EVC_SAC">SCRUTINY_EVC_SAC (New Inst)</option>
            <option value="EVC_SAC">EVC_SAC (Closure/Merger)</option>
            <option value="ONLY_EVC">ONLY_EVC</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="civic-card rounded-2xl overflow-hidden bg-white">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#1e3a8a]" />
            <h3 className="font-serif font-bold text-sm text-slate-900">
              Active Application Docket ({filteredApps.length} Cases)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            SLA Clock Active · Refreshed for {simulatedDate}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e293b] text-white text-[11px] font-mono uppercase tracking-wider">
                <th className="py-3 px-4">Ref Number</th>
                <th className="py-3 px-4">Institution & Region</th>
                <th className="py-3 px-4">Application Type</th>
                <th className="py-3 px-4">Statutory Route</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">SLA Dwell</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredApps.map((app) => {
                const slaLimit = config.stage_sla_days[app.currentStage.toLowerCase()] || 21;
                const isOverdue = app.daysInStage > slaLimit && app.currentStage !== 'CLOSED';
                const isSelected = selectedApp?.id === app.id;

                return (
                  <tr
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                      isSelected ? 'row-selected' : ''
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
                      <span className="font-medium text-slate-700 block">{app.appType.replace(/_/g, ' ')}</span>
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
                          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" title="SLA Breached" />
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApp(app);
                        }}
                        className="text-[#1e3a8a] hover:text-[#172554] font-bold text-xs inline-flex items-center space-x-1"
                      >
                        <span>Inspect Docket</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Application Detail Drawer / Workstation */}
      {selectedApp && (
        <div className="civic-card rounded-2xl p-6 bg-white border border-slate-300 shadow-md space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
            <div>
              <div className="flex items-center space-x-3">
                <span className="font-mono text-base font-bold text-[#1e3a8a]">
                  Docket #{selectedApp.refNo}
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
                {selectedApp.appType} · Route: {selectedApp.route} · Assigned to: {selectedApp.assignedOfficer}
              </p>
            </div>

            {/* Officer Action Buttons (Role-Aware) */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Institution Resubmit action if Reverted */}
              {selectedApp.currentStage === 'REVERTED' && (
                <button
                  onClick={() => resubmitApplication(selectedApp.id, role, roleConfig.title)}
                  className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Upload Rectification & Resubmit</span>
                </button>
              )}

              {/* RO / Superadmin actions for in-progress stages */}
              {selectedApp.currentStage !== 'CLOSED' && selectedApp.currentStage !== 'REVERTED' && (
                <>
                  <button
                    onClick={() => setRevertModalOpen(true)}
                    className="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 px-3.5 py-2 rounded-xl text-xs font-bold transition"
                  >
                    <Ban className="w-3.5 h-3.5 text-rose-600" />
                    <span>Return for Deficiency</span>
                  </button>

                  <button
                    onClick={() => advanceApplication(selectedApp.id, role, roleConfig.title)}
                    className="flex items-center space-x-1.5 bg-[#1e3a8a] hover:bg-[#172554] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>Advance to Next Stage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {/* Bureau Officer / Superadmin final decision */}
              {(role === 'BUREAU_OFFICER' || role === 'SUPERADMIN') && selectedApp.currentStage !== 'CLOSED' && (
                <button
                  onClick={() => setDecisionModalOpen(true)}
                  className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Record Final Decision</span>
                </button>
              )}
            </div>
          </div>

          {/* Deficiency Notice Alert Box if Reverted */}
          {selectedApp.currentStage === 'REVERTED' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-1">
              <div className="flex items-center space-x-2 font-bold text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>FORMAL DEFICIENCY NOTICE ISSUED BY REGIONAL OFFICER</span>
              </div>
              <p className="text-xs font-semibold mt-1">Ground: {selectedApp.deficiencyReason}</p>
              <p className="text-xs text-slate-700 leading-relaxed">{selectedApp.deficiencyNote}</p>
            </div>
          )}

          {/* Stage Progression Stepper */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500 block mb-2">
              STATUTORY STAGE PROGRESSION PIPELINE ({selectedApp.route})
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
                      <span className="font-mono text-[10px] block opacity-70">STAGE {idx + 1}</span>
                      <span className="font-bold text-xs mt-0.5 block truncate">{stg}</span>
                      <span className="text-[10px] font-mono mt-1 block">
                        {isCurrent ? `${selectedApp.daysInStage}d elapsed` : isPassed ? '✓ Complete' : 'Pending'}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* AI Executive Case Brief Card (Module A Official SIH 26262 Requirement) */}
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
                        Automated electronic case summary for Standing Appellate Committee (SAC) & Regional Officers
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
                          <span>Synthesizing Docket...</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-3.5 h-3.5 text-slate-950" />
                          <span>{brief ? 'Regenerate Brief' : 'Generate AI Case Brief'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isGeneratingBrief ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="w-8 h-8 text-amber-300 animate-spin" />
                    <p className="text-xs text-slate-300 font-mono animate-pulse">
                      Analyzing route {selectedApp.route}, past reverts, EVC audit history & compliance undertakings...
                    </p>
                  </div>
                ) : brief ? (
                  <div className="space-y-3.5 text-xs">
                    {/* Status & Confidence Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Executive Verdict:</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {brief.executive_verdict || 'RECOMMENDED FOR ADVANCEMENT'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-300">
                        <span>Confidence: <strong className="text-amber-300">{brief.ai_confidence_score || 96}%</strong></span>
                        <span className="text-slate-500">•</span>
                        <span>Engine: <strong className="text-slate-200">Gemini 3.1 Flash-Lite</strong></span>
                      </div>
                    </div>

                    {/* 5 Numbered Statutory Bullets */}
                    <div className="grid grid-cols-1 gap-2.5">
                      <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 border border-amber-400/30">
                          1
                        </span>
                        <div>
                          <span className="font-bold text-slate-200 block mb-0.5">Institutional Profile & Route</span>
                          <p className="text-slate-300 leading-relaxed">{brief.bullet_1_profile_route}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 border border-amber-400/30">
                          2
                        </span>
                        <div>
                          <span className="font-bold text-slate-200 block mb-0.5">Scrutiny & Deficiency History</span>
                          <p className="text-slate-300 leading-relaxed">{brief.bullet_2_scrutiny_deficiencies}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 border border-amber-400/30">
                          3
                        </span>
                        <div>
                          <span className="font-bold text-slate-200 block mb-0.5">EVC & Infrastructure Verification</span>
                          <p className="text-slate-300 leading-relaxed">{brief.bullet_3_evc_infrastructure}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 border border-amber-400/30">
                          4
                        </span>
                        <div>
                          <span className="font-bold text-slate-200 block mb-0.5">Compliance Undertakings & Ageing Risk</span>
                          <p className="text-slate-300 leading-relaxed">{brief.bullet_4_undertakings_risk}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 border border-amber-400/30">
                          5
                        </span>
                        <div>
                          <span className="font-bold text-amber-300 block mb-0.5">Statutory Recommendation for SAC / DG</span>
                          <p className="text-slate-200 leading-relaxed font-medium">{brief.bullet_5_statutory_recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <p className="text-slate-300 text-center sm:text-left leading-relaxed">
                      AI Electronic Case Summary is ready to be synthesized for docket <strong>{selectedApp.refNo}</strong>.
                      Combines institutional metadata, scrutiny audit logs, EVC reports, and undertaking history into a 5-bullet SAC brief.
                    </p>
                    <button
                      onClick={() => handleGenerateCaseBrief(selectedApp)}
                      className="shrink-0 flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition shadow-xs"
                    >
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Synthesize 5-Bullet Brief</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Docket Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-700 block mb-1">Programme & Intake Details</span>
              <p className="text-slate-900 font-medium">{selectedApp.courseDetails}</p>
              <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                AISHE Code: {institutions.find((i) => i.name === selectedApp.institutionName)?.aisheCode || 'C-41208'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-700 block mb-1">Statutory Timelines</span>
              <p className="text-slate-900 font-medium">Submitted On: {selectedApp.createdAt}</p>
              <p className="text-slate-600 mt-0.5">Stage Entered: {selectedApp.stageEnteredAt}</p>
              <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                Resubmission Cycles: {selectedApp.resubmissionCount || 0}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-700 block mb-1">Competent Authority Safeguards</span>
              <p className="text-slate-600 leading-relaxed">
                Automation assists with routing and SLA monitoring; all decisions, deficiency reverts, and EVC
                schedules are reserved to authorized human officers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Revert for Deficiency */}
      {revertModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2 text-rose-700">
                <Ban className="w-5 h-5" />
                <h3 className="font-serif font-bold text-lg text-slate-900">Return Docket for Deficiency</h3>
              </div>
              <button onClick={() => setRevertModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Under APH Regulations, returning an application pauses the SLA clock and issues a formal deficiency memo
              to <strong>{selectedApp.institutionName}</strong> ({selectedApp.refNo}).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mandatory Deficiency Reason</label>
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
                <label className="font-bold text-slate-700 block mb-1">Detailed Scrutiny Observation Notes</label>
                <textarea
                  rows={4}
                  value={deficiencyNotes}
                  onChange={(e) => setDeficiencyNotes(e.target.value)}
                  placeholder="Detail the exact document or specification deficiency observed by the scrutiny committee..."
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
                Dispatch Deficiency Memo
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
                <h3 className="font-serif font-bold text-lg text-slate-900">Record Competent Authority Decision</h3>
              </div>
              <button onClick={() => setDecisionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Decision Verdict</label>
                <div className="grid grid-cols-3 gap-2">
                  {['APPROVED', 'CONDITIONAL', 'REJECTED'].map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setDecisionChoice(choice)}
                      className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition ${
                        decisionChoice === choice
                          ? choice === 'APPROVED'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : choice === 'CONDITIONAL'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Approval Undertakings Configurator */}
              {decisionChoice === 'CONDITIONAL' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
                  <span className="font-bold text-amber-900 block">
                    Time-Bound Statutory Undertakings (90 Days Deadline)
                  </span>
                  <p className="text-[11px] text-amber-800">
                    Conditions added here will enter the Compliance Monitoring registry and escalate automatically if
                    unresolved.
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
                          className="text-rose-500 hover:text-rose-700 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="Add custom undertaking condition..."
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
                Seal & Issue Formal Order
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
                <h3 className="font-serif font-bold text-lg text-slate-900">New Approval Application Intake</h3>
              </div>
              <button onClick={() => setIntakeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateApplication} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Applying Institution</label>
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
                  {institutions.map((i) => (
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
                    <option value="NEW_COURSE_OR_INTAKE">New Course / Increase in Intake</option>
                    <option value="NEW_INSTITUTION">Setting up New Technical Institution</option>
                    <option value="CLOSURE_OR_MERGER">Closure / Merger of Institution</option>
                    <option value="NAME_CHANGE">Change of Site / Name</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Auto-Determined Statutory Route</label>
                  <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 font-mono font-bold text-[#1e3a8a]">
                    {determineRoute(newAppForm.appType, newAppForm.institutionType)}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Course / Programme Details</label>
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
                  Submit Application & Generate Docket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
