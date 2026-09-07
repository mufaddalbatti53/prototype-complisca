import React from 'react';
import { Scale, Scan, BarChart3, History, Shield, Award, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'scanner', label: 'Inspector Scanner', icon: Scan },
    { id: 'dashboard', label: 'Enforcement Dashboard', icon: BarChart3 },
    { id: 'history', label: 'Audit History', icon: History },
    { id: 'rules', label: 'Rules Engine Config', icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-50 bg-gov-900/80 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Authority Label */}
          <div
            className="flex items-center space-x-3.5 cursor-pointer group"
            onClick={() => setActiveTab('scanner')}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-400/40 group-hover:scale-105 transition-transform duration-200">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-gov-900"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-extrabold tracking-tight text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                  CompliScan
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 tracking-wider">
                  SIH 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-tight">
                Legal Metrology (Packaged Commodities) Rules, 2011
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-gov-950/60 p-1 rounded-xl border border-white/[0.06]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Officer Credentials & Telemetry */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex flex-col text-right">
              <div className="flex items-center space-x-1.5 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-bold text-slate-200">Insp. R. Sharma</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono tracking-wider">
                OFFICER-DL-2026-084
              </span>
            </div>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-gov-800 to-gov-900 border border-white/10 flex items-center justify-center text-amber-400 shadow-md">
              <Award className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
