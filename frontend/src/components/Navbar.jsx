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
    { id: 'scanner', label: 'Inspector', icon: Scan },
    { id: 'dashboard', label: 'Enforcement', icon: BarChart3 },
    { id: 'history', label: 'Audit history', icon: History },
    { id: 'aging', label: 'Notices', icon: Clock },
    { id: 'parties', label: 'Entities', icon: Building2 },
    { id: 'rules', label: 'Rules', icon: Shield },
  ];

  // Filter navigation items based on current role's allowed tabs
  const navItems = masterNavItems.filter((item) =>
    roleConfig.allowedTabs.includes(item.id)
  );

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5 sm:h-16">
          {/* Brand Logo & Authority Label */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab(roleConfig.allowedTabs[0] || 'scanner')}
          >
            <div className="relative shrink-0">
              <img
                src="/logo-icon.png"
                alt="CompliScan Logo"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain group-hover:scale-105 transition-transform"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 items-center justify-center text-white shadow-md">
                <Scale className="w-5 h-5" />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
                  Compli<span className="text-[#0284c7]">Scan</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
                  Tech Setu
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-tight hidden sm:block">
                Legal Metrology (Packaged Commodities) Rules, 2011
              </p>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/60">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-sky-700 shadow-xs font-bold border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* 1-Click Role Switcher & Officer Telemetry */}
          <div className="flex items-center space-x-3">
            {/* Interactive Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition"
                title="Switch User Role (Zero-login prototype persona switcher)"
              >
                <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>{roleConfig.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Switch Active Persona (Prototype Testing)
                  </div>
                  {Object.values(allRoles).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        changeRole(r.id);
                        setRoleMenuOpen(false);
                        if (!r.allowedTabs.includes(activeTab)) {
                          setActiveTab(r.allowedTabs[0]);
                        }
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition flex flex-col space-y-0.5 ${
                        role === r.id
                          ? 'bg-sky-50 border border-sky-200 text-sky-800'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{r.name}</span>
                        {role === r.id && (
                          <span className="text-[10px] text-sky-600 font-mono font-bold">ACTIVE</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">{r.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Officer Details */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800">{roleConfig.title}</span>
              <div className="flex items-center space-x-1 justify-end text-[10px] text-slate-500 font-mono">
                <span>{role === 'SUPERADMIN' ? 'DIRECTOR-GEN-DL-01' : 'OFFICER-DL-2026-084'}</span>
                <span>•</span>
                <span className="text-sky-600 font-semibold">{roleConfig.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg z-50 px-2 py-1.5 flex items-center justify-around pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all duration-150 min-w-[52px] ${
                isActive ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-sky-50 text-sky-600 font-bold' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold mt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
