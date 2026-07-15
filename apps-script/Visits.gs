function listVisits_(auth, payload, requestId) {
  requirePermission_(auth.user, 'visits.read');
  const page=Math.max(1,Number(payload.page||1)); const pageSize=Math.min(50,Math.max(1,Number(payload.pageSize||20)));
  const patientId=String(payload.patientId||''); const status=String(payload.status||'');
  const patients=buildPatientMapForScope_(auth.user); const sheet=getDataSheet_('VISITS');
  if(sheet.getLastRow()<2)return {items:[],page:page,pageSize:pageSize,total:0};
  const rows=sheet.getDataRange().getValues(); const headers=rows[0];
  const matches=rows.slice(1).map(function(row){return rowToObject_(headers,row);}).filter(function(visit){
    if(String(visit.is_active).toLowerCase()==='false'||!patients[String(visit.patient_id)])return false;
    if(patientId&&String(visit.patient_id)!==patientId)return false; if(status&&String(visit.status)!==status)return false; return true;
  }).sort(function(a,b){return String(b.visit_date).localeCompare(String(a.visit_date));});
  const start=(page-1)*pageSize;
  return {items:matches.slice(start,start+pageSize).map(function(v){return publicVisit_(v,patients[String(v.patient_id)]);}),page:page,pageSize:pageSize,total:matches.length};
}

function getVisit_(auth,payload,requestId){
  requirePermission_(auth.user,'visits.read'); const found=findRecordByField_('VISITS','visit_id',String(payload.visitId||'').toLowerCase());
  if(!found)throw createAppError_('NOT_FOUND','ไม่พบรายการเยี่ยม'); const patient=getPatientRecordInScope_(auth.user,found.record.patient_id);
  if(!patient)throw createAppError_('FORBIDDEN','ไม่มีสิทธิ์เข้าถึงรายการนี้');
  const result=publicVisit_(found.record,patient); result.vitalSigns=getVisitVital_(found.record.visit_id); result.assessment=getVisitAssessmentBundle_(found.record.visit_id); result.responses=getVisitResponses_(found.record.visit_id);
  appendAudit_({requestId:requestId,actorUserId:auth.user.user_id,organizationId:patient.organization_id,actionCode:'VISIT_VIEW',entityType:'VISIT',entityId:found.record.visit_id}); return result;
}

function createVisitDraft_(auth,payload,requestId){
  if(!hasPermission_(auth.user,'visits.write')&&!hasPermission_(auth.user,'visits.draft'))throw createAppError_('FORBIDDEN','ไม่มีสิทธิ์สร้างรายการเยี่ยม');
  const patient=getPatientRecordInScope_(auth.user,payload.patientId); if(!patient)throw createAppError_('NOT_FOUND','ไม่พบผู้ป่วยในขอบเขตสิทธิ์');
  const idempotencyKey=String(payload.idempotencyKey||''); if(idempotencyKey){const existing=findRecordByField_('VISITS','idempotency_key',idempotencyKey.toLowerCase());if(existing)return publicVisit_(existing.record,patient);}
  const now=new Date(); const visitId=Utilities.getUuid(); const visitNo=nextVisitNumber_(patient.patient_id); const assessment=getActiveAssessment_();
  const record={visit_id:visitId,patient_id:patient.patient_id,visit_no:visitNo,visit_type:String(payload.visitType||'FOLLOW_UP'),visit_date:String(payload.visitDate||formatIsoDate_(now)),start_at:String(payload.startAt||now.toISOString()),end_at:'',team_id:String(payload.teamId||''),lead_visitor_user_id:auth.user.user_id,location_type:String(payload.locationType||'HOME'),chief_concern:'',subjective_note:'',objective_note:'',assessment_id:assessment?assessment.assessment_id:'',assessment_summary:'',plan_summary:'',overall_risk:'LOW',status:'DRAFT',next_visit_date:'',idempotency_key:idempotencyKey||Utilities.getUuid(),submitted_at:'',submitted_by:'',signed_at:'',signed_by:'',created_at:now.toISOString(),created_by:auth.user.user_id,updated_at:now.toISOString(),updated_by:auth.user.user_id,row_version:1,is_active:true};
  const lock=LockService.getScriptLock();lock.waitLock(30000);try{appendRecord_('VISITS',record);}finally{lock.releaseLock();}
  appendAudit_({requestId:requestId,actorUserId:auth.user.user_id,organizationId:patient.organization_id,actionCode:'VISIT_DRAFT_CREATE',entityType:'VISIT',entityId:visitId}); return publicVisit_(record,patient);
}

