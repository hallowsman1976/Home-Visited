function searchPatients_(auth, payload, requestId) {
  requirePermission_(auth.user, 'patients.read');
  const query = String(payload.query || '').trim();
  const page = Math.max(1, Number(payload.page || 1));
  const pageSize = Math.min(50, Math.max(1, Number(payload.pageSize || 20)));
  let cidPatientId = '';
  if (/^\d{13}$/.test(normalizeCid_(query)) && validateCid_(query)) {
    const foundIdentifier = findRecordByField_('PATIENT_IDENTIFIERS', 'identifier_hash', hashCidForLookup_(query));
    cidPatientId = foundIdentifier ? String(foundIdentifier.record.patient_id) : '__NOT_FOUND__';
  }
  const sheet = getDataSheet_('PATIENTS');
  if (sheet.getLastRow() < 2) return { items: [], page: page, pageSize: pageSize, total: 0 };
  const rows = sheet.getDataRange().getValues(); const headers = rows[0];
  const identifierMap = buildPatientIdentifierMap_();
  const normalizedQuery = query.toLowerCase();
  const matches = rows.slice(1).map(function (row) { return rowToObject_(headers, row); }).filter(function (patient) {
    if (String(patient.is_active).toLowerCase() === 'false' || !isEntityInScope_(auth.user, patient)) return false;
    if (!query) return true;
    if (cidPatientId) return String(patient.patient_id) === cidPatientId;
    const haystack = [patient.hn, patient.first_name, patient.last_name, patient.phone].join(' ').toLowerCase();
    return haystack.indexOf(normalizedQuery) !== -1;
  });
  const start = (page - 1) * pageSize;
  appendAudit_({ requestId: requestId, actorUserId: auth.user.user_id, organizationId: auth.user.organization_id, actionCode: 'PATIENT_SEARCH', outcome: 'SUCCESS', reason: query ? 'QUERY_USED' : 'LIST' });
  return { items: matches.slice(start, start + pageSize).map(function(patient){return publicPatient_(patient, identifierMap);}), page: page, pageSize: pageSize, total: matches.length };
}

function getPatient_(auth, payload, requestId) {
  requirePermission_(auth.user, 'patients.read');
  const found = findRecordByField_('PATIENTS', 'patient_id', String(payload.patientId || '').toLowerCase());
  if (!found) throw createAppError_('NOT_FOUND', 'ไม่พบผู้ป่วย');
  if (!isEntityInScope_(auth.user, found.record)) throw createAppError_('FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้');
  const result = publicPatient_(found.record);
  result.caregivers = listPatientCaregivers_(found.record.patient_id);
  appendAudit_({ requestId: requestId, actorUserId: auth.user.user_id, organizationId: auth.user.organization_id, actionCode: 'PATIENT_VIEW', entityType: 'PATIENT', entityId: found.record.patient_id });
  return result;
}

function createPatient_(auth, payload, requestId) {
  requirePermission_(auth.user, 'patients.write');
  const errors = validatePatientPayload_(payload, false);
  if (Object.keys(errors).length) { const error = createAppError_('VALIDATION_ERROR', 'ข้อมูลผู้ป่วยไม่ถูกต้อง'); error.fieldErrors = errors; throw error; }
  const organizationId = auth.user.role_code === 'SUPER_ADMIN' ? String(payload.organizationId || auth.user.organization_id) : String(auth.user.organization_id);
  if (!organizationId) throw createAppError_('VALIDATION_ERROR', 'ไม่พบหน่วยงานของผู้ใช้');
  const hn = safeCellText_(payload.hn, 30);
  const duplicateHn = findPatientByHnInOrganization_(hn, organizationId);
  if (duplicateHn) throw createAppError_('CONFLICT', 'HN นี้มีอยู่ในหน่วยงานแล้ว');
  let cidHash = ''; let cidEncrypted = ''; const patientId = Utilities.getUuid();
  if (payload.cid) {
    cidHash = hashCidForLookup_(payload.cid);
    if (findRecordByField_('PATIENT_IDENTIFIERS', 'identifier_hash', cidHash)) throw createAppError_('CONFLICT', 'เลขประจำตัวประชาชนนี้มีในระบบแล้ว');
    cidEncrypted = encryptCid_(payload.cid, patientId, organizationId);
  }
  const now = new Date().toISOString();
  const record = {
    patient_id: patientId, organization_id: organizationId, service_unit_id: String(payload.serviceUnitId || auth.user.service_unit_id || ''), hn: hn,
    title: safeCellText_(payload.title, 30), first_name: safeCellText_(payload.firstName, 150), last_name: safeCellText_(payload.lastName, 150),
    birth_date: String(payload.birthDate || ''), sex_at_birth: safeCellText_(payload.sexAtBirth, 30), phone: safeCellText_(payload.phone, 30),
    address_text: safeCellText_(payload.addressText, 1000), area_id: safeCellText_(payload.areaId, 100), latitude: payload.latitude || '', longitude: payload.longitude || '',
    main_diagnosis: safeCellText_(payload.mainDiagnosis, 500), comorbidities_json: JSON.stringify(Array.isArray(payload.comorbidities) ? payload.comorbidities : []),
    allergies: safeCellText_(payload.allergies, 500), coverage_scheme: safeCellText_(payload.coverageScheme, 100), patient_status: 'ACTIVE', risk_level: String(payload.riskLevel || 'LOW'),
    created_at: now, created_by: auth.user.user_id, updated_at: now, updated_by: auth.user.user_id, row_version: 1, is_active: true
  };
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    if (findPatientByHnInOrganization_(hn, organizationId)) throw createAppError_('CONFLICT', 'HN นี้มีอยู่ในหน่วยงานแล้ว');
    if (cidHash && findRecordByField_('PATIENT_IDENTIFIERS', 'identifier_hash', cidHash)) throw createAppError_('CONFLICT', 'เลขประจำตัวประชาชนนี้มีในระบบแล้ว');
    appendRecord_('PATIENTS', record);
    if (payload.cid) {
      try {
        appendRecord_('PATIENT_IDENTIFIERS', {
          identifier_id: Utilities.getUuid(), patient_id: patientId, organization_id: organizationId, identifier_type: 'CID', identifier_encrypted: cidEncrypted,
          identifier_hash: cidHash, last4: normalizeCid_(payload.cid).slice(-4), verified_at: '', verified_by: '',
          created_at: now, created_by: auth.user.user_id, updated_at: now, updated_by: auth.user.user_id, row_version: 1, is_active: true
        });
      } catch (identifierError) {
        const patientWritten = findRecordByField_('PATIENTS', 'patient_id', patientId.toLowerCase());
        if (patientWritten) updateRecordRow_('PATIENTS', patientWritten.rowNumber, { is_active: false, patient_status: 'VOID', updated_at: now, updated_by: 'SYSTEM' });
        throw identifierError;
      }
    }
  } finally { lock.releaseLock(); }
  appendAudit_({ requestId: requestId, actorUserId: auth.user.user_id, organizationId: organizationId, actionCode: 'PATIENT_CREATE', entityType: 'PATIENT', entityId: patientId });
  return publicPatient_(record);
}

