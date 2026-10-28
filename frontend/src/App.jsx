import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Scanner from './pages/Scanner';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import RuleConfig from './pages/RuleConfig';
import InspectionDetail from './pages/InspectionDetail';
import Parties from './pages/Parties';
import AgingBuckets from './pages/AgingBuckets';
import { RoleProvider } from './context/RoleContext';

export default function App() {
  const [activeTab, setActiveTab] = useState('scanner'); // scanner, dashboard, history, aging, parties, rules, detail
  const [selectedInspectionId, setSelectedInspectionId] = useState(null);

  const handleSelectInspection = (id) => {
    setSelectedInspectionId(id);
    setActiveTab('detail');
  };

  const handleBackToHistory = () => {
    setActiveTab('history');
  };

  return (
    <RoleProvider>
      <div className="min-h-screen bg-gov-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-gov-950">
        <Navbar
          activeTab={activeTab === 'detail' ? 'history' : activeTab}
          setActiveTab={(tab) => {
            setSelectedInspectionId(null);
            setActiveTab(tab);
          }}
        />

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
        <footer className="bg-gov-900 border-t border-gov-800 py-6 px-4 text-center text-xs text-gray-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-400">CompliScan</span>
              <span>•</span>
              <span>Tech Setu — Smart India Hackathon 2026</span>
            </div>
            <p className="text-[11px] text-gray-500">
              National Enforcement System for Legal Metrology Act, 2009 & LMPC Rules, 2011.
            </p>
          </div>
        </footer>
      </div>
    </RoleProvider>
  );
}
