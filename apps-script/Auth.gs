function login_(payload, requestId) {
  const username = normalizeUsername_(payload.username);
  enforceLoginRateLimit_(username);
  const password = String(payload.password || '');
  if (!username || !password) return { ok: false, code: 'VALIDATION_ERROR', message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' };

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const found = findRecordByField_('USERS', 'username', username);
    if (!found || String(found.record.status) !== 'ACTIVE') {
      fakePasswordWork_(password);
      appendAudit_({ requestId: requestId, actionCode: 'AUTH_LOGIN', outcome: 'DENIED', reason: 'INVALID_CREDENTIALS' });
      return { ok: false, code: 'INVALID_CREDENTIALS', message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    }
    const user = found.record;
    const lockedUntil = user.locked_until ? new Date(user.locked_until) : null;
    if (lockedUntil && lockedUntil.getTime() > Date.now()) {
      appendAudit_({ requestId: requestId, actorUserId: user.user_id, organizationId: user.organization_id, actionCode: 'AUTH_LOGIN', outcome: 'DENIED', reason: 'ACCOUNT_LOCKED' });
      return { ok: false, code: 'ACCOUNT_LOCKED', message: 'บัญชีถูกล็อกชั่วคราว กรุณาลองใหม่ภายหลัง' };
    }
    if (!verifyPassword_(password, user.password_hash)) {
      const failures = Number(user.failed_login_count || 0) + 1;
      const changes = { failed_login_count: failures, updated_at: new Date().toISOString(), row_version: Number(user.row_version || 0) + 1 };
      if (failures >= SECURITY_CONFIG.MAX_FAILED_LOGINS) changes.locked_until = new Date(Date.now() + SECURITY_CONFIG.LOCK_MINUTES * 60000).toISOString();
      updateRecordRow_('USERS', found.rowNumber, changes);
      appendAudit_({ requestId: requestId, actorUserId: user.user_id, organizationId: user.organization_id, actionCode: 'AUTH_LOGIN', outcome: 'DENIED', reason: 'INVALID_CREDENTIALS' });
      return { ok: false, code: 'INVALID_CREDENTIALS', message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    }

    const token = createSecureToken_();
    const now = new Date();
    const expiresAt = addSeconds_(now, SECURITY_CONFIG.SESSION_TTL_SECONDS);
    appendRecord_('SESSIONS', {
      session_id: Utilities.getUuid(), user_id: user.user_id, token_hash: hashToken_(token),
      issued_at: now.toISOString(), expires_at: expiresAt.toISOString(), revoked_at: '', ip_hash: '', user_agent_summary: '',
      created_at: now.toISOString(), created_by: user.user_id, updated_at: now.toISOString(), updated_by: user.user_id, row_version: 1, is_active: true
    });
    updateRecordRow_('USERS', found.rowNumber, { failed_login_count: 0, locked_until: '', last_login_at: now.toISOString(), updated_at: now.toISOString(), row_version: Number(user.row_version || 0) + 1 });
    appendAudit_({ requestId: requestId, actorUserId: user.user_id, organizationId: user.organization_id, actionCode: 'AUTH_LOGIN', entityType: 'SESSION', outcome: 'SUCCESS' });
    return { ok: true, data: { sessionToken: token, expiresAt: expiresAt.toISOString(), user: publicUser_(user) } };
  } finally { lock.releaseLock(); }
}

function authenticateRequest_(body) {
  const token = String(body.sessionToken || '');
  if (!token) return null;
  const sessionFound = findRecordByField_('SESSIONS', 'token_hash', hashToken_(token));
  if (!sessionFound) return null;
  const session = sessionFound.record;
  if (String(session.is_active).toLowerCase() !== 'true' || session.revoked_at || new Date(session.expires_at).getTime() <= Date.now()) return null;
  const userFound = findRecordByField_('USERS', 'user_id', String(session.user_id).toLowerCase());
  if (!userFound || String(userFound.record.status) !== 'ACTIVE') return null;
  return { user: userFound.record, session: session, sessionRowNumber: sessionFound.rowNumber };
}

function logout_(auth, requestId) {
  const now = new Date().toISOString();
  updateRecordRow_('SESSIONS', auth.sessionRowNumber, { revoked_at: now, is_active: false, updated_at: now, updated_by: auth.user.user_id, row_version: Number(auth.session.row_version || 0) + 1 });
  appendAudit_({ requestId: requestId, actorUserId: auth.user.user_id, organizationId: auth.user.organization_id, actionCode: 'AUTH_LOGOUT', entityType: 'SESSION', entityId: auth.session.session_id });
  return { loggedOut: true };
}

function changePassword_(auth, payload, requestId) {
  const currentPassword = String(payload.currentPassword || '');
  const newPassword = String(payload.newPassword || '');
  if (!verifyPassword_(currentPassword, auth.user.password_hash)) {
    appendAudit_({ requestId: requestId, actorUserId: auth.user.user_id, organizationId: auth.user.organization_id, actionCode: 'AUTH_CHANGE_PASSWORD', outcome: 'DENIED', reason: 'CURRENT_PASSWORD_INVALID' });
    return { ok: false, code: 'INVALID_CREDENTIALS', message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' };
  }
  try { validatePasswordPolicy_(newPassword); } catch (error) {
    return { ok: false, code: 'PASSWORD_POLICY', message: 'รหัสผ่านใหม่ต้องยาวอย่างน้อย 12 ตัว และมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลข' };
  }
  if (currentPassword === newPassword) return { ok: false, code: 'PASSWORD_REUSE', message: 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน' };
  const found = findRecordByField_('USERS', 'user_id', String(auth.user.user_id).toLowerCase());
  if (!found) return { ok: false, code: 'NOT_FOUND', message: 'ไม่พบบัญชีผู้ใช้' };
  const now = new Date().toISOString();
  updateRecordRow_('USERS', found.rowNumber, {
    password_hash: createPasswordHash_(newPassword), must_change_password: false,
    updated_at: now, updated_by: auth.user.user_id, row_version: Number(auth.user.row_version || 0) + 1
  });
  appendAudit_({ requestId: requestId, actorUserId: auth.user.user_id, organizationId: auth.user.organization_id, actionCode: 'AUTH_CHANGE_PASSWORD', entityType: 'USER', entityId: auth.user.user_id });
  return { ok: true, data: { changed: true } };
}

function fakePasswordWork_(password) {
  derivePasswordHash_(String(password), 'invalid-user-timing-salt', SECURITY_CONFIG.PASSWORD_ROUNDS);
}