function updatePatient_(auth, payload, requestId) {
  requirePermission_(auth.user, 'patients.write');
  const found = findRecordByField_('PATIENTS', 'patient_id', String(payload.patientId || '').toLowerCase());
  if (!found) throw createAppError_('NOT_FOUND', 'ไม่พบผู้ป่วย');
  if (!isEntityInScope_(auth.user, found.record)) throw createAppError_('FORBIDDEN', 'ไม่มีสิทธิ์แก้ไขข้อมูลนี้');
  if (Number(payload.rowVersion) !== Number(found.record.row_version)) throw createAppError_('CONFLICT', 'ข้อมูลถูกแก้ไขโดยผู้ใช้อื่น กรุณาโหลดใหม่');
  const errors = validatePatientPayload_(payload, true);
  if (Object.keys(errors).length) { const error = createAppError_('VALIDATION_ERROR', 'ข้อมูลผู้ป่วยไม่ถูกต้อง'); error.fieldErrors = errors; throw error; }
  const mapping = { title:'title',firstName:'first_name',lastName:'last_name',birthDate:'birth_date',sexAtBirth:'sex_at_birth',phone:'phone',addressText:'address_text',areaId:'area_id',latitude:'latitude',longitude:'longitude',mainDiagnosis:'main_diagnosis',allergies:'allergies',coverageScheme:'coverage_scheme',riskLevel:'risk_level',patientStatus:'patient_status' };
  const changes = {};
  Object.keys(mapping).forEach(function (key) { if (payload[key] !== undefined) changes[mapping[key]] = typeof payload[key] === 'string' ? safeCellText_(payload[key], 1000) : payload[key]; });
  changes.updated_at = new Date().toISOString(); changes.updated_by = auth.user.user_id; changes.row_version = Number(found.record.row_version) + 1;
  updateRecordRow_('PATIENTS', found.rowNumber, changes);
  appendAudit_({ requestId: requestId, actorUserId: auth.user.user_id, organizationId: found.record.organization_id, actionCode: 'PATIENT_UPDATE', entityType: 'PATIENT', entityId: found.record.patient_id, changedFields: Object.keys(changes).filter(function(k){return k.indexOf('updated_')!==0;}) });
  return Object.assign(publicPatient_(found.record), toClientPatientChanges_(changes));
}

function archivePatient_(auth, payload, requestId) {
  requirePermission_(auth.user, 'patients.write');
  const found = findRecordByField_('PATIENTS', 'patient_id', String(payload.patientId || '').toLowerCase());
  if (!found) throw createAppError_('NOT_FOUND', 'ไม่พบผู้ป่วย');
  if (!isEntityInScope_(auth.user, found.record)) throw createAppError_('FORBIDDEN', 'ไม่มีสิทธิ์แก้ไขข้อมูลนี้');
  const now = new Date().toISOString();
  updateRecordRow_('PATIENTS', found.rowNumber, { is_active: false, patient_status: 'INACTIVE', updated_at: now, updated_by: auth.user.user_id, row_version: Number(found.record.row_version) + 1 });
  appendAudit_({ requestId: requestId, actorUserId: auth.user.user_id, organizationId: found.record.organization_id, actionCode: 'PATIENT_ARCHIVE', entityType: 'PATIENT', entityId: found.record.patient_id, reason: safeCellText_(payload.reason, 500) });
  return { archived: true };
}

