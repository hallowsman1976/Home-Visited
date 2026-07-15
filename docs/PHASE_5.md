# Phase 5 — Care Continuity

## สิ่งที่ส่งมอบ

- Medication master และ Medication Reconciliation ราย Visit
- Problem List เชื่อมผู้ป่วย/Visit/INHOMESSS domain
- Care Plan เชื่อม Problem พร้อมเป้าหมาย วันเป้าหมาย ผู้รับผิดชอบ และสถานะ
- Intervention/กิจกรรมพร้อมผลลัพธ์
- Referral พร้อมความเร่งด่วน สถานะ วันนัด และผลส่งต่อ
- Follow-up work queue ตาม scope พร้อมคำนวณ `OVERDUE`
- Care Continuity UI รายผู้ป่วย และเมนูงานติดตามรวม
- RBAC/scope และ Audit Log ทุกการเพิ่มหรือแก้ไขข้อมูล

## API

```text
medications.list
medications.upsert
visitMedications.list
visitMedications.upsert
problems.list
problems.upsert
carePlans.list
carePlans.upsert
interventions.add
referrals.list
referrals.upsert
followUps.list
followUps.upsert
```

## Data workflow

```text
Patient
├── Problem
│   └── Care Plan
│       └── Intervention
├── Referral
├── Follow-up
└── Visit
    └── Medication Reconciliation
```

ไม่มีการเพิ่ม Sheet หรือ Column ใน Phase 5 ใช้ Schema ที่สร้างไว้ตั้งแต่ Phase 1 จึงไม่ต้องรัน migration ใหม่ เพียงอัปโหลด Apps Script และ Deploy version ใหม่

## ข้อกำหนดข้อมูลสำคัญ

- รายการยาราย Visit เก็บ `drug_name_snapshot` เพื่อรักษาประวัติแม้ master ยาถูกแก้ไขภายหลัง
- ปัญหาไม่ลบจริง ใช้สถานะ `OPEN`, `MONITORING`, `RESOLVED`, `VOID`
- Care Plan ใช้ `PLANNED`, `ACTIVE`, `COMPLETED`, `CANCELLED`
- Referral ใช้ความเร่งด่วน `ROUTINE`, `URGENT`, `EMERGENCY`
- Follow-up ที่เป็น `PENDING` และเลย `due_at` จะแสดงเป็น `OVERDUE` โดยไม่แก้ข้อมูลต้นฉบับ

## Gate ก่อน Phase 6

- [ ] UAT Medication Reconciliation และรายการปัญหาจากยา
- [ ] ตรวจความสัมพันธ์ Problem → Plan → Intervention
- [ ] ทดสอบส่งต่อและบันทึกผลกลับ
- [ ] ทดสอบ Follow-up PENDING/OVERDUE/DONE ตาม timezone Asia/Bangkok
- [ ] ตรวจ permission matrix ของ Care Team และ Clinician
- [ ] อนุมัติประเภทไฟล์ consent และสิทธิ์ดู attachment สำหรับ Phase 6

