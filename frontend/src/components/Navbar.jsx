import React, { useState } from 'react';
import {
  FileText,
  BarChart3,
  CalendarDays,
  ShieldAlert,
  FileCheck2,
  Building2,
  Sliders,
  History,
  ChevronDown,
  UserCheck,
  Bell,
  Clock,
  FastForward,
  RotateCcw,
  Sparkles,
  Menu,
  X,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2
} from 'lucide-react';
import { useRole } from '../context/RoleContext';
import { useAicte } from '../context/AicteContext';

export default function Navbar({ activeTab, setActiveTab }) {
  const { role, roleConfig, changeRole, allRoles } = useRole();
  const {
    simulatedDate,
    advanceDays,
    resetClock,
    notifications,
    acknowledgeNotification,
    runOneClickDemo
  } = useAicte();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  const handleSelectRole = (newRoleId) => {
    changeRole(newRoleId);
    setRoleMenuOpen(false);
    const targetRole = allRoles[newRoleId];
    if (targetRole && !targetRole.allowedTabs.includes(activeTab)) {
      setActiveTab(targetRole.allowedTabs[0] || 'applications');
    }
  };

  // 8 AICTE Navigation Tabs
  const masterNavItems = [
    { id: 'applications', label: 'Applications', icon: FileText, tag: 'Workflow' },
    { id: 'pendency', label: 'Pendency', icon: BarChart3, tag: 'Dashboard' },
    { id: 'evc', label: 'EVC', icon: CalendarDays, tag: 'Visits' },
    { id: 'compliance', label: 'Compliance', icon: ShieldAlert, tag: 'Undertakings' },
    { id: 'documents', label: 'Documents', icon: FileCheck2, tag: 'Lease & NOC' },
    { id: 'institutions', label: 'Institutions', icon: Building2, tag: 'Registry' },
    { id: 'timelines', label: 'Timelines', icon: Sliders, tag: 'APH Rules' },
    { id: 'audit', label: 'Audit Trail', icon: History, tag: 'Logs' },
  ];

  // Filter based on allowed tabs for current role
  const navItems = masterNavItems.filter((item) =>
    roleConfig.allowedTabs.includes(item.id)
  );

  // Role-filtered notifications
  const roleNotifs = notifications.filter((n) => {
    if (role === 'INSTITUTION') {
      return n.audienceRole === 'INSTITUTION' || n.institutionId === 'inst_sunrise';
    }
    if (role === 'REGIONAL_OFFICER') {
      return n.audienceRole === 'REGIONAL_OFFICER' || n.region === 'Western Regional Office';
    }
    if (role === 'BUREAU_OFFICER') {
      return n.audienceRole === 'BUREAU_OFFICER';
    }
    if (role === 'COMMITTEE') {
      return n.audienceRole === 'COMMITTEE';
    }
    return true; // SUPERADMIN sees all
  });

  const unreadNotifs = roleNotifs.filter((n) => !n.acknowledged);

  // Dynamic mobile bottom items tailored to each role
  const mobileBottomItems = (() => {
    if (role === 'INSTITUTION') {
      return [
        { id: 'applications', label: 'My Cases', icon: FileText },
        { id: 'compliance', label: 'Deadlines', icon: ShieldAlert },
        { id: 'documents', label: 'Docs', icon: FileCheck2 }
      ];
    }
    if (role === 'COMMITTEE') {
      return [
        { id: 'evc', label: 'Visits', icon: CalendarDays },
        { id: 'applications', label: 'Assigned', icon: FileText },
        { id: 'documents', label: 'Docs', icon: FileCheck2 }
      ];
    }
    if (role === 'REGIONAL_OFFICER') {
      return [
        { id: 'applications', label: 'Review', icon: FileText },
        { id: 'pendency', label: 'Pendency', icon: BarChart3 },
        { id: 'evc', label: 'EVC', icon: CalendarDays },
        { id: 'compliance', label: 'Compliance', icon: ShieldAlert }
      ];
    }
    return [
      { id: 'applications', label: 'Apps', icon: FileText },
      { id: 'pendency', label: 'Pendency', icon: BarChart3 },
      { id: 'compliance', label: 'Compliance', icon: ShieldAlert },
      { id: 'documents', label: 'Docs', icon: FileCheck2 }
    ];
  })();

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#ffffff] border-b border-[oklch(0.9_0.01_90)] shadow-xs">
        {/* Top Gazette Bar: Authority Identification & Simulated Clock */}
        <div className="bg-[#1e293b] text-white px-3 sm:px-6 py-1.5 text-xs flex items-center justify-between gap-2 border-b border-slate-700 flex-nowrap overflow-x-auto">
          <div className="flex items-center space-x-1.5 font-mono text-[10px] sm:text-[11px] text-slate-300 shrink-0 whitespace-nowrap">
            <span className="text-amber-400 font-bold tracking-wider">AICTE BUREAU</span>
            <span className="hidden xs:inline text-slate-500">·</span>
            <span className="hidden sm:inline text-slate-400">PS 26262</span>
            <span className="hidden sm:inline text-slate-500">·</span>
            <span className="text-emerald-400 font-bold hidden sm:inline">TEAM TECH SETU AI</span>
            <span className="hidden lg:inline text-slate-500">·</span>
            <span className="text-slate-300 hidden lg:inline">C.O.M.P.L.I.S.C.A.N.</span>
          </div>

          {/* Time-Machine Clock Simulation Widget (Hidden for College role) */}
          {role !== 'INSTITUTION' ? (
            <div className="flex items-center space-x-1 sm:space-x-1.5 ml-auto flex-nowrap shrink-0">
              <div className="flex items-center space-x-1 bg-slate-800/90 border border-slate-600 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono text-amber-300 whitespace-nowrap shrink-0">
                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Date: </span>
                <strong className="whitespace-nowrap">{simulatedDate}</strong>
              </div>

              <div className="flex items-center space-x-0.5 sm:space-x-1 shrink-0">
                <button
                  onClick={() => advanceDays(1)}
                  className="bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-slate-200 px-1.5 py-0.5 rounded text-[10px] sm:text-[10.5px] font-mono font-bold transition whitespace-nowrap"
                  title="Advance clock by 1 day"
                >
                  +1d
                </button>
                <button
                  onClick={() => advanceDays(7)}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded text-[10px] sm:text-[10.5px] font-mono font-bold transition flex items-center space-x-0.5 whitespace-nowrap"
                  title="Advance clock by 7 days to trigger SLA warnings"
                >
                  <FastForward className="w-2.5 h-2.5" />
                  <span>+7d</span>
                </button>
                <button
                  onClick={() => advanceDays(15)}
                  className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded text-[10px] sm:text-[10.5px] font-mono font-bold transition whitespace-nowrap"
                  title="Advance clock by 15 days to trigger critical escalations"
                >
                  +15d
                </button>
                <button
                  onClick={resetClock}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 p-1 rounded transition shrink-0"
                  title="Reset clock to 28 Oct 2026"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* One-Click Evaluator Demo Runner */}
              <button
                onClick={() => {
                  runOneClickDemo();
                  setActiveTab('applications');
                }}
                className="hidden lg:flex items-center space-x-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-2.5 py-0.5 rounded text-[11px] shadow-xs transition whitespace-nowrap"
                title="Test a complete live college application flow with 1 click"
              >
                <Sparkles className="w-3 h-3" />
                <span>Try 1-Click Demo</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 ml-auto shrink-0 flex-nowrap">
              <div className="flex items-center space-x-1 bg-amber-950/80 border border-amber-600/50 px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] font-mono text-amber-300 whitespace-nowrap">
                <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Sunrise Institute of Technology</span>
              </div>
              <div className="flex items-center space-x-1 bg-slate-800/90 border border-slate-600 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono text-slate-300 whitespace-nowrap">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="whitespace-nowrap">{simulatedDate}</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Header Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo & Authority Label */}
            <div
              className="flex items-center space-x-3 cursor-pointer group select-none shrink-0"
              onClick={() => {
                setActiveTab('applications');
                setMobileMenuOpen(false);
              }}
            >
              {/* Old Style CompliScan Logo Emblem */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <img
                  src="/logo-icon.png"
                  alt="C.O.M.P.L.I.S.C.A.N. Emblem"
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-serif font-bold text-base sm:text-lg text-[#0f172a] tracking-tight group-hover:text-[#0e7490] transition-colors">
                    C.O.M.P.L.I.S.C.A.N.
                  </h1>
                  <span className="hidden md:inline font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
                    AICTE PS 26262 · TECH SETU AI
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 font-medium leading-tight hidden sm:block max-w-md lg:max-w-xl truncate">
                  Centralized Oversight & Monitoring Platform for Legal Institutional Scrutiny, Compliance, Approvals & Alert Network
                </p>
              </div>
            </div>

            {/* Right Controls: Notification Bell + Persona Switcher */}
            <div className="flex items-center space-x-2.5 sm:space-x-4">
              {/* Notification Center Bell */}
              <button
                onClick={() => setNotifDrawerOpen(true)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
                title="Notifications & Escalation Inbox"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-mono text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {/* Role Switcher Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                  className={`flex items-center space-x-1.5 sm:space-x-2.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-left transition-all ${roleConfig.badgeColor} hover:shadow-xs`}
                >
                  <UserCheck className="w-4 h-4 shrink-0 text-slate-700" />
                  <span className="text-[11px] font-bold block md:hidden truncate max-w-[110px] leading-tight">
                    {roleConfig.shortName || roleConfig.name}
                  </span>
                  <div className="hidden md:block">
                    <span className="block text-[10.5px] uppercase font-mono font-bold tracking-wider leading-none opacity-80">
                      {roleConfig.name}
                    </span>
                    <span className="block text-xs font-semibold leading-tight mt-0.5 truncate max-w-[170px]">
                      {roleConfig.title}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5 shrink-0" />
                </button>

                {roleMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setRoleMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-xs sm:max-w-sm rounded-2xl bg-white border border-slate-200 shadow-xl z-50 p-2 overflow-hidden animate-fadeIn">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700">
                          SWITCH USER ROLE (TEST AS ANY PERSON)
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Experience the app as AICTE Director, Regional Officer, Committee, or College.
                        </p>
                      </div>

                      <div className="space-y-1">
                        {Object.values(allRoles).map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              handleSelectRole(r.id);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start space-x-2.5 ${
                              role === r.id
                                ? 'bg-slate-100 border border-slate-300 font-bold'
                                : 'hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-[#1e3a8a]" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">{r.name}</span>
                                <span className="font-mono text-[10px] text-slate-400">{r.officerId}</span>
                              </div>
                              <span className="block text-[11px] text-slate-600 truncate">{r.title}</span>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                                {r.description}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop 8-Tab Navigation Bar */}
        <div className="hidden xl:block border-t border-slate-100 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 py-1.5 overflow-x-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                      isActive
                        ? 'bg-[#1e3a8a] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-200 bg-white p-4 space-y-3 animate-fadeIn max-h-[80vh] overflow-y-auto">
            {/* Quick 1-Click Demo on Mobile */}
            <button
              onClick={() => {
                runOneClickDemo();
                setActiveTab('applications');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 active:from-amber-600 active:to-amber-700 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs transition"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Run 1-Click Application Demo</span>
            </button>

            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block px-2 pb-1.5">
                ALL 8 WORKFLOW MODULES
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#1e3a8a] text-white shadow-xs'
                          : 'text-slate-800 hover:bg-slate-100 bg-slate-50 border border-slate-200/60'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-[#1e3a8a]'}`} />
                        <span>{item.label}</span>
                      </div>
                      <span className={`text-[10px] font-mono ${isActive ? 'text-amber-200' : 'text-slate-500'}`}>
                        {item.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Time-Machine on Mobile */}
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-700 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Time-Machine Simulation</span>
                </span>
                <span className="font-bold text-[#1e3a8a]">{simulatedDate}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <button
                  onClick={() => advanceDays(1)}
                  className="py-1.5 text-center bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-800 transition"
                >
                  +1d
                </button>
                <button
                  onClick={() => advanceDays(7)}
                  className="py-1.5 text-center bg-amber-100 border border-amber-300 hover:bg-amber-200 rounded-lg text-xs font-bold text-amber-900 transition"
                >
                  +7d (L2)
                </button>
                <button
                  onClick={() => advanceDays(15)}
                  className="py-1.5 text-center bg-rose-100 border border-rose-300 hover:bg-rose-200 rounded-lg text-xs font-bold text-rose-900 transition"
                >
                  +15d (L4)
                </button>
                <button
                  onClick={resetClock}
                  className="py-1.5 text-center bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold text-slate-800 transition flex items-center justify-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (Persistent Thumb Navigation) */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 flex items-center justify-around shadow-lg">
        {mobileBottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all relative ${
                isActive
                  ? 'text-[#1e3a8a] font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#1e3a8a]' : 'text-slate-500'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#1e3a8a]" />
                )}
              </div>
              <span className="text-[10.5px] mt-1 font-medium truncate max-w-[64px] tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* More / All Modules Tab */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all ${
            mobileMenuOpen || ['evc', 'institutions', 'timelines', 'audit'].includes(activeTab)
              ? 'text-amber-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Menu className="w-5 h-5" />
            {['evc', 'institutions', 'timelines', 'audit'].includes(activeTab) && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-600" />
            )}
          </div>
          <span className="text-[10.5px] mt-1 font-medium tracking-tight">
            {['evc', 'institutions', 'timelines', 'audit'].includes(activeTab)
              ? navItems.find((i) => i.id === activeTab)?.label || 'More'
              : 'More'}
          </span>
        </button>
      </nav>

      {/* Notifications Drawer (Slide-Over) */}
      {notifDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={() => setNotifDrawerOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-[#1e3a8a]" />
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Notification & Escalation Center
                </h3>
              </div>
              <button
                onClick={() => setNotifDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Real-time regulatory alerts generated by the APH Due-Date Sweeper and Escalation Ladder.
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {roleNotifs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-60" />
                  <p className="text-sm font-semibold">No active notifications</p>
                  <p className="text-xs">All application stages and undertakings are within SLA limits for your role.</p>
                </div>
              ) : (
                roleNotifs.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      n.acknowledged
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : n.severity === 'critical'
                        ? 'bg-rose-50 border-rose-300 text-rose-950'
                        : n.severity === 'warning'
                        ? 'bg-amber-50 border-amber-300 text-amber-950'
                        : 'bg-blue-50 border-blue-300 text-blue-950'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/80 border border-current">
                        {n.type}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">{n.createdAt}</span>
                    </div>
                    <p className="text-xs leading-relaxed font-medium">{n.message}</p>
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-500">Ref: {n.refId}</span>
                      {!n.acknowledged && (
                        <button
                          onClick={() => acknowledgeNotification(n.id)}
                          className="font-semibold text-[#1e3a8a] hover:underline"
                        >
                          Mark Acknowledged
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