function saveVisitDraft_(auth,payload,requestId){
  if(!hasPermission_(auth.user,'visits.write')&&!hasPermission_(auth.user,'visits.draft'))throw createAppError_('FORBIDDEN','ไม่มีสิทธิ์บันทึกร่าง');
  const found=findRecordByField_('VISITS','visit_id',String(payload.visitId||'').toLowerCase());if(!found)throw createAppError_('NOT_FOUND','ไม่พบรายการเยี่ยม');
  const patient=getPatientRecordInScope_(auth.user,found.record.patient_id);if(!patient)throw createAppError_('FORBIDDEN','ไม่มีสิทธิ์แก้ไขรายการนี้');
  if(['SUBMITTED','SIGNED','CLOSED'].indexOf(String(found.record.status))!==-1)throw createAppError_('CONFLICT','รายการนี้ส่งแล้ว ไม่สามารถแก้ไขร่างได้');
  if(Number(payload.rowVersion)!==Number(found.record.row_version))throw createAppError_('CONFLICT','ข้อมูลถูกแก้ไขจากอุปกรณ์อื่น กรุณาโหลดใหม่');
  const allowed={visitType:'visit_type',visitDate:'visit_date',startAt:'start_at',endAt:'end_at',teamId:'team_id',locationType:'location_type',chiefConcern:'chief_concern',subjectiveNote:'subjective_note',objectiveNote:'objective_note',planSummary:'plan_summary',overallRisk:'overall_risk',nextVisitDate:'next_visit_date'}; const changes={};
  Object.keys(allowed).forEach(function(key){if(payload[key]!==undefined)changes[allowed[key]]=safeCellText_(payload[key],5000);});
  validateVisitFields_(Object.assign({},found.record,changes)); const now=new Date().toISOString();changes.updated_at=now;changes.updated_by=auth.user.user_id;changes.row_version=Number(found.record.row_version)+1;
  const lock=LockService.getScriptLock();lock.waitLock(30000);try{updateRecordRow_('VISITS',found.rowNumber,changes);if(payload.vitalSigns)upsertVisitVital_(found.record.visit_id,payload.vitalSigns,auth.user.user_id);}finally{lock.releaseLock();}
  return Object.assign(publicVisit_(found.record,patient),toClientVisitChanges_(changes),{vitalSigns:payload.vitalSigns||getVisitVital_(found.record.visit_id)});
}

function submitVisit_(auth,payload,requestId){
  requirePermission_(auth.user,'visits.submit'); const found=findRecordByField_('VISITS','visit_id',String(payload.visitId||'').toLowerCase());if(!found)throw createAppError_('NOT_FOUND','ไม่พบรายการเยี่ยม');
  const patient=getPatientRecordInScope_(auth.user,found.record.patient_id);if(!patient)throw createAppError_('FORBIDDEN','ไม่มีสิทธิ์ส่งรายการนี้'); if(String(found.record.status)==='SUBMITTED')return {submitted:true,visitId:found.record.visit_id};
  if(['DRAFT','REOPENED'].indexOf(String(found.record.status))===-1)throw createAppError_('CONFLICT','สถานะรายการไม่สามารถส่งได้');
  const validation=validateVisitForSubmit_(found.record);if(validation.length){const error=createAppError_('VALIDATION_ERROR','ข้อมูลยังไม่ครบสำหรับส่ง');error.fieldErrors=validation.reduce(function(o,item){o[item.field]=item.message;return o;},{});throw error;}
  const now=new Date().toISOString();updateRecordRow_('VISITS',found.rowNumber,{status:'SUBMITTED',submitted_at:now,submitted_by:auth.user.user_id,end_at:found.record.end_at||now,updated_at:now,updated_by:auth.user.user_id,row_version:Number(found.record.row_version)+1});
  appendAudit_({requestId:requestId,actorUserId:auth.user.user_id,organizationId:patient.organization_id,actionCode:'VISIT_SUBMIT',entityType:'VISIT',entityId:found.record.visit_id});return {submitted:true,visitId:found.record.visit_id};
}

