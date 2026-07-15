const ROLE_PERMISSIONS = Object.freeze({
  SUPER_ADMIN: ['*'],
  ORG_ADMIN: ['dashboard.read','patients.read','patients.write','visits.read','visits.write','reports.read','reports.export','users.manage','master.manage','audit.read'],
  CLINICIAN: ['dashboard.read','patients.read','patients.write','visits.read','visits.write','visits.submit','reports.read','followups.write'],
  CARE_TEAM: ['dashboard.read','patients.read','visits.read','visits.draft','followups.write'],
  VIEWER: ['dashboard.read','patients.read','visits.read'],
  AUDITOR: ['dashboard.read','patients.read','visits.read','audit.read']
});

function hasPermission_(user, permission) {
  const permissions = ROLE_PERMISSIONS[String(user.role_code || '')] || [];
  return permissions.indexOf('*') !== -1 || permissions.indexOf(permission) !== -1;
}

function requirePermission_(user, permission) {
  if (!user || !hasPermission_(user, permission)) {
    const error = new Error('FORBIDDEN');
    error.code = 'FORBIDDEN';
    throw error;
  }
}

function parseScopes_(user) {
  let extra = {};
  try { extra = user.scopes_json ? JSON.parse(String(user.scopes_json)) : {}; } catch (error) { extra = {}; }
  return {
    organizationId: String(user.organization_id || ''),
    serviceUnitId: String(user.service_unit_id || ''),
    areaIds: Array.isArray(extra.areaIds) ? extra.areaIds.map(String) : [],
    teamIds: Array.isArray(extra.teamIds) ? extra.teamIds.map(String) : []
  };
}

function isEntityInScope_(user, entity) {
  if (user.role_code === 'SUPER_ADMIN') return true;
  const scope = parseScopes_(user);
  if (scope.organizationId && String(entity.organization_id || '') !== scope.organizationId) return false;
  if (scope.serviceUnitId && entity.service_unit_id && String(entity.service_unit_id) !== scope.serviceUnitId) return false;
  if (scope.areaIds.length && entity.area_id && scope.areaIds.indexOf(String(entity.area_id)) === -1) return false;
  if (scope.teamIds.length && entity.team_id && scope.teamIds.indexOf(String(entity.team_id)) === -1) return false;
  return true;
}

function publicUser_(user) {
  return {
    userId: String(user.user_id),
    username: String(user.username),
    displayName: String(user.display_name),
    email: String(user.email || ''),
    role: String(user.role_code),
    organizationId: String(user.organization_id || ''),
    serviceUnitId: String(user.service_unit_id || ''),
    scopes: parseScopes_(user),
    mustChangePassword: String(user.must_change_password).toLowerCase() === 'true'
  };
}

