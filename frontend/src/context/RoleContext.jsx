import React, { createContext, useContext, useState, useEffect } from 'react';

export const AICTE_ROLES = {
  SUPERADMIN: {
    id: 'SUPERADMIN',
    name: 'Member Secretary / DG',
    title: 'Director General / Member Secretary, AICTE',
    officerId: 'AICTE-HQ-MS-001',
    badgeColor: 'bg-slate-900 text-amber-300 border-slate-800',
    description: 'Complete statutory oversight: APH timeline configurator, emergency escalation ladder, approval decisions, and master audit trail.',
    allowedTabs: ['applications', 'pendency', 'evc', 'compliance', 'documents', 'institutions', 'timelines', 'audit']
  },
  REGIONAL_OFFICER: {
    id: 'REGIONAL_OFFICER',
    name: 'Regional Officer (RO)',
    title: 'RO–West, Western Regional Office',
    officerId: 'OFFICER-W-2026-041',
    badgeColor: 'bg-blue-50 text-blue-900 border-blue-200',
    description: 'Scrutiny queue management, deficiency reverts, re-scrutiny cycles, EVC queue recommendations, and regional dashboard.',
    allowedTabs: ['applications', 'pendency', 'evc', 'compliance', 'documents', 'institutions', 'audit']
  },
  BUREAU_OFFICER: {
    id: 'BUREAU_OFFICER',
    name: 'Bureau Officer',
    title: 'Director, AICTE Approval Bureau (HQ)',
    officerId: 'HQ-DIR-APPR-012',
    badgeColor: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    description: 'SAC/SHC decisions, national pendency oversight, bottleneck analysis, and Level-3 escalation inbox.',
    allowedTabs: ['applications', 'pendency', 'evc', 'compliance', 'documents', 'institutions', 'audit']
  },
  COMMITTEE: {
    id: 'COMMITTEE',
    name: 'Committee (EVC / SAC)',
    title: 'Prof. K. Ramanathan, EVC Convener',
    officerId: 'EVC-CONV-2026-88',
    badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    description: 'Visit queue, schedule inspection visits, record physical/hybrid observations, and submit signed EVC reports.',
    allowedTabs: ['evc', 'applications', 'documents']
  },
  INSTITUTION: {
    id: 'INSTITUTION',
    name: 'Institution (Applicant)',
    title: 'Registrar, Sunrise Institute of Technology',
    officerId: 'INST-W-MH-1042',
    badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
    description: 'Submit APH applications, track stage movement, upload compliance evidence against undertakings, and monitor lease/NOC validity.',
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
