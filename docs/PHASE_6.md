# Phase 6 — Attachments, Consent, Dashboard, Reports & Export

## สิ่งที่ส่งมอบ

- Consent lifecycle: `GRANTED`, `REFUSED`, `WITHDRAWN`, `NOT_REQUIRED`
- Secure attachment upload ไปยัง private Google Drive folder
- Allowlist JPG, PNG, WEBP, PDF และตรวจ file signature/ขนาดสูงสุด 8 MB
- ผูกไฟล์กับ Patient, Visit และ Consent
- Access level: `CARE_TEAM`, `CLINICIAN_ONLY`, `ADMIN_ONLY`
- เปิดไฟล์ผ่าน authenticated API เท่านั้น ไม่สร้าง public link
- Archive/Trash พร้อมเหตุผลและ Audit Log
- Dashboard summary ตาม role/scope
- Visit report กรองช่วงวันที่ สูงสุด 500 รายการต่อคำขอ
- Controlled CSV export พร้อม Audit Log

## API

```text
consents.list
consents.upsert
attachments.list
attachments.upload
attachments.getContent
attachments.archive
dashboard.summary
reports.visits
reports.export
```

## การตั้งค่า

1. สร้าง Google Drive folder สำหรับไฟล์จริงและตั้งเป็น private
2. ให้บัญชีที่ Deploy Apps Script เป็นผู้จัดการ folder
3. ตั้ง `DRIVE_FOLDER_ID` ใน Script Properties
4. อัปโหลด Apps Script version 0.6.0 และ Deploy ใหม่
5. ทดสอบ Consent → Upload → Download → Audit

Phase 6 ไม่เพิ่ม Sheet/Column และไม่ต้องรัน migration ใหม่

## Security controls

- Browser ส่ง Base64 ผ่าน authenticated request; Backend ตรวจ MIME allowlist, magic bytes และขนาดอีกครั้ง
- ชื่อไฟล์ใน Drive ใช้ UUID ไม่ใช้ชื่อผู้ป่วย/HN/CID
- Sheet เก็บเฉพาะ Drive file ID และ metadata
- ไฟล์ไม่ถูกแชร์ public; content ถูกอ่านผ่าน Backend หลังตรวจ RBAC/scope/access level
- SHA-256 ใช้ตรวจเอกลักษณ์ไฟล์ ไม่ใช้แทนการสแกนมัลแวร์
- Production ควรเพิ่ม malware scanning pipeline หากรับเอกสารจากแหล่งภายนอกจำนวนมาก
- Export ส่งเฉพาะคอลัมน์ที่กำหนดและบันทึกจำนวนแถวใน Audit Log

## Gate ก่อน Phase 7

- [ ] ทดสอบไฟล์ปลอม extension, magic bytes ผิด และเกิน 8 MB
- [ ] ทดสอบ WITHDRAWN/หมดอายุ consent แล้วอัปโหลดต้องถูกปฏิเสธ
- [ ] ทดสอบ CARE_TEAM/CLINICIAN_ONLY/ADMIN_ONLY ครบทุก role
- [ ] ตรวจ Drive ไม่มี public sharing
- [ ] ตรวจ Dashboard/Report ไม่เห็นข้อมูลข้าม scope
- [ ] ทดสอบ CSV ภาษาไทยและ spreadsheet formula safety ที่ระบบปลายทาง
- [ ] อนุมัติ retention, malware scanning และ secure disposal policy