function reopenVisit_(auth,payload,requestId){
  requirePermission_(auth.user,'visits.write');if(['SUPER_ADMIN','ORG_ADMIN','CLINICIAN'].indexOf(String(auth.user.role_code))===-1)throw createAppError_('FORBIDDEN','ไม่มีสิทธิ์เปิดรายการใหม่');
  const reason=safeCellText_(payload.reason,500);if(!reason)throw createAppError_('VALIDATION_ERROR','กรุณาระบุเหตุผล');const found=findRecordByField_('VISITS','visit_id',String(payload.visitId||'').toLowerCase());if(!found)throw createAppError_('NOT_FOUND','ไม่พบรายการเยี่ยม');
  const patient=getPatientRecordInScope_(auth.user,found.record.patient_id);if(!patient)throw createAppError_('FORBIDDEN','ไม่มีสิทธิ์แก้ไขรายการนี้');const now=new Date().toISOString();updateRecordRow_('VISITS',found.rowNumber,{status:'REOPENED',updated_at:now,updated_by:auth.user.user_id,row_version:Number(found.record.row_version)+1});appendAudit_({requestId:requestId,actorUserId:auth.user.user_id,organizationId:patient.organization_id,actionCode:'VISIT_REOPEN',entityType:'VISIT',entityId:found.record.visit_id,reason:reason});return {reopened:true};
}

