import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Scanner from './pages/Scanner';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import RuleConfig from './pages/RuleConfig';
import InspectionDetail from './pages/InspectionDetail';
import Parties from './pages/Parties';
import AgingBuckets from './pages/AgingBuckets';
import { RoleProvider } from './context/RoleContext';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('scanner'); // scanner, dashboard, history, aging, parties, rules, detail
  const [selectedInspectionId, setSelectedInspectionId] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking'); // checking, waking, ready

  useEffect(() => {
    // If health check takes > 2.5s, server is cold-starting on Render free tier
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

  const handleSelectInspection = (id) => {
    setSelectedInspectionId(id);
    setActiveTab('detail');
  };

  const handleBackToHistory = () => {
    setActiveTab('history');
  };

  return (
    <RoleProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-brand-500 selection:text-white">
        <Navbar
          activeTab={activeTab === 'detail' ? 'history' : activeTab}
          setActiveTab={(tab) => {
            setSelectedInspectionId(null);
            setActiveTab(tab);
          }}
        />

        {serverStatus === 'waking' && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-xs text-amber-800 font-medium flex items-center justify-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span>Waking up cloud server from standby (Render Free Tier) — please allow ~20-30s for the first response...</span>
          </div>
        )}

        <main className="flex-1 pb-20">
          {activeTab === 'scanner' && <Scanner />}
          {activeTab === 'dashboard' && <Dashboard onSelectInspection={handleSelectInspection} />}
          {activeTab === 'history' && <History onSelectInspection={handleSelectInspection} />}
          {activeTab === 'aging' && <AgingBuckets onSelectInspection={handleSelectInspection} />}
          {activeTab === 'parties' && <Parties />}
          {activeTab === 'rules' && <RuleConfig />}
          {activeTab === 'detail' && (
            <InspectionDetail
              inspectionId={selectedInspectionId}
              onBack={handleBackToHistory}
            />
          )}
        </main>

        {/* GovTech Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-800">CompliScan</span>
              <span>•</span>
              <span className="text-brand-600 font-semibold">Tech Setu</span>
              <span>•</span>
              <span>Smart India Hackathon 2026</span>
            </div>
            <p className="text-[11px] text-slate-500">
              National Enforcement System for Legal Metrology Act, 2009 & LMPC Rules, 2011.
            </p>
          </div>
        </footer>
      </div>
    </RoleProvider>
  );
}
