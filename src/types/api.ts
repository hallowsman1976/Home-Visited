export interface ApiError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface ApiEnvelope<T> {
  ok: boolean;
  requestId: string;
  data: T | null;
  error: ApiError | null;
  meta: { timestamp: string; environment?: string; version?: string };
}

export interface HealthData {
  status: 'ok';
  service: string;
  version: string;
  environment: string;
  spreadsheetConfigured: boolean;
}

export type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'CLINICIAN' | 'CARE_TEAM' | 'VIEWER' | 'AUDITOR';

export interface AuthUser {
  userId: string;
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
  organizationId: string;
  serviceUnitId: string;
  scopes: { organizationId: string; serviceUnitId: string; areaIds: string[]; teamIds: string[] };
  mustChangePassword: boolean;
}

export interface LoginData { sessionToken: string; expiresAt: string; user: AuthUser }

export interface Caregiver {
  caregiverId: string; firstName: string; lastName: string; phone: string; relationshipCode: string;
  isPrimary: boolean; livesTogether: boolean; consentToContact: boolean;
}

export interface Patient {
  patientId: string; hn: string; title: string; firstName: string; lastName: string; fullName: string;
  birthDate: string; sexAtBirth: string; phone: string; addressText: string; areaId: string;
  latitude: number | ''; longitude: number | ''; mainDiagnosis: string; allergies: string;
  coverageScheme: string; patientStatus: string; riskLevel: string; organizationId: string;
  serviceUnitId: string; cidMasked: string; rowVersion: number; caregivers: Caregiver[];
}

export interface PatientSearchData { items: Patient[]; page: number; pageSize: number; total: number }

export interface VitalSigns { measuredAt?: string; weightKg?: number|''; heightCm?: number|''; bmi?: number|''; temperatureC?: number|''; pulseBpm?: number|''; respiratoryRate?: number|''; systolicBp?: number|''; diastolicBp?: number|''; spo2Percent?: number|''; dtxMgDl?: number|''; painScore?: number|''; waistCm?: number|''; note?: string }
export interface AssessmentItem { itemId:string;domainCode:string;itemCode:string;questionTh:string;responseType:'BOOLEAN'|'SINGLE'|'MULTI'|'NUMBER'|'TEXT'|'DATE';options:Array<{value:string;label:string}>;required:boolean;displayOrder:number;helpText:string }
export interface Assessment { assessmentId:string;code:string;nameTh:string;version:string;status:string;items:AssessmentItem[] }
export interface AssessmentResponse { responseId?:string;itemId:string;answer:unknown;riskFlag?:boolean;riskLevel?:string;note?:string }
export interface Visit { visitId:string;patientId:string;patientName:string;hn:string;visitNo:number;visitType:string;visitDate:string;startAt:string;endAt:string;locationType:string;chiefConcern:string;subjectiveNote:string;objectiveNote:string;assessmentSummary:string;planSummary:string;overallRisk:string;status:string;nextVisitDate:string;assessmentId:string;rowVersion:number;vitalSigns?:VitalSigns|null;assessment?:Assessment|null;responses?:AssessmentResponse[] }
export interface VisitListData {items:Visit[];page:number;pageSize:number;total:number}
export interface VisitMedication {visitMedicationId:string;visitId:string;medicationId:string;drugNameSnapshot:string;dose:string;route:string;frequency:string;indication:string;actualUse:string;adherenceLevel:string;drugRelatedProblem:string;actionTaken:string}
export interface Problem {problemId:string;patientId:string;visitId:string;domainCode:string;problemCode:string;problemText:string;severity:string;priority:number;status:string;identifiedAt:string;resolvedAt:string}
export interface Intervention {interventionId:string;carePlanId:string;visitId:string;interventionType:string;activityText:string;performedAt:string;performedBy:string;outcomeText:string}
export interface CarePlan {carePlanId:string;problemId:string;goalText:string;targetDate:string;ownerUserId:string;ownerTeamId:string;status:string;evaluationText:string;interventions:Intervention[]}
export interface Referral {referralId:string;patientId:string;visitId:string;referredToUnit:string;reason:string;urgency:string;referredAt:string;status:string;appointmentAt:string;resultText:string}
export interface FollowUp {followUpId:string;patientId:string;patientName:string;hn:string;visitId:string;followUpType:string;dueAt:string;assignedToUserId:string;priority:string;status:string;completedAt:string;resultText:string}
export interface Consent {consentId:string;patientId:string;consentType:string;purpose:string;legalBasis:string;version:string;status:string;grantedBy:string;relationship:string;recordedAt:string;expiresAt:string;withdrawnAt:string}
export interface Attachment {attachmentId:string;patientId:string;visitId:string;fileCategory:string;originalName:string;mimeType:string;sizeBytes:number;caption:string;capturedAt:string;consentId:string;uploadedBy:string;accessLevel:string}
export interface DashboardSummary {patientsTotal:number;patientsHighRisk:number;visitsTotal:number;visitsToday:number;drafts:number;followUpsPending:number;followUpsOverdue:number;recentVisits:Visit[]}
export interface VisitReport {items:Visit[];total:number;dateFrom:string;dateTo:string;limit:number}