function validateVisitFields_(visit){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(visit.visit_date||'')))throw createAppError_('VALIDATION_ERROR','วันที่เยี่ยมไม่ถูกต้อง');if(visit.end_at&&new Date(visit.end_at).getTime()<new Date(visit.start_at).getTime())throw createAppError_('VALIDATION_ERROR','เวลาสิ้นสุดต้องไม่น้อยกว่าเวลาเริ่ม');}
function validateVisitForSubmit_(visit){const errors=[];if(!visit.visit_date)errors.push({field:'visitDate',message:'กรุณาระบุวันที่เยี่ยม'});if(!visit.lead_visitor_user_id)errors.push({field:'visitor',message:'ไม่พบผู้เยี่ยม'});const bundle=getVisitAssessmentBundle_(visit.visit_id);if(!bundle)errors.push({field:'assessment',message:'ยังไม่มีแบบประเมินที่อนุมัติ'});else{const responses=getVisitResponses_(visit.visit_id);const answered={};responses.forEach(function(r){answered[r.itemId]=true;});bundle.items.filter(function(i){return i.required;}).forEach(function(i){if(!answered[i.itemId])errors.push({field:'assessment.'+i.itemCode,message:'กรุณาตอบ '+i.questionTh});});}if(['HIGH','CRITICAL'].indexOf(String(visit.overall_risk))!==-1&&!String(visit.plan_summary||'').trim())errors.push({field:'planSummary',message:'ความเสี่ยงสูงต้องมีแผนดูแล'});return errors;}
function upsertVisitVital_(visitId,vital,userId){const errors=validateVitalSigns_(vital);if(Object.keys(errors).length){const error=createAppError_('VALIDATION_ERROR','ค่าสัญญาณชีพไม่ถูกต้อง');error.fieldErrors=errors;throw error;}const found=findRecordByField_('VITAL_SIGNS','visit_id',String(visitId).toLowerCase());const now=new Date().toISOString();const record={visit_id:visitId,measured_at:String(vital.measuredAt||now),weight_kg:vital.weightKg||'',height_cm:vital.heightCm||'',bmi:calculateBmi_(vital.weightKg,vital.heightCm),temperature_c:vital.temperatureC||'',pulse_bpm:vital.pulseBpm||'',respiratory_rate:vital.respiratoryRate||'',systolic_bp:vital.systolicBp||'',diastolic_bp:vital.diastolicBp||'',spo2_percent:vital.spo2Percent||'',dtx_mg_dl:vital.dtxMgDl||'',pain_score_0_10:vital.painScore||'',waist_cm:vital.waistCm||'',note:safeCellText_(vital.note,1000),updated_at:now,updated_by:userId};if(found){record.row_version=Number(found.record.row_version)+1;updateRecordRow_('VITAL_SIGNS',found.rowNumber,record);}else{record.vital_id=Utilities.getUuid();record.created_at=now;record.created_by=userId;record.row_version=1;record.is_active=true;appendRecord_('VITAL_SIGNS',record);}}
function validateVitalSigns_(v){const e={};const range=function(key,min,max,label){if(v[key]!==undefined&&v[key]!==''&&(Number(v[key])<min||Number(v[key])>max))e[key]=label+' อยู่นอกช่วงที่ระบบรับได้';};range('temperatureC',25,45,'อุณหภูมิ');range('pulseBpm',20,250,'ชีพจร');range('respiratoryRate',5,80,'การหายใจ');range('systolicBp',40,300,'ความดันตัวบน');range('diastolicBp',20,200,'ความดันตัวล่าง');range('spo2Percent',30,100,'SpO2');range('dtxMgDl',10,1000,'DTX');range('painScore',0,10,'Pain score');range('weightKg',1,500,'น้ำหนัก');range('heightCm',30,250,'ส่วนสูง');return e;}
function calculateBmi_(weight,height){if(!weight||!height)return '';return Math.round((Number(weight)/Math.pow(Number(height)/100,2))*100)/100;}
function getVisitVital_(visitId){const found=findRecordByField_('VITAL_SIGNS','visit_id',String(visitId).toLowerCase());if(!found)return null;const v=found.record;return {measuredAt:String(v.measured_at||''),weightKg:v.weight_kg||'',heightCm:v.height_cm||'',bmi:v.bmi||'',temperatureC:v.temperature_c||'',pulseBpm:v.pulse_bpm||'',respiratoryRate:v.respiratory_rate||'',systolicBp:v.systolic_bp||'',diastolicBp:v.diastolic_bp||'',spo2Percent:v.spo2_percent||'',dtxMgDl:v.dtx_mg_dl||'',painScore:v.pain_score_0_10||'',waistCm:v.waist_cm||'',note:String(v.note||'')};}
function nextVisitNumber_(patientId){const sheet=getDataSheet_('VISITS');if(sheet.getLastRow()<2)return 1;const rows=sheet.getDataRange().getValues();const h=rows[0];const p=h.indexOf('patient_id');return rows.slice(1).filter(function(r){return String(r[p])===String(patientId);}).length+1;}
function buildPatientMapForScope_(user){const sheet=getDataSheet_('PATIENTS');const map={};if(sheet.getLastRow()<2)return map;const rows=sheet.getDataRange().getValues();const h=rows[0];rows.slice(1).forEach(function(r){const p=rowToObject_(h,r);if(String(p.is_active).toLowerCase()!=='false'&&isEntityInScope_(user,p))map[String(p.patient_id)]=p;});return map;}
function getPatientRecordInScope_(user,patientId){const found=findRecordByField_('PATIENTS','patient_id',String(patientId||'').toLowerCase());return found&&isEntityInScope_(user,found.record)?found.record:null;}
function publicVisit_(v,p){return {visitId:String(v.visit_id),patientId:String(v.patient_id),patientName:p?[p.title,p.first_name,p.last_name].filter(String).join(' '):'',hn:p?String(p.hn):'',visitNo:Number(v.visit_no),visitType:String(v.visit_type),visitDate:String(v.visit_date),startAt:String(v.start_at||''),endAt:String(v.end_at||''),locationType:String(v.location_type),chiefConcern:String(v.chief_concern||''),subjectiveNote:String(v.subjective_note||''),objectiveNote:String(v.objective_note||''),assessmentSummary:String(v.assessment_summary||''),planSummary:String(v.plan_summary||''),overallRisk:String(v.overall_risk||'LOW'),status:String(v.status),nextVisitDate:String(v.next_visit_date||''),assessmentId:String(v.assessment_id||''),rowVersion:Number(v.row_version||1)};}
function toClientVisitChanges_(c){return {rowVersion:Number(c.row_version),chiefConcern:c.chief_concern,subjectiveNote:c.subjective_note,objectiveNote:c.objective_note,planSummary:c.plan_summary,overallRisk:c.overall_risk,nextVisitDate:c.next_visit_date};}
function formatIsoDate_(date){return Utilities.formatDate(date,APP_CONFIG.TIMEZONE,'yyyy-MM-dd');}
