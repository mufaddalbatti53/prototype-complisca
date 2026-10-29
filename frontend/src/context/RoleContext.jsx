import React, { createContext, useContext, useState, useEffect } from 'react';

export const AICTE_ROLES = {
  SUPERADMIN: {
    id: 'SUPERADMIN',
    name: 'Member Secretary / DG',
    shortName: 'DG / MS',
    title: 'Director General / Member Secretary, AICTE',
    officerId: 'AICTE-HQ-MS-001',
    badgeColor: 'bg-slate-900 text-amber-300 border-slate-800',
    bannerBg: 'bg-slate-900 text-amber-300 border-slate-800',
    description: 'Complete statutory oversight: APH timeline configurator, emergency escalation ladder, approval decisions, and master audit trail.',
    defaultTab: 'pendency',
    jurisdiction: 'National (All 8 Regional Offices)',
    allowedTabs: ['applications', 'pendency', 'evc', 'compliance', 'documents', 'institutions', 'timelines', 'audit']
  },
  REGIONAL_OFFICER: {
    id: 'REGIONAL_OFFICER',
    name: 'Regional Officer (RO-West)',
    shortName: 'RO-West',
    title: 'RO–West, Western Regional Office',
    officerId: 'OFFICER-W-2026-041',
    badgeColor: 'bg-blue-50 text-blue-900 border-blue-200',
    bannerBg: 'bg-[#1e3a8a] text-white border-blue-900',
    description: 'Scrutiny queue management, deficiency reverts, re-scrutiny cycles, EVC queue recommendations, and Western regional dashboard.',
    defaultTab: 'applications',
    region: 'Western Regional Office',
    jurisdiction: 'Western Region (Maharashtra & Goa)',
    allowedTabs: ['applications', 'pendency', 'evc', 'compliance', 'documents', 'institutions', 'audit']
  },
  BUREAU_OFFICER: {
    id: 'BUREAU_OFFICER',
    name: 'Bureau Officer',
    shortName: 'Bureau Dir',
    title: 'Director, AICTE Approval Bureau (HQ)',
    officerId: 'HQ-DIR-APPR-012',
    badgeColor: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    bannerBg: 'bg-indigo-950 text-indigo-100 border-indigo-800',
    description: 'SAC/SHC decisions, national pendency oversight, bottleneck analysis, and Level-3 escalation inbox for 7-day overdue cases.',
    defaultTab: 'applications',
    defaultFilter: 'ESCALATED',
    jurisdiction: 'National Approval Bureau (Escalation Inbox & SAC Review)',
    allowedTabs: ['applications', 'pendency', 'evc', 'compliance', 'documents', 'institutions', 'audit']
  },
  COMMITTEE: {
    id: 'COMMITTEE',
    name: 'Inspection Committee Head',
    shortName: 'Committee',
    title: 'Prof. K. Ramanathan, Committee Head',
    officerId: 'EVC-CONV-2026-88',
    badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    bannerBg: 'bg-emerald-900 text-emerald-100 border-emerald-700',
    description: 'Schedule assigned college visits, record on-site lab/building checks, and upload signed inspection reports.',
    defaultTab: 'evc',
    jurisdiction: 'Assigned EVC Inspection Visits',
    allowedTabs: ['evc', 'applications', 'documents']
  },
  INSTITUTION: {
    id: 'INSTITUTION',
    name: 'College / Institute',
    shortName: 'College',
    title: 'Registrar, Sunrise Institute of Technology',
    officerId: 'INST-W-MH-1042',
    institutionId: 'inst_sunrise',
    institutionName: 'Sunrise Institute of Technology',
    badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
    bannerBg: 'bg-amber-950 text-amber-100 border-amber-800',
    description: 'Track your college applications, view AI status briefs, upload proof for conditional approvals, and check lease/NOC expiry dates.',
    defaultTab: 'compliance',
    jurisdiction: 'College Portal: Sunrise Institute of Technology (Pune, Western Region)',
    allowedTabs: ['applications', 'compliance', 'documents']
  }
};

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [role, setRole] = useState(() => {
    return (
      sessionStorage.getItem('compliscan_aicte_role') ||
      localStorage.getItem('compliscan_aicte_role') ||
      'SUPERADMIN'
    );
  });

  const changeRole = (newRole) => {
    if (AICTE_ROLES[newRole]) {
      setRole(newRole);
      sessionStorage.setItem('compliscan_aicte_role', newRole);
      localStorage.setItem('compliscan_aicte_role', newRole);
      if (typeof window !== 'undefined' && AICTE_ROLES[newRole].defaultTab) {
        window.location.hash = AICTE_ROLES[newRole].defaultTab;
      }
    }
  };

  const currentRoleConfig = AICTE_ROLES[role] || AICTE_ROLES.SUPERADMIN;

  return (
    <RoleContext.Provider
      value={{
        role,
        roleConfig: currentRoleConfig,
        changeRole,
        allRoles: AICTE_ROLES
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
