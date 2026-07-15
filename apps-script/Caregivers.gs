function listPatientCaregivers_(patientId) {
  const linksSheet = getDataSheet_('PATIENT_CAREGIVERS'); const caregiversSheet = getDataSheet_('CAREGIVERS');
  if (linksSheet.getLastRow() < 2 || caregiversSheet.getLastRow() < 2) return [];
  const linkRows = linksSheet.getDataRange().getValues(); const linkHeaders = linkRows[0];
  const caregiverRows = caregiversSheet.getDataRange().getValues(); const caregiverHeaders = caregiverRows[0];
  const caregivers = caregiverRows.slice(1).map(function(row){return rowToObject_(caregiverHeaders,row);});
  return linkRows.slice(1).map(function(row){return rowToObject_(linkHeaders,row);}).filter(function(link){return String(link.patient_id)===String(patientId)&&String(link.is_active).toLowerCase()!=='false';}).map(function(link){const caregiver=caregivers.find(function(item){return String(item.caregiver_id)===String(link.caregiver_id);});return caregiver?{caregiverId:String(caregiver.caregiver_id),firstName:String(caregiver.first_name),lastName:String(caregiver.last_name),phone:String(caregiver.phone||''),relationshipCode:String(link.relationship_code||''),isPrimary:String(link.is_primary).toLowerCase()==='true',livesTogether:String(link.lives_together).toLowerCase()==='true',consentToContact:String(link.consent_to_contact).toLowerCase()==='true'}:null;}).filter(Boolean);
}

function addCaregiver_(auth, payload, requestId) {
  requirePermission_(auth.user, 'patients.write');
  const patientFound = findRecordByField_('PATIENTS','patient_id',String(payload.patientId||'').toLowerCase());
  if (!patientFound) throw createAppError_('NOT_FOUND','ไม่พบผู้ป่วย');
  if (!isEntityInScope_(auth.user, patientFound.record)) throw createAppError_('FORBIDDEN','ไม่มีสิทธิ์แก้ไขข้อมูลนี้');
  if (!String(payload.firstName||'').trim() || !String(payload.lastName||'').trim()) throw createAppError_('VALIDATION_ERROR','กรุณากรอกชื่อและนามสกุลผู้ดูแล');
  const now=new Date().toISOString(); const caregiverId=Utilities.getUuid();
  appendRecord_('CAREGIVERS',{caregiver_id:caregiverId,first_name:safeCellText_(payload.firstName,150),last_name:safeCellText_(payload.lastName,150),phone:safeCellText_(payload.phone,30),address_text:safeCellText_(payload.addressText,1000),caregiver_status:'ACTIVE',created_at:now,created_by:auth.user.user_id,updated_at:now,updated_by:auth.user.user_id,row_version:1,is_active:true});
  appendRecord_('PATIENT_CAREGIVERS',{patient_caregiver_id:Utilities.getUuid(),patient_id:patientFound.record.patient_id,caregiver_id:caregiverId,relationship_code:safeCellText_(payload.relationshipCode,50),is_primary:Boolean(payload.isPrimary),lives_together:Boolean(payload.livesTogether),consent_to_contact:Boolean(payload.consentToContact),start_date:now.slice(0,10),end_date:'',created_at:now,created_by:auth.user.user_id,updated_at:now,updated_by:auth.user.user_id,row_version:1,is_active:true});
  appendAudit_({requestId:requestId,actorUserId:auth.user.user_id,organizationId:patientFound.record.organization_id,actionCode:'CAREGIVER_ADD',entityType:'PATIENT',entityId:patientFound.record.patient_id});
  return {caregiverId:caregiverId,created:true};
}

