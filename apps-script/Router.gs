function doGet(e) {
  const requestId = Utilities.getUuid();
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'health');
    if (action === 'health') return handleHealth_(requestId);
    return errorResponse_('NOT_FOUND', 'ไม่พบ action ที่ร้องขอ', requestId);
  } catch (error) {
    console.error(JSON.stringify({ requestId: requestId, action: 'GET', error: String(error) }));
    return errorResponse_('INTERNAL_ERROR', 'ระบบไม่สามารถดำเนินการได้', requestId);
  }
}

function doPost(e) {
  const requestId = Utilities.getUuid();
  try {
    if(e&&e.postData&&e.postData.contents&&e.postData.contents.length>12000000)return errorResponse_('PAYLOAD_TOO_LARGE','คำขอมีขนาดใหญ่เกินกำหนด',requestId);
    const body = parseJsonBody_(e);
    const effectiveRequestId = String(body.requestId || requestId);
    if (body.action === 'health') return handleHealth_(effectiveRequestId);
    if (body.action === 'auth.login') {
      const result = login_(body.payload || {}, effectiveRequestId);
      return result.ok ? successResponse_(result.data, effectiveRequestId) : errorResponse_(result.code, result.message, effectiveRequestId);
    }
    const auth = authenticateRequest_(body);
    if (!auth) return errorResponse_('AUTH_REQUIRED', 'กรุณาเข้าสู่ระบบใหม่', effectiveRequestId);
    enforceRequestRateLimit_(auth.user,String(body.action||'unknown'));
    if (body.action === 'auth.me') return successResponse_({ user: publicUser_(auth.user) }, effectiveRequestId);
    if (body.action === 'auth.logout') return successResponse_(logout_(auth, effectiveRequestId), effectiveRequestId);
    if (body.action === 'auth.changePassword') {
      const result = changePassword_(auth, body.payload || {}, effectiveRequestId);
      return result.ok ? successResponse_(result.data, effectiveRequestId) : errorResponse_(result.code, result.message, effectiveRequestId);
    }
    if (String(auth.user.must_change_password).toLowerCase() === 'true') return errorResponse_('PASSWORD_CHANGE_REQUIRED', 'กรุณาเปลี่ยนรหัสผ่านก่อนใช้งาน', effectiveRequestId);
    if (body.action === 'auth.permissions') return successResponse_({ role: auth.user.role_code, permissions: ROLE_PERMISSIONS[auth.user.role_code] || [], scopes: parseScopes_(auth.user) }, effectiveRequestId);
    if (body.action === 'patients.search') return successResponse_(searchPatients_(auth, body.payload || {}, effectiveRequestId), effectiveRequestId);
    if (body.action === 'patients.get') return successResponse_(getPatient_(auth, body.payload || {}, effectiveRequestId), effectiveRequestId);
    if (body.action === 'patients.create') return successResponse_(createPatient_(auth, body.payload || {}, effectiveRequestId), effectiveRequestId);
    if (body.action === 'patients.update') return successResponse_(updatePatient_(auth, body.payload || {}, effectiveRequestId), effectiveRequestId);
    if (body.action === 'patients.archive') return successResponse_(archivePatient_(auth, body.payload || {}, effectiveRequestId), effectiveRequestId);
    if (body.action === 'patients.setCid') return successResponse_(setPatientCid_(auth, body.payload || {}, effectiveRequestId), effectiveRequestId);
    if (body.action === 'caregivers.add') return successResponse_(addCaregiver_(auth, body.payload || {}, effectiveRequestId), effectiveRequestId);
    if (body.action === 'visits.list') return successResponse_(listVisits_(auth,body.payload||{},effectiveRequestId),effectiveRequestId);
    if (body.action === 'visits.get') return successResponse_(getVisit_(auth,body.payload||{},effectiveRequestId),effectiveRequestId);
    if (body.action === 'visits.createDraft') return successResponse_(createVisitDraft_(auth,body.payload||{},effectiveRequestId),effectiveRequestId);
    if (body.action === 'visits.saveDraft') return successResponse_(saveVisitDraft_(auth,body.payload||{},effectiveRequestId),effectiveRequestId);
    if (body.action === 'visits.submit') return successResponse_(submitVisit_(auth,body.payload||{},effectiveRequestId),effectiveRequestId);
    if (body.action === 'visits.reopen') return successResponse_(reopenVisit_(auth,body.payload||{},effectiveRequestId),effectiveRequestId);
    if (body.action === 'assessments.active') return successResponse_(activeAssessment_(auth),effectiveRequestId);
    if (body.action === 'assessments.saveResponses') return successResponse_(saveAssessmentResponses_(auth,body.payload||{},effectiveRequestId),effectiveRequestId);
    if (body.action === 'medications.list') return successResponse_(listMedications_(auth,body.payload||{}),effectiveRequestId);
    if (body.action === 'medications.upsert') return successResponse_(upsertMedication_(auth,body.payload||{},effectiveRequestId),effectiveRequestId);
    if (body.action === 'visitMedications.list') return successResponse_(listVisitMedications_(auth,body.payload||{}),effectiveRequestId);
    if (body.action === 'visitMedications.upsert') return successResponse_(upsertVisitMedication_(auth,body.payload||{},effectiveRequestId),effectiveRequestId);
    if (body.action === 'problems.list') return successResponse_(listProblems_(auth,body.payload||{}),effectiveRequestId);
    if (body.action === 'problems.upsert') return successResponse_(upsertProblem_(auth,body.payload||{},effectiveRequestId),effectiveRequestId);
    if (body.action === 'carePlans.list') return successResponse_(listCarePlans_(auth,body.payload||{}),effectiveRequestId);
    if (body.action === 'carePlans.upsert') return successResponse_(upsertCarePlan_(auth,body.payload||{},effectiveRequestId),effectiveRequestId);
    if (body.action === 'interventions.add') return successResponse_(addIntervention_(auth,body.payload||{},effectiveRequestId),effectiveRequestId);
    if (body.action === 'referrals.list') return successResponse_(listReferrals_(auth,body.payload||{}),effectiveRequestId);
    if (body.action === 'referrals.upsert') return successResponse_(upsertReferral_(auth,body.payload||{},effectiveRequestId),effectiveRequestId);
    if (body.action === 'followUps.list') return successResponse_(listFollowUps_(auth,body.payload||{}),effectiveRequestId);
    if (body.action === 'followUps.upsert') return successResponse_(upsertFollowUp_(auth,body.payload||{},effectiveRequestId),effectiveRequestId);
    if (body.action === 'consents.list') return successResponse_(listConsents_(auth,body.payload||{}),effectiveRequestId);
    if (body.action === 'consents.upsert') return successResponse_(upsertConsent_(auth,body.payload||{},effectiveRequestId),effectiveRequestId);
    if (body.action === 'attachments.list') return successResponse_(listAttachments_(auth,body.payload||{}),effectiveRequestId);
    if (body.action === 'attachments.upload') return successResponse_(uploadAttachment_(auth,body.payload||{},effectiveRequestId),effectiveRequestId);
    if (body.action === 'attachments.getContent') return successResponse_(getAttachmentContent_(auth,body.payload||{},effectiveRequestId),effectiveRequestId);
    if (body.action === 'attachments.archive') return successResponse_(archiveAttachment_(auth,body.payload||{},effectiveRequestId),effectiveRequestId);
    if (body.action === 'dashboard.summary') return successResponse_(dashboardSummary_(auth),effectiveRequestId);
    if (body.action === 'reports.visits') return successResponse_(reportVisits_(auth,body.payload||{}),effectiveRequestId);
    if (body.action === 'reports.export') return successResponse_(exportVisits_(auth,body.payload||{},effectiveRequestId),effectiveRequestId);
    if (body.action === 'system.diagnostics') return successResponse_(diagnostics_(auth),effectiveRequestId);
    return errorResponse_('NOT_FOUND', 'ไม่พบ action ที่ร้องขอ', effectiveRequestId);
  } catch (error) {
    console.error(JSON.stringify({ requestId: requestId, action: 'POST', error: String(error) }));
    const code = error && error.code ? error.code : 'VALIDATION_ERROR';
    const message = error && error.message && error.code ? error.message : (code === 'FORBIDDEN' ? 'ไม่มีสิทธิ์ดำเนินการ' : 'รูปแบบคำขอไม่ถูกต้อง');
    return errorResponse_(code, message, requestId, error && error.fieldErrors ? error.fieldErrors : {});
  }
}

function handleHealth_(requestId) {
  const config = getRuntimeConfig_();
  return successResponse_({
    status: 'ok',
    service: config.appName,
    version: config.version,
    environment: config.environment,
    spreadsheetConfigured: Boolean(config.spreadsheetId),
  }, requestId);
}

function parseJsonBody_(e) {
  if (!e || !e.postData || !e.postData.contents) throw new Error('EMPTY_BODY');
  const body = JSON.parse(e.postData.contents);
  if (!body || typeof body !== 'object') throw new Error('INVALID_BODY');
  return body;
}
