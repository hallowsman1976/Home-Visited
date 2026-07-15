function setScriptConfiguration(spreadsheetId, driveFolderId, environment) {
  if (!spreadsheetId) throw new Error('spreadsheetId is required');
  const properties = {
    SPREADSHEET_ID: String(spreadsheetId),
    APP_ENV: String(environment || 'development')
  };
  if (driveFolderId) properties.DRIVE_FOLDER_ID = String(driveFolderId);
  PropertiesService.getScriptProperties().setProperties(properties, false);
  return { configured: true, environment: properties.APP_ENV };
}

function generateAuthPepper() {
  const pepper = Array.from({ length: 6 }, function () { return Utilities.getUuid(); }).join('');
  PropertiesService.getScriptProperties().setProperty('AUTH_PEPPER', pepper);
  return { configured: true, message: 'สร้าง AUTH_PEPPER แล้ว ห้ามบันทึกค่า secret ลง Sheet หรือ source code' };
}

function createInitialSuperAdmin(username, password, displayName, organizationId, email) {
  const normalized = normalizeUsername_(username);
  if (!normalized) throw new Error('username is required');
  if (findRecordByField_('USERS', 'username', normalized)) throw new Error('USERNAME_EXISTS');
  const now = new Date().toISOString();
  const userId = Utilities.getUuid();
  appendRecord_('USERS', {
    user_id: userId, username: normalized, email: email || '', password_hash: createPasswordHash_(password),
    display_name: displayName || normalized, professional_no: '', role_code: 'SUPER_ADMIN', organization_id: organizationId || '',
    service_unit_id: '', status: 'ACTIVE', last_login_at: '', failed_login_count: 0, locked_until: '',
    must_change_password: true, scopes_json: '{}', created_at: now, created_by: 'SYSTEM', updated_at: now, updated_by: 'SYSTEM', row_version: 1, is_active: true
  });
  appendAudit_({ actorUserId: userId, organizationId: organizationId || '', actionCode: 'USER_BOOTSTRAP', entityType: 'USER', entityId: userId });
  return { userId: userId, username: normalized, role: 'SUPER_ADMIN' };
}

function bootstrapUserFromProperties() {
  const properties = PropertiesService.getScriptProperties();
  const username = normalizeUsername_(properties.getProperty('BOOTSTRAP_USERNAME'));
  const password = String(properties.getProperty('BOOTSTRAP_PASSWORD') || '');
  const role = String(properties.getProperty('BOOTSTRAP_ROLE') || 'SUPER_ADMIN').trim().toUpperCase();
  const displayName = String(properties.getProperty('BOOTSTRAP_DISPLAY_NAME') || '').trim();
  const organizationId = String(properties.getProperty('BOOTSTRAP_ORG_ID') || '').trim();
  const email = String(properties.getProperty('BOOTSTRAP_EMAIL') || '').trim();

  if (!username) throw new Error('BOOTSTRAP_USERNAME is required');
  if (!password) throw new Error('BOOTSTRAP_PASSWORD is required');
  if (!ROLE_PERMISSIONS[role]) throw new Error('INVALID_ROLE: ' + role + ' (valid: ' + Object.keys(ROLE_PERMISSIONS).join(', ') + ')');
  validatePasswordPolicy_(password);
  if (findRecordByField_('USERS', 'username', username)) throw new Error('USERNAME_EXISTS');

  const now = new Date().toISOString();
  const userId = Utilities.getUuid();
  appendRecord_('USERS', {
    user_id: userId, username: username, email: email, password_hash: createPasswordHash_(password),
    display_name: displayName || username, professional_no: '', role_code: role, organization_id: organizationId,
    service_unit_id: '', status: 'ACTIVE', last_login_at: '', failed_login_count: 0, locked_until: '',
    must_change_password: true, scopes_json: '{}', created_at: now, created_by: 'SYSTEM', updated_at: now, updated_by: 'SYSTEM', row_version: 1, is_active: true
  });
  appendAudit_({ actorUserId: userId, organizationId: organizationId, actionCode: 'USER_BOOTSTRAP', entityType: 'USER', entityId: userId });
  properties.deleteProperty('BOOTSTRAP_PASSWORD');
  return { userId: userId, username: username, role: role, mustChangePassword: true, passwordPropertyDeleted: true };
}

function migrateToV020() {
  const sheet = getDataSheet_('USERS');
  const required = ['failed_login_count','locked_until','must_change_password','scopes_json'];
  const current = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const auditStart = current.indexOf('created_at');
  required.forEach(function (column) {
    const latest = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
    if (latest.indexOf(column) === -1) {
      const position = Math.max(1, latest.indexOf('created_at') + 1);
      sheet.insertColumnBefore(position);
      sheet.getRange(1, position).setValue(column).setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');
    }
  });
  return { version: '0.2.0', migrated: true, previousAuditStart: auditStart };
}

function migrateToV040() {
  const sheet=getDataSheet_('VISITS');const headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0];
  if(headers.indexOf('assessment_id')===-1){const before=headers.indexOf('assessment_summary')+1;if(before<1)throw new Error('ASSESSMENT_SUMMARY_COLUMN_NOT_FOUND');sheet.insertColumnBefore(before);sheet.getRange(1,before).setValue('assessment_id').setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');}
  return {version:'0.4.0',migrated:true};
}

function setOperationsConfiguration(backupFolderId,retentionDays){if(!backupFolderId)throw new Error('backupFolderId is required');DriveApp.getFolderById(String(backupFolderId)).getName();PropertiesService.getScriptProperties().setProperties({BACKUP_FOLDER_ID:String(backupFolderId),BACKUP_RETENTION_DAYS:String(retentionDays||30)},false);return{configured:true,retentionDays:Number(retentionDays||30)};}
