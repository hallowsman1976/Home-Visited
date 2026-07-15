import type { UserRole } from '../types/api';

export const rolePermissions: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['*'],
  ORG_ADMIN: ['dashboard.read','patients.read','patients.write','visits.read','visits.write','reports.read','reports.export','users.manage','master.manage','audit.read'],
  CLINICIAN: ['dashboard.read','patients.read','patients.write','visits.read','visits.write','visits.submit','reports.read','followups.write'],
  CARE_TEAM: ['dashboard.read','patients.read','visits.read','visits.draft','followups.write'],
  VIEWER: ['dashboard.read','patients.read','visits.read'],
  AUDITOR: ['dashboard.read','patients.read','visits.read','audit.read'],
};

export function hasPermission(role: UserRole, permission: string) {
  const permissions = rolePermissions[role] || [];
  return permissions.includes('*') || permissions.includes(permission);
}

