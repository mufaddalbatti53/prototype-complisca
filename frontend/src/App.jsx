import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Applications from './pages/Applications';
import Pendency from './pages/Pendency';
import EvcModule from './pages/EvcModule';
import Compliance from './pages/Compliance';
import Documents from './pages/Documents';
import Institutions from './pages/Institutions';
import Timelines from './pages/Timelines';
import AuditTrail from './pages/AuditTrail';
import { RoleProvider, useRole } from './context/RoleContext';
import { AicteProvider, useAicte } from './context/AicteContext';
import { api } from './services/api';
import { Sparkles, CheckCircle2, AlertTriangle, Info, Bell, UserCheck } from 'lucide-react';

const VALID_TABS = [
  'applications',
  'pendency',
  'evc',
  'compliance',
  'documents',
  'institutions',
  'timelines',
  'audit'
];

const getInitialTab = () => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (VALID_TABS.includes(hash)) {
      return hash;
    }
  }
  return 'applications';
};

function AppContent() {
  const [activeTab, setActiveTabState] = useState(getInitialTab);
  const [serverStatus, setServerStatus] = useState('checking'); // checking, waking, ready
  const { activeToast } = useAicte();
  const { role, roleConfig } = useRole();

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
    }
  };

  useEffect(() => {
    if (roleConfig?.defaultTab) {
      setActiveTab(roleConfig.defaultTab);
    } else if (roleConfig && !roleConfig.allowedTabs.includes(activeTab)) {
      setActiveTab(roleConfig.allowedTabs[0] || 'applications');
    }
  }, [role]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (VALID_TABS.includes(hash)) {
        setActiveTabState(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const wakeTimer = setTimeout(() => {
      setServerStatus((prev) => (prev === 'checking' ? 'waking' : prev));
    }, 2500);

    api.checkHealth()
      .then(() => {
        clearTimeout(wakeTimer);
        setServerStatus('ready');
      })
      .catch(() => {
        setServerStatus('waking');
      });

    return () => clearTimeout(wakeTimer);
  }, []);

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.005_90)] text-[oklch(0.22_0.04_260)] flex flex-col font-sans selection:bg-[#1e3a8a] selection:text-white overflow-x-hidden w-full max-w-full">
      {/* Toast Banner notification */}
      {activeToast && (
        <div
          className={`fixed bottom-5 right-5 z-50 max-w-md p-4 rounded-2xl shadow-2xl border text-xs font-semibold flex items-start space-x-3 transition-all animate-bounceIn ${
            activeToast.type === 'critical' || activeToast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : activeToast.type === 'warning'
              ? 'bg-amber-900 text-amber-100 border-amber-700'
              : 'bg-slate-900 text-slate-100 border-slate-700'
          }`}
        >
          {activeToast.type === 'critical' ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : activeToast.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span className="font-bold block uppercase text-[10px] tracking-wider opacity-70">
              {activeToast.type === 'critical' ? 'STATUTORY BREACH ALERT' : 'WORKFLOW NOTIFICATION'}
            </span>
            <p className="mt-0.5 text-xs leading-relaxed">{activeToast.message}</p>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Colored Role Context Banner (Strict zero horizontal overflow) */}
      <div
        className={`px-3 sm:px-6 py-1.5 border-b text-xs flex items-center justify-between gap-2 shadow-2xs w-full max-w-full overflow-hidden ${
          role === 'SUPERADMIN'
            ? 'bg-slate-900 text-amber-200 border-slate-800'
            : role === 'REGIONAL_OFFICER'
            ? 'bg-[#1e3a8a] text-blue-100 border-blue-900'
            : role === 'BUREAU_OFFICER'
            ? 'bg-indigo-950 text-indigo-100 border-indigo-900'
            : role === 'COMMITTEE'
            ? 'bg-emerald-900 text-emerald-100 border-emerald-800'
            : 'bg-amber-950 text-amber-100 border-amber-900'
        }`}
      >
        <div className="flex items-center space-x-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-current animate-pulse shrink-0" />
          <span className="font-bold tracking-wide truncate text-[11px] sm:text-xs">
            Viewing as: {roleConfig.shortName || roleConfig.name}
            <span className="hidden md:inline font-normal opacity-90"> ({roleConfig.title})</span>
          </span>
          <span className="hidden lg:inline opacity-60">|</span>
          <span className="hidden lg:inline font-mono opacity-90 text-[11px] truncate">
            {roleConfig.jurisdiction || 'National'}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] font-mono opacity-90 shrink-0">
          <span className="hidden sm:inline">Team: <strong>TECH SETU AI</strong> ·</span>
          <span>ID: <strong>{roleConfig.officerId}</strong></span>
        </div>
      </div>

      {/* Render Server Standby Banner */}
      {serverStatus === 'waking' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-900 font-medium flex items-center justify-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          <span>
            Connecting to FastAPI AICTE backend engine (Render Free Tier) — cold start may take ~15s on first load...
          </span>
        </div>
      )}

      {/* Main Tab Routing */}
      <main className="flex-1 pb-24 xl:pb-12">
        {activeTab === 'applications' && <Applications />}
        {activeTab === 'pendency' && <Pendency />}
        {activeTab === 'evc' && <EvcModule />}
        {activeTab === 'compliance' && <Compliance />}
        {activeTab === 'documents' && <Documents />}
        {activeTab === 'institutions' && <Institutions />}
        {activeTab === 'timelines' && <Timelines />}
        {activeTab === 'audit' && <AuditTrail />}
      </main>

      {/* Bharat Civic Footer */}
      <footer className="bg-white border-t border-[oklch(0.9_0.01_90)] py-6 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <img src="/logo-icon.png" alt="C.O.M.P.L.I.S.C.A.N. Logo" className="w-5 h-5 object-contain" />
            <span className="font-serif font-bold text-slate-900 text-sm">C.O.M.P.L.I.S.C.A.N.</span>
            <span>·</span>
            <span className="text-[#1e3a8a] font-semibold">Team TECH SETU AI</span>
            <span>·</span>
            <span className="font-medium text-slate-700">Smart India Hackathon 2026</span>
            <span>·</span>
            <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              Problem Statement ID: 26262
            </span>
          </div>
          <p className="text-[11px] text-slate-500 max-w-xl">
            Centralized Oversight & Monitoring Platform for Legal Institutional Scrutiny, Compliance, Approvals & Alert Network.
            Engineered under the Approval Process Handbook (APH) Regulations.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <RoleProvider>
      <AicteProvider>
        <AppContent />
      </AicteProvider>
    </RoleProvider>
  );
}
