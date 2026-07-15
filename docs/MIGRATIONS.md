# Schema Migration Log

## v0.1.0 — Phase 1 initial schema

- สร้าง 29 Sheets ตาม Blueprint v1.0
- เพิ่ม audit columns มาตรฐานในทุก Sheet ยกเว้น `AUDIT_LOGS` ซึ่งเป็น append-only
- Seed `SETTINGS` 4 รายการ และ `LOOKUPS` สำหรับ INHOMESSS 9 domains
- Initializer จะหยุดด้วย `SCHEMA_CONFLICT` เมื่อพบ header เดิมไม่ตรง ห้ามเขียนทับข้อมูล

การเปลี่ยน schema ในอนาคตต้องเพิ่ม migration function แบบ versioned และบันทึกในไฟล์นี้ ห้ามแก้ header production ด้วยมือ

## v0.2.0 — Authentication และ RBAC

- เพิ่ม `failed_login_count`, `locked_until`, `must_change_password`, `scopes_json` ใน `USERS`
- ใช้ `migrateToV020()` แทรกคอลัมน์ใหม่ก่อน audit columns โดยไม่ลบข้อมูลเดิม
- เพิ่ม bootstrap function และ `AUTH_PEPPER` ใน Script Properties

## v0.3.0 — Patient Registry

- ไม่เพิ่ม Sheet ใหม่ ใช้ `PATIENTS`, `PATIENT_IDENTIFIERS`, `CAREGIVERS`, `PATIENT_CAREGIVERS` ตาม schema เดิม
- เพิ่ม Script Properties `CID_LOOKUP_HMAC_KEY` และ `KMS_CRYPTO_KEY_NAME`
- เพิ่ม OAuth scope `cloud-platform` และ `script.external_request` สำหรับ Cloud KMS REST API
- ไม่มีการย้ายหรือถอดรหัส CID เดิมโดยอัตโนมัติ ข้อมูลเดิมต้องผ่าน migration ที่ทีมข้อมูลอนุมัติ

## v0.4.0 — Visit & INHOMESSS

- เพิ่ม `assessment_id` ใน `VISITS` เพื่อ pin แบบประเมินต่อการเยี่ยม
- ใช้ `migrateToV040()` สำหรับฐานข้อมูลจาก Phase 1–3
- ไม่มีการเพิ่มคำถามอัตโนมัติ ต้องนำเข้าฉบับที่ทีมคลินิกอนุมัติผ่าน `importAssessmentVersion()`

## v0.5.0 — Care Continuity

- ไม่มี schema migration ใช้ `MEDICATIONS`, `VISIT_MEDICATIONS`, `PROBLEMS`, `CARE_PLANS`, `INTERVENTIONS`, `REFERRALS`, `FOLLOW_UPS` เดิม
- เพิ่ม API และ UI สำหรับ medication reconciliation, problem/plan/intervention, referral และ follow-up

## v0.6.0 — Attachments, Consent, Dashboard และ Reports

- ไม่มี schema migration ใช้ `ATTACHMENTS` และ `CONSENTS` เดิม
- ต้องตั้ง `DRIVE_FOLDER_ID` และตรวจสิทธิ์ Drive ก่อนเปิด upload
- เพิ่ม Dashboard summary, Visit report และ controlled CSV export

## v1.0.0 — Production Hardening

- ไม่มี schema migration
- เพิ่ม `BACKUP_FOLDER_ID`, `BACKUP_RETENTION_DAYS` ใน Script Properties
- เพิ่ม maintenance triggers, rate limiting, integrity/readiness checks และ production diagnostics
- เปลี่ยน Frontend routing เป็น Hash Router เพื่อรองรับ static hosting