function setPatientCid_(auth, payload, requestId) {
  requirePermission_(auth.user, 'patients.write');
  const found = findRecordByField_('PATIENTS', 'patient_id', String(payload.patientId || '').toLowerCase());
  if (!found) throw createAppError_('NOT_FOUND', 'ไม่พบผู้ป่วย');
  if (!isEntityInScope_(auth.user, found.record)) throw createAppError_('FORBIDDEN', 'ไม่มีสิทธิ์แก้ไขข้อมูลนี้');
  if (!payload.cid || !validateCid_(payload.cid)) { const error = createAppError_('VALIDATION_ERROR', 'ข้อมูลผู้ป่วยไม่ถูกต้อง'); error.fieldErrors = { cid: 'เลขประจำตัวประชาชนไม่ถูกต้อง' }; throw error; }
  const organizationId = String(found.record.organization_id || '');
  const cidHash = hashCidForLookup_(payload.cid);
  const now = new Date().toISOString();
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    if (buildPatientIdentifierMap_()[String(found.record.patient_id)]) throw createAppError_('CONFLICT', 'ผู้ป่วยรายนี้มีเลขประจำตัวประชาชนอยู่แล้ว');
    if (findRecordByField_('PATIENT_IDENTIFIERS', 'identifier_hash', cidHash)) throw createAppError_('CONFLICT', 'เลขประจำตัวประชาชนนี้มีในระบบแล้ว');
    const cidEncrypted = encryptCid_(payload.cid, found.record.patient_id, organizationId);
    appendRecord_('PATIENT_IDENTIFIERS', {
      identifier_id: Utilities.getUuid(), patient_id: found.record.patient_id, organization_id: organizationId, identifier_type: 'CID', identifier_encrypted: cidEncrypted,
      identifier_hash: cidHash, last4: normalizeCid_(payload.cid).slice(-4), verified_at: '', verified_by: '',
      created_at: now, created_by: auth.user.user_id, updated_at: now, updated_by: auth.user.user_id, row_version: 1, is_active: true
    });
  } finally { lock.releaseLock(); }
  appendAudit_({ requestId: requestId, actorUserId: auth.user.user_id, organizationId: organizationId, actionCode: 'PATIENT_SET_CID', entityType: 'PATIENT', entityId: found.record.patient_id });
  return { patientId: found.record.patient_id, cidMasked: maskCidLast4_(normalizeCid_(payload.cid).slice(-4)) };
}

function findPatientByHnInOrganization_(hn, organizationId) {
  const sheet = getDataSheet_('PATIENTS'); if (sheet.getLastRow() < 2) return null;
  const rows = sheet.getDataRange().getValues(); const headers = rows[0];
  return rows.slice(1).map(function(row){return rowToObject_(headers,row);}).find(function(p){return String(p.hn).toLowerCase()===String(hn).toLowerCase() && String(p.organization_id)===String(organizationId) && String(p.is_active).toLowerCase()!=='false';}) || null;
}

function publicPatient_(patient, identifierMap) {
  const identifierRecord = identifierMap ? identifierMap[String(patient.patient_id)] : null;
  const identifier = identifierRecord ? {record:identifierRecord} : findRecordByField_('PATIENT_IDENTIFIERS', 'patient_id', String(patient.patient_id).toLowerCase());
  return { patientId:String(patient.patient_id),hn:String(patient.hn),title:String(patient.title||''),firstName:String(patient.first_name),lastName:String(patient.last_name),fullName:[patient.title,patient.first_name,patient.last_name].filter(String).join(' '),birthDate:String(patient.birth_date||''),sexAtBirth:String(patient.sex_at_birth||''),phone:String(patient.phone||''),addressText:String(patient.address_text||''),areaId:String(patient.area_id||''),latitude:patient.latitude||'',longitude:patient.longitude||'',mainDiagnosis:String(patient.main_diagnosis||''),allergies:String(patient.allergies||''),coverageScheme:String(patient.coverage_scheme||''),patientStatus:String(patient.patient_status||''),riskLevel:String(patient.risk_level||'LOW'),organizationId:String(patient.organization_id||''),serviceUnitId:String(patient.service_unit_id||''),cidMasked:identifier?maskCidLast4_(identifier.record.last4):'',rowVersion:Number(patient.row_version||1),caregivers:[]};
}

function buildPatientIdentifierMap_() {
  const sheet=getDataSheet_('PATIENT_IDENTIFIERS'); const map={}; if(sheet.getLastRow()<2)return map;
  const rows=sheet.getDataRange().getValues(); const headers=rows[0]; rows.slice(1).forEach(function(row){const item=rowToObject_(headers,row);if(String(item.is_active).toLowerCase()!=='false'&&item.identifier_type==='CID')map[String(item.patient_id)]=item;});return map;
}

function toClientPatientChanges_(changes) { return { rowVersion:Number(changes.row_version) }; }
