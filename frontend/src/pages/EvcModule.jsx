import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileText,
  MapPin,
  Calendar,
  X,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Search,
  Filter,
  Building2
} from 'lucide-react';
import { useAicte } from '../context/AicteContext';
import { useRole } from '../context/RoleContext';

export default function EvcModule() {
  const { evcVisits, scheduleEvcVisit, completeEvcVisit, simulatedDate } = useAicte();
  const { role, roleConfig } = useRole();
  const isInstitutionRole = role === 'INSTITUTION';

  const [activeTab, setActiveTab] = useState('QUEUE'); // 'QUEUE', 'SCHEDULED', 'COMPLETED', 'CALENDAR'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);

  // Schedule Form State
  const [scheduleForm, setScheduleForm] = useState({
    scheduledDate: '2026-11-05',
    convener: 'Prof. K. Ramanathan (IIT Hyderabad)',
    members: 'Dr. Meera Swaminathan (NIT Warangal), Shri V. Rao (RO Representative)',
    mode: 'PHYSICAL'
  });

  // Complete Form State
  const [completeForm, setCompleteForm] = useState({
    recommendation: 'RECOMMENDED_FOR_APPROVAL',
    observations: 'Physical inspection completed. Campus land area (5.2 Acres), built-up administrative area, computer laboratories (120 terminals), and library titles satisfy APH 2026 norms. Faculty cadre ratio meets 1:15 requirement.',
    reportUrl: '/reports/EVC_Final_Report_Verified.pdf'
  });

  // Institution Isolation: If logged in as college, only see your own institution visits
  const accessibleVisits = isInstitutionRole
    ? evcVisits.filter(
        (v) => v.institutionId === 'inst_sunrise' || v.institutionName.toLowerCase().includes('sunrise')
      )
    : evcVisits;

  // Filtered visits
  const filteredVisits = accessibleVisits.filter((v) => {
    const matchesSearch =
      v.refNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.institutionName.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'QUEUE') return matchesSearch && v.status === 'QUEUED';
    if (activeTab === 'SCHEDULED') return matchesSearch && v.status === 'SCHEDULED';
    if (activeTab === 'COMPLETED') return matchesSearch && v.status === 'COMPLETED';
    return matchesSearch;
  });

  const queuedCount = accessibleVisits.filter((v) => v.status === 'QUEUED').length;
  const scheduledCount = accessibleVisits.filter((v) => v.status === 'SCHEDULED').length;
  const completedCount = accessibleVisits.filter((v) => v.status === 'COMPLETED').length;

  const handleOpenSchedule = (visit) => {
    setSelectedVisit(visit);
    setScheduleModalOpen(true);
  };

  const handleOpenComplete = (visit) => {
    setSelectedVisit(visit);
    setCompleteModalOpen(true);
  };

  const handleConfirmSchedule = (e) => {
    e.preventDefault();
    if (!selectedVisit) return;
    scheduleEvcVisit(
      selectedVisit.id,
      {
        scheduledDate: scheduleForm.scheduledDate,
        convener: scheduleForm.convener,
        members: scheduleForm.members.split(',').map((m) => m.trim()),
        mode: scheduleForm.mode
      },
      role,
      roleConfig.title
    );
    setScheduleModalOpen(false);
  };

  const handleConfirmComplete = (e) => {
    e.preventDefault();
    if (!selectedVisit) return;
    completeEvcVisit(
      selectedVisit.id,
      {
        observations: completeForm.observations,
        reportUrl: completeForm.reportUrl,
        recommendation: completeForm.recommendation
      },
      role,
      roleConfig.title
    );
    setCompleteModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="kicker-line mb-1">MODULE C · EXPERT VISITING COMMITTEE (EVC) · TECH SETU AI</div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Campus Inspections & Committee Visits (EVC)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Manage physical and hybrid on-site campus inspections. Track colleges waiting for inspection,
            schedule expert committee visits within 21/30-day deadlines, and upload signed inspection reports.
          </p>
        </div>
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
                Viewing only your college's scheduled and upcoming inspection visits. Other institutions are hidden.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('QUEUE')}
          className={`civic-card rounded-2xl p-5 cursor-pointer transition-all ${
            activeTab === 'QUEUE' ? 'border-[#1e3a8a] ring-2 ring-[#1e3a8a]/10 bg-blue-50/40' : 'bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-blue-900">WAITING FOR INSPECTION</span>
            <Clock className="w-5 h-5 text-blue-700" />
          </div>
          <h3 className="text-3xl font-serif font-bold text-blue-950 mt-2">{queuedCount}</h3>
          <span className="text-[11px] text-blue-700 font-mono mt-1 block">
            Colleges waiting for committee date ({queuedCount > 0 ? 'Urgent' : 'Clear'})
          </span>
        </div>

        <div
          onClick={() => setActiveTab('SCHEDULED')}
          className={`civic-card rounded-2xl p-5 cursor-pointer transition-all ${
            activeTab === 'SCHEDULED' ? 'border-purple-600 ring-2 ring-purple-600/10 bg-purple-50/40' : 'bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-purple-900">SCHEDULED VISITS</span>
            <CalendarDays className="w-5 h-5 text-purple-700" />
          </div>
          <h3 className="text-3xl font-serif font-bold text-purple-950 mt-2">{scheduledCount}</h3>
          <span className="text-[11px] text-purple-700 font-mono mt-1 block">
            Upcoming Inspection Rosters Confirmed
          </span>
        </div>

        <div
          onClick={() => setActiveTab('COMPLETED')}
          className={`civic-card rounded-2xl p-5 cursor-pointer transition-all ${
            activeTab === 'COMPLETED' ? 'border-emerald-600 ring-2 ring-emerald-600/10 bg-emerald-50/40' : 'bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-emerald-900">COMPLETED INSPECTIONS</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          </div>
          <h3 className="text-3xl font-serif font-bold text-emerald-950 mt-2">{completedCount}</h3>
          <span className="text-[11px] text-emerald-700 font-mono mt-1 block">
            Signed Observations Uploaded to Docket
          </span>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="civic-card rounded-2xl p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'QUEUE', label: `Pending Queue (${queuedCount})` },
            { id: 'SCHEDULED', label: `Scheduled Rosters (${scheduledCount})` },
            { id: 'COMPLETED', label: `Completed Reports (${completedCount})` },
            { id: 'CALENDAR', label: 'Month Calendar' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#1e3a8a] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Ref No or College..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
          />
        </div>
      </div>

      {/* Calendar View Tab */}
      {activeTab === 'CALENDAR' ? (
        <div className="civic-card rounded-2xl p-6 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-[#1e3a8a]" />
              <h3 className="font-serif font-bold text-base text-slate-900">
                November 2026 EVC Inspection Schedule
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">Official AICTE Committee Roster</span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <span key={d} className="font-mono font-bold text-slate-400 py-1 uppercase text-[10px]">
                {d}
              </span>
            ))}

            {Array.from({ length: 30 }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `2026-11-${dayNum < 10 ? '0' + dayNum : dayNum}`;
              const matchingVisits = evcVisits.filter((v) => v.scheduledDate === dateStr);

              return (
                <div
                  key={i}
                  className={`min-h-[85px] p-2 rounded-xl border text-left flex flex-col justify-between transition ${
                    matchingVisits.length > 0
                      ? 'bg-amber-50/50 border-amber-300'
                      : 'bg-slate-50 border-slate-100 text-slate-600'
                  }`}
                >
                  <span className="font-mono text-xs font-bold">{dayNum}</span>
                  {matchingVisits.map((mv) => (
                    <div
                      key={mv.id}
                      onClick={() => handleOpenComplete(mv)}
                      className="cursor-pointer bg-[#1e3a8a] text-white p-1 rounded text-[10px] font-medium leading-tight shadow-xs hover:bg-[#172554] transition"
                    >
                      <span className="font-bold block truncate">{mv.refNo}</span>
                      <span className="text-[9px] text-amber-300 block truncate">{mv.institutionName.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Visit Queue & Records Table */
        <div className="civic-card rounded-2xl overflow-hidden bg-white">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1e293b] text-white text-[11px] font-mono uppercase tracking-wider">
                  <th className="py-3 px-4">Docket Ref</th>
                  <th className="py-3 px-4">Institution & Region</th>
                  <th className="py-3 px-4">Urgency Window</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Convener & Committee</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVisits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No EVC inspection visits matching current filter.
                    </td>
                  </tr>
                ) : (
                  filteredVisits.map((v) => {
                    const isUrgent = v.daysWaiting > v.urgencyWindowDays;

                    return (
                      <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#1e3a8a]">
                          {v.refNo}
                          <span className="block text-[10px] text-slate-400 font-normal">{v.id}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{v.institutionName}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{v.region}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`font-mono font-bold ${
                                isUrgent ? 'text-rose-600' : 'text-slate-800'
                              }`}
                            >
                              {v.daysWaiting}d waiting
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">/ max {v.urgencyWindowDays}d</span>
                            {isUrgent && (
                              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" title="Scheduling SLA Breached" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block">Deadline: {v.deadline}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span
                              className={`stamp-badge ${
                                isUrgent
                                  ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
                                  : v.status === 'QUEUED'
                                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                                  : v.status === 'SCHEDULED'
                                  ? 'bg-purple-50 text-purple-900 border-purple-300'
                                  : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              }`}
                            >
                              {isUrgent ? 'OVERDUE (2d Breach)' : v.status}
                            </span>
                            {isUrgent && (
                              <span className="block text-[9.5px] font-mono text-rose-700 font-bold">
                                L2 Escalated (RO SLA Alert)
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          {v.convener ? (
                            <div>
                              <span className="font-bold text-slate-900 block truncate">{v.convener}</span>
                              <span className="text-[10px] text-slate-500 font-mono block truncate">
                                Date: {v.scheduledDate} ({v.mode})
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono italic">Not yet assigned</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {v.status === 'QUEUED' && (
                            <button
                              onClick={() => handleOpenSchedule(v)}
                              className="bg-[#1e3a8a] hover:bg-[#172554] text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition"
                            >
                              Schedule Visit
                            </button>
                          )}

                          {v.status === 'SCHEDULED' && (
                            <button
                              onClick={() => handleOpenComplete(v)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition"
                            >
                              Upload EVC Report
                            </button>
                          )}

                          {v.status === 'COMPLETED' && (
                            <span className="text-emerald-700 font-bold font-mono text-[11px] inline-flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Verified</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile EVC Inspection Cards View (Zero Horizontal Scrolling) */}
          <div className="block md:hidden divide-y divide-slate-100 p-2 sm:p-3 space-y-3">
            {filteredVisits.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No EVC inspection visits matching current filter.
              </div>
            ) : (
              filteredVisits.map((v) => {
                const isUrgent = v.daysWaiting > v.urgencyWindowDays;

                return (
                  <div
                    key={v.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                      isUrgent
                        ? 'border-rose-300 bg-rose-50/30 shadow-xs'
                        : v.status === 'SCHEDULED'
                        ? 'border-purple-300 bg-purple-50/20 shadow-xs'
                        : v.status === 'COMPLETED'
                        ? 'border-emerald-300 bg-emerald-50/20 shadow-xs'
                        : 'border-slate-200 bg-white shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-xs text-[#1e3a8a] block">
                          {v.refNo}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 block">ID: {v.id}</span>
                      </div>

                      <span
                        className={`stamp-badge text-[9.5px] shrink-0 ${
                          v.status === 'QUEUED'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : v.status === 'SCHEDULED'
                            ? 'bg-purple-50 text-purple-900 border-purple-300'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>

                    <div className="mt-2.5 space-y-1 text-xs">
                      <p className="font-bold text-slate-900">{v.institutionName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{v.region}</p>
                      {v.convener ? (
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 mt-1.5 space-y-0.5">
                          <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
                            Assigned Convener
                          </span>
                          <p className="font-semibold text-slate-800 text-[11px]">{v.convener}</p>
                          <span className="text-[10px] text-purple-700 font-mono block">
                            Date: {v.scheduledDate} ({v.mode})
                          </span>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Convener not yet assigned</p>
                      )}
                    </div>

                    {/* Dwell / Urgency bar */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span
                          className={`font-mono font-bold ${
                            isUrgent ? 'text-rose-600' : 'text-slate-800'
                          }`}
                        >
                          {v.daysWaiting}d waiting
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">/ {v.urgencyWindowDays}d</span>
                        {isUrgent && (
                          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse ml-0.5" />
                        )}
                      </div>

                      {v.status === 'QUEUED' && (
                        <button
                          onClick={() => handleOpenSchedule(v)}
                          className="bg-[#1e3a8a] hover:bg-[#172554] text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition shrink-0"
                        >
                          Schedule
                        </button>
                      )}

                      {v.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleOpenComplete(v)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition shrink-0"
                        >
                          Upload Report
                        </button>
                      )}

                      {v.status === 'COMPLETED' && (
                        <span className="text-emerald-700 font-bold font-mono text-[11px] inline-flex items-center space-x-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Schedule EVC Visit */}
      {scheduleModalOpen && selectedVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2 text-[#1e3a8a]">
                <CalendarDays className="w-5 h-5" />
                <h3 className="font-serif font-bold text-lg text-slate-900">
                  Schedule Expert Visiting Committee (EVC)
                </h3>
              </div>
              <button onClick={() => setScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Assign inspection date and committee members for <strong>{selectedVisit.institutionName}</strong> (Docket #{selectedVisit.refNo}).
            </p>

            <form onSubmit={handleConfirmSchedule} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Inspection Visit Date</label>
                <input
                  type="date"
                  required
                  value={scheduleForm.scheduledDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">EVC Convener (Senior Professor / Director)</label>
                <select
                  value={scheduleForm.convener}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, convener: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                >
                  <option>Prof. K. Ramanathan (IIT Hyderabad)</option>
                  <option>Dr. S. Sundaram (Anna University)</option>
                  <option>Prof. R. P. Mukherjee (Jadavpur University)</option>
                  <option>Dr. Ananya Sen (VNIT Nagpur)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Committee Members (Comma separated)</label>
                <input
                  type="text"
                  required
                  value={scheduleForm.members}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, members: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Inspection Modality</label>
                <div className="grid grid-cols-2 gap-2">
                  {['PHYSICAL', 'HYBRID'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setScheduleForm({ ...scheduleForm, mode })}
                      className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition ${
                        scheduleForm.mode === mode
                          ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mode === 'PHYSICAL' ? '🏢 Physical On-Site Visit' : '💻 Hybrid (Video + Verifier)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1e3a8a] hover:bg-[#172554] rounded-xl transition shadow-xs"
                >
                  Confirm & Dispatch Schedule Alerts
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Complete EVC & Upload Report */}
      {completeModalOpen && selectedVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2 text-emerald-800">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-serif font-bold text-lg text-slate-900">
                  Submit EVC Inspection Observations & Report
                </h3>
              </div>
              <button onClick={() => setCompleteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmComplete} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Committee Statutory Recommendation</label>
                <select
                  value={completeForm.recommendation}
                  onChange={(e) => setCompleteForm({ ...completeForm, recommendation: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="RECOMMENDED_FOR_APPROVAL">Recommended for Full Approval</option>
                  <option value="RECOMMENDED_WITH_UNDERTAKINGS">Recommended Subject to 90-Day Undertakings</option>
                  <option value="NOT_RECOMMENDED">Not Recommended (Critical Infrastructure Shortfall)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Committee Executive Observations</label>
                <textarea
                  rows={4}
                  required
                  value={completeForm.observations}
                  onChange={(e) => setCompleteForm({ ...completeForm, observations: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#1e3a8a]" />
                  <span className="font-mono text-xs text-slate-700">Signed_EVC_Report_Dossier.pdf</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700">Attached (1.4 MB)</span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-xs"
                >
                  Seal EVC & Advance Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
