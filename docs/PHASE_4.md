# Phase 4 — Visit & INHOMESSS

## สิ่งที่ส่งมอบ

- Visit workflow: `DRAFT → SUBMITTED → REOPENED`
- Visit Wizard 5 ขั้น: ข้อมูลเยี่ยม, สัญญาณชีพ, INHOMESSS, แผนดูแล และตรวจทาน
- Autosave แบบ debounce พร้อมสถานะบันทึกล่าสุด
- Vital signs validation และคำนวณ BMI อัตโนมัติ
- Dynamic assessment โหลดข้อคำถามจาก `ASSESSMENTS`/`ASSESSMENT_ITEMS`
- ตรึง `assessment_id` ต่อ Visit เพื่อรักษาประวัติเมื่อมีแบบประเมินเวอร์ชันใหม่
- คำตอบรายข้อรองรับ BOOLEAN, SINGLE, MULTI, NUMBER, TEXT และ DATE
- Submit validation: required items และแผนดูแลเมื่อความเสี่ยง HIGH/CRITICAL
- Idempotency key, row version, server-side RBAC/scope และ Audit Log
- รายการเยี่ยมและ Timeline รายผู้ป่วย

## Migration จาก Phase 3

อัปโหลดไฟล์ Apps Script ใหม่ทั้งหมด แล้วรัน:

```javascript
migrateToV040();
```

ฟังก์ชันนี้เพิ่ม `assessment_id` ใน Sheet `VISITS` ก่อน `assessment_summary` โดยไม่ลบข้อมูลเดิม

## การนำเข้าแบบประเมิน

ระบบตั้งใจไม่ hard-code คำถามทางคลินิก ให้ทีมคลินิกตรวจทานแบบฟอร์มฉบับจริงก่อน แล้วเรียก `importAssessmentVersion()` ตัวอย่างโครงสร้าง:

```javascript
importAssessmentVersion(
  'INHOMESSS',
  'แบบประเมินเยี่ยมบ้าน INHOMESSS',
  '1.0',
  [
    {
      domainCode: 'I',
      itemCode: 'I01',
      questionTh: 'ข้อความคำถามที่ทีมคลินิกอนุมัติ',
      responseType: 'SINGLE',
      options: [
        { value: 'OPTION_1', label: 'ตัวเลือกที่อนุมัติ' },
        { value: 'OPTION_2', label: 'ตัวเลือกที่อนุมัติ' }
      ],
      required: true,
      displayOrder: 1,
      helpText: '',
      riskRule: {}
    }
  ],
  'ชื่อผู้อนุมัติด้านคลินิก'
);
```

Domain ที่อนุญาต: `I`, `N`, `H`, `O`, `M`, `E`, `S1`, `S2`, `S3`

ทุกครั้งที่นำเข้าเวอร์ชันใหม่ แบบเดิมจะเปลี่ยนเป็น `RETIRED` แต่ Visit เก่ายังคงอ้างอิงแบบเดิมได้

## API

```text
visits.list
visits.get
visits.createDraft
visits.saveDraft
visits.submit
visits.reopen
assessments.active
assessments.saveResponses
```

## Gate ก่อน Phase 5

- [ ] ทีมคลินิกอนุมัติคำถาม ตัวเลือก required fields และ risk rules
- [ ] นำเข้าแบบประเมินครบ 9 domains ใน staging
- [ ] ทดสอบ autosave, resume, concurrent edit และ idempotency
- [ ] ทดสอบ submit เมื่อข้อมูลไม่ครบและเมื่อ HIGH/CRITICAL ไม่มีแผน
- [ ] ทดสอบ timeline และการอ่าน Visit เก่าหลังเปลี่ยน assessment version
- [ ] UAT บนมือถือในสถานการณ์เยี่ยมบ้านจริง

