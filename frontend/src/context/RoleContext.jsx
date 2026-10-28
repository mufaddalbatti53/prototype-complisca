import React, { createContext, useContext, useState, useEffect } from 'react';

export const ROLES = {
  SUPERADMIN: {
    id: 'SUPERADMIN',
    name: 'Superadmin',
    title: 'Director General (Legal Metrology)',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Full statutory control: Manage rules, approve/suspend parties, lodge prosecutions, full audit trail.',
    allowedTabs: ['scanner', 'dashboard', 'history', 'aging', 'parties', 'rules']
  },
  OFFICER: {
    id: 'OFFICER',
    name: 'Enforcement Officer',
    title: 'Field Officer R. Sharma',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Field operations: Upload packaging scans, issue Form 1 seizure notices, review evidence.',
    allowedTabs: ['scanner', 'dashboard', 'history', 'aging']
  },
  PARTY: {
    id: 'PARTY',
    name: 'Audited Entity / Store',
    title: 'Metro Cash & Carry Representative',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Noticee portal: View show-cause notices issued under Section 15 & 18, submit compliance replies.',
    allowedTabs: ['history', 'aging']
  },
  AUDITOR: {
    id: 'AUDITOR',
    name: 'Legal Auditor',
    title: 'State Metrology Legal Cell',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Analytical review: Review statutory metrics, check aging delinquency, review rule calibrations.',
    allowedTabs: ['dashboard', 'history', 'aging', 'rules']
  }
};

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [role, setRole] = useState(() => {
    // Check sessionStorage first to allow distinct personas in different tabs simultaneously
    return (
      sessionStorage.getItem('compliscan_role') ||
      localStorage.getItem('compliscan_role') ||
      'SUPERADMIN'
    );
  });

  const changeRole = (newRole) => {
    if (ROLES[newRole]) {
      setRole(newRole);
      sessionStorage.setItem('compliscan_role', newRole);
      localStorage.setItem('compliscan_role', newRole);
    }
  };

  const currentRoleConfig = ROLES[role] || ROLES.SUPERADMIN;

  return (
    <RoleContext.Provider value={{ role, roleConfig: currentRoleConfig, changeRole, allRoles: ROLES }}>
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
