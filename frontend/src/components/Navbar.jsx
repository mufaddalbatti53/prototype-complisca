import React, { useState } from 'react';
import {
  Scale,
  Scan,
  BarChart3,
  History,
  Shield,
  Clock,
  Building2,
  ChevronDown,
  UserCheck,
  Award
} from 'lucide-react';
import { useRole } from '../context/RoleContext';

export default function Navbar({ activeTab, setActiveTab }) {
  const { role, roleConfig, changeRole, allRoles } = useRole();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const masterNavItems = [
    { id: 'scanner', label: 'Inspector Scanner', icon: Scan },
    { id: 'dashboard', label: 'Enforcement Dashboard', icon: BarChart3 },
    { id: 'history', label: 'Audit History', icon: History },
    { id: 'aging', label: 'Notice Aging', icon: Clock },
    { id: 'parties', label: 'Regulated Entities', icon: Building2 },
    { id: 'rules', label: 'Rules Engine', icon: Shield },
  ];

  // Filter navigation items based on current role's allowed tabs
  const navItems = masterNavItems.filter((item) =>
    roleConfig.allowedTabs.includes(item.id)
  );

  return (
    <header className="sticky top-0 z-50 bg-gov-900/80 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 sm:py-0 sm:h-16">
          {/* Brand Logo & Authority Label */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab(roleConfig.allowedTabs[0] || 'history')}
          >
            <div className="relative shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-400/40 group-hover:scale-105 transition-transform duration-200">
                <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500 border-2 border-gov-900"></span>
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                  CompliScan
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 tracking-wider">
                  Enterprise
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium tracking-tight hidden sm:block">
                Legal Metrology (Packaged Commodities) Rules, 2011
              </p>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden xl:flex items-center space-x-1 bg-gov-950/60 p-1 rounded-xl border border-white/[0.06]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
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

          {/* 1-Click Role Switcher & Inspector Telemetry */}
          <div className="flex items-center space-x-3">
            {/* Interactive Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${roleConfig.badgeColor}`}
                title="Switch User Role (No login/password required for prototype testing)"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Role: {roleConfig.name}</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-gov-900 border border-white/15 shadow-2xl p-2 z-50 space-y-1">
                  <div className="px-3 py-2 border-b border-white/[0.08] text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Switch Active Persona (Prototype Testing)
                  </div>
                  {Object.values(allRoles).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        changeRole(r.id);
                        setRoleMenuOpen(false);
                        // If current tab is not allowed in new role, redirect to first allowed tab
                        if (!r.allowedTabs.includes(activeTab)) {
                          setActiveTab(r.allowedTabs[0]);
                        }
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition flex flex-col space-y-0.5 ${
                        role === r.id
                          ? 'bg-gov-950 border border-cyan-500/40 text-cyan-300'
                          : 'hover:bg-white/[0.05] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{r.name}</span>
                        {role === r.id && (
                          <span className="text-[10px] text-cyan-400 font-mono font-bold">ACTIVE</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{r.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Officer Details */}
            <div className="hidden lg:flex flex-col text-right">
              <div className="flex items-center space-x-1.5 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-bold text-slate-200">{roleConfig.title}</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono tracking-wider">
                {role === 'SUPERADMIN' ? 'DIRECTOR-GEN-DL-01' : 'OFFICER-DL-2026-084'}
              </span>
            </div>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-gov-800 to-gov-900 border border-white/10 flex items-center justify-center text-amber-400 shadow-md">
              <Award className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 bg-gov-900/95 backdrop-blur-xl border-t border-white/[0.08] shadow-[0_-4px_25px_rgba(0,0,0,0.5)] z-50 px-2 py-1.5 flex items-center justify-around pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all duration-200 min-w-[56px] ${
                isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg mb-0.5 ${isActive ? 'bg-cyan-500/20 shadow-sm shadow-cyan-500/20' : 'bg-transparent'}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              </div>
              <span className={`text-[9px] font-bold tracking-tight ${isActive ? 'text-cyan-300' : 'text-slate-500'}`}>
                {item.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
