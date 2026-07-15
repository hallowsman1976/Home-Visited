const STANDARD_AUDIT_COLUMNS = [
  'created_at', 'created_by', 'updated_at', 'updated_by', 'row_version', 'is_active'
];

const SHEET_SCHEMAS = Object.freeze({
  SETTINGS: ['setting_key','setting_value','value_type','environment','description','is_secret'],
  USERS: ['user_id','username','email','password_hash','display_name','professional_no','role_code','organization_id','service_unit_id','status','last_login_at','failed_login_count','locked_until','must_change_password','scopes_json'],
  SESSIONS: ['session_id','user_id','token_hash','issued_at','expires_at','revoked_at','ip_hash','user_agent_summary'],
  ORGANIZATIONS: ['organization_id','organization_code','organization_name_th','province_code','timezone'],
  SERVICE_UNITS: ['service_unit_id','organization_id','hcode','unit_name_th','unit_type','phone'],
  TEAMS: ['team_id','service_unit_id','team_code','team_name','team_lead_user_id'],
  TEAM_MEMBERS: ['team_member_id','team_id','user_id','member_role','start_date','end_date'],
  AREAS: ['area_id','organization_id','province_code','district_code','subdistrict_code','village_no','area_name_th'],
  PATIENTS: ['patient_id','organization_id','service_unit_id','hn','title','first_name','last_name','birth_date','sex_at_birth','phone','address_text','area_id','latitude','longitude','main_diagnosis','comorbidities_json','allergies','coverage_scheme','patient_status','risk_level'],
  PATIENT_IDENTIFIERS: ['identifier_id','patient_id','organization_id','identifier_type','identifier_encrypted','identifier_hash','last4','verified_at','verified_by'],
  CAREGIVERS: ['caregiver_id','first_name','last_name','phone','address_text','caregiver_status'],
  PATIENT_CAREGIVERS: ['patient_caregiver_id','patient_id','caregiver_id','relationship_code','is_primary','lives_together','consent_to_contact','start_date','end_date'],
  VISITS: ['visit_id','patient_id','visit_no','visit_type','visit_date','start_at','end_at','team_id','lead_visitor_user_id','location_type','chief_concern','subjective_note','objective_note','assessment_id','assessment_summary','plan_summary','overall_risk','status','next_visit_date','idempotency_key','submitted_at','submitted_by','signed_at','signed_by'],
  VITAL_SIGNS: ['vital_id','visit_id','measured_at','weight_kg','height_cm','bmi','temperature_c','pulse_bpm','respiratory_rate','systolic_bp','diastolic_bp','spo2_percent','dtx_mg_dl','pain_score_0_10','waist_cm','note'],
  ASSESSMENTS: ['assessment_id','assessment_code','assessment_name_th','version','effective_from','effective_to','status','clinical_approved_by','clinical_approved_at'],
  ASSESSMENT_ITEMS: ['item_id','assessment_id','domain_code','item_code','question_th','response_type','options_json','required','risk_rule_json','display_order','help_text'],
  VISIT_ASSESSMENT_RESPONSES: ['response_id','visit_id','assessment_id','item_id','answer_text','answer_number','answer_json','risk_flag','risk_level','note'],
  MEDICATIONS: ['medication_id','organization_id','drug_code','generic_name','trade_name','strength','dosage_form'],
  VISIT_MEDICATIONS: ['visit_medication_id','visit_id','medication_id','drug_name_snapshot','dose','route','frequency','indication','actual_use','adherence_level','drug_related_problem','action_taken'],
  PROBLEMS: ['problem_id','patient_id','visit_id','domain_code','problem_code','problem_text','severity','priority','status','identified_at','resolved_at'],
  CARE_PLANS: ['care_plan_id','problem_id','goal_text','target_date','owner_user_id','owner_team_id','status','evaluation_text'],
  INTERVENTIONS: ['intervention_id','care_plan_id','visit_id','intervention_type','activity_text','performed_at','performed_by','outcome_text'],
  REFERRALS: ['referral_id','patient_id','visit_id','referred_to_unit','reason','urgency','referred_at','status','appointment_at','result_text'],
  FOLLOW_UPS: ['follow_up_id','patient_id','visit_id','follow_up_type','due_at','assigned_to_user_id','assigned_team_id','priority','status','completed_at','result_text'],
  ATTACHMENTS: ['attachment_id','patient_id','visit_id','file_category','drive_file_id','original_name','mime_type','size_bytes','sha256','caption','captured_at','consent_id','uploaded_by','access_level','archived_at'],
  CONSENTS: ['consent_id','patient_id','consent_type','purpose','legal_basis','version','status','granted_by','relationship','recorded_at','expires_at','withdrawn_at'],
  NOTIFICATIONS: ['notification_id','recipient_user_id','patient_id','follow_up_id','channel','template_code','payload_redacted_json','scheduled_at','sent_at','status','error_code','retry_count'],
  AUDIT_LOGS: ['audit_id','occurred_at','request_id','actor_user_id','action_code','entity_type','entity_id','organization_id','outcome','changed_fields_json','reason','ip_hash'],
  LOOKUPS: ['lookup_id','lookup_group','lookup_code','label_th','label_en','sort_order','metadata_json']
});

function getHeadersForSheet_(sheetName) {
  const base = SHEET_SCHEMAS[sheetName];
  if (!base) throw new Error('UNKNOWN_SCHEMA: ' + sheetName);
  if (sheetName === 'AUDIT_LOGS') return base;
  return base.concat(STANDARD_AUDIT_COLUMNS.filter(function (column) { return base.indexOf(column) === -1; }));
}
