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
  Menu,
  X
} from 'lucide-react';
import { useRole } from '../context/RoleContext';

export default function Navbar({ activeTab, setActiveTab }) {
  const { role, roleConfig, changeRole, allRoles } = useRole();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Logo & Authority Label */}
          <div
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group select-none shrink-0"
            onClick={() => {
              setActiveTab(roleConfig.allowedTabs[0] || 'scanner');
              setMobileMenuOpen(false);
            }}
          >
            <div className="relative shrink-0">
              <img
                src="/logo-icon.png"
                alt="CompliScan Logo"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain group-hover:scale-105 transition-transform"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 items-center justify-center text-white shadow-md">
                <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
                  Compli<span className="text-[#0284c7]">Scan</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
                  Tech Setu
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-tight hidden sm:block">
                Legal Metrology (Packaged Commodities) Rules, 2011
              </p>
            </div>
          </div>

          {/* Navigation Links (Desktop - centered pills) */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-sky-100 text-sky-800 font-bold border border-sky-200/60 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Officer Telemetry & Persona Switcher (Desktop) */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="text-right hover:bg-slate-50 p-1.5 rounded-xl border border-transparent hover:border-slate-200 transition"
                title="Switch Officer Persona (Prototype Testing)"
              >
                <div className="text-xs font-extrabold text-slate-900 leading-tight">
                  {roleConfig.title}
                </div>
                <div className="flex items-center space-x-1 justify-end text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>{role === 'SUPERADMIN' ? 'DIRECTOR-GEN-DL-01' : 'OFFICER-DL-2026-084'}</span>
                  <span>•</span>
                  <span className="text-sky-600 font-semibold">{roleConfig.name}</span>
                  <ChevronDown className="w-2.5 h-2.5 text-slate-400 inline ml-0.5" />
                </div>
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
          </div>

          {/* Hamburger Menu Button (Mobile & Tablet - below 1024px) */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 shadow-xs transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Slide-Down Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md px-4 py-4 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-150">
          {/* Navigation Links */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-sky-50 text-sky-800 font-bold border border-sky-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Role / Persona Selector in Mobile Drawer */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
              <span>Active Officer Persona</span>
              <span className="text-sky-600 font-mono">{roleConfig.name}</span>
            </div>
            <div className="space-y-1">
              {Object.values(allRoles).map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    changeRole(r.id);
                    setMobileMenuOpen(false);
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
          </div>
        </div>
      )}
    </header>
  );
}
