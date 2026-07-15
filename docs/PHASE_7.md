# Phase 7 — Production Hardening & Go-live

## สิ่งที่ส่งมอบ

- Rate limit สำหรับ Login, authenticated requests, Upload และ Export
- Request size guard และ structured error logging
- Session cleanup automation
- Daily Spreadsheet backup พร้อม retention
- Weekly referential integrity check
- Production readiness checks และ Admin Diagnostics UI
- Maintenance trigger installer
- Content Security Policy และ no-referrer policy
- Hash routing รองรับ GitHub Pages โดยไม่เกิด 404 เมื่อ refresh
- GitHub Pages deployment workflow พร้อม test/build gate
- Production runbook, restore/rollback, incident response และ go-live checklist

## Rate limits ตั้งต้น

| กลุ่ม | จำกัด |
|---|---:|
| Login | 20 ครั้ง/username hash/10 นาที |
| Authenticated API | 120 ครั้ง/user/action/นาที |
| Upload | 30 ครั้ง/user/ชั่วโมง |
| Export | 20 ครั้ง/user/ชั่วโมง |

ปรับเกณฑ์ได้ใน `RateLimit.gs` หลัง load test โดยต้องบันทึก change decision

## Operations setup

```javascript
setOperationsConfiguration('BACKUP_FOLDER_ID', 30);
installMaintenanceTriggers();
productionReadinessCheck();
```

Production ต้องให้ `productionReadinessCheck()` คืนค่า `ready: true` ก่อน Go-live

## เอกสารประกอบ

- [Production Runbook](PRODUCTION_RUNBOOK.md)
- [Incident Response](INCIDENT_RESPONSE.md)
- [Go-live Checklist](GO_LIVE_CHECKLIST.md)

## ข้อจำกัดที่ต้องติดตาม

- Google Sheets/Apps Script มี quota และไม่ใช่ฐานข้อมูล transactional เต็มรูปแบบ ต้องติดตาม concurrency, latency และจำนวนแถวจริง
- Backup ปัจจุบันครอบคลุม Spreadsheet; Drive attachment อาศัย Drive retention/trash/version policy ขององค์กร
- Base64 upload เพิ่มขนาดข้อมูลประมาณหนึ่งในสาม จึงจำกัดไฟล์ไว้ 8 MB
- CSP ผ่าน `<meta>` ช่วยลดความเสี่ยงบางส่วน แต่ hosting ที่รองรับควรตั้ง CSP, HSTS, Permissions-Policy และ `X-Content-Type-Options` เป็น HTTP response headers ด้วย
- Malware scanning ต้องเพิ่มเมื่อองค์กรมีโครงสร้าง Cloud Run/Storage หรือบริการสแกนที่ได้รับอนุมัติ

