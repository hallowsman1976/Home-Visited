# Production Runbook

## 1. Environment separation

ใช้ Apps Script project, Spreadsheet, Drive folder, KMS key และ deployment แยกกันสำหรับ `development`, `staging`, `production` ห้ามใช้ข้อมูลผู้ป่วยจริงใน development

## 2. Script Properties ที่ต้องมี

```text
APP_ENV=production
SPREADSHEET_ID=...
DRIVE_FOLDER_ID=...
BACKUP_FOLDER_ID=...
BACKUP_RETENTION_DAYS=30
AUTH_PEPPER=...
CID_LOOKUP_HMAC_KEY=...
KMS_CRYPTO_KEY_NAME=projects/.../cryptoKeys/...
```

## 3. Pre-deployment

1. รัน migration ตามลำดับ `migrateToV020()` และ `migrateToV040()` เฉพาะ environment ที่ต้องการ
2. รัน `validateSystemSchema()`
3. รัน `verifyDataIntegrity()`
4. รัน `productionReadinessCheck()` ต้องได้ `ready: true`
5. รัน `createSpreadsheetBackup()` ก่อน deploy
6. Deploy Apps Script เป็น version ใหม่ ห้ามแก้ deployment production แบบทับโดยไม่มี version
7. Build Frontend ด้วย production API URL
8. ทดสอบ smoke test ด้วยบัญชีทดสอบทุก role

## 4. Maintenance automation

รันครั้งเดียวหลัง Deploy:

```javascript
setOperationsConfiguration('BACKUP_FOLDER_ID', 30);
installMaintenanceTriggers();
```

Triggers:

- Session cleanup ทุก 6 ชั่วโมง
- Spreadsheet backup ทุกวันประมาณ 02:00 น.
- Referential integrity check ทุกวันอาทิตย์ประมาณ 03:00 น.

## 5. Restore procedure

การ Restore มีผลต่อข้อมูลจริง จึงไม่ทำอัตโนมัติ:

1. ประกาศ maintenance และหยุดการเขียนข้อมูล
2. สร้าง backup ของฐานปัจจุบันก่อนเสมอ
3. เลือก backup ตาม timestamp และตรวจ metadata source/environment
4. ทำสำเนา backup ไปเป็น Spreadsheet ใหม่ ห้ามเขียนทับต้นฉบับทันที
5. ตั้ง `SPREADSHEET_ID` ของ staging ให้ชี้สำเนาและรัน schema/integrity/UAT
6. เมื่อผู้มีอำนาจอนุมัติ จึงเปลี่ยน production `SPREADSHEET_ID`
7. Deploy version ใหม่ ทดสอบ smoke test และบันทึก change/audit ticket

## 6. Rollback

- Backend: เปลี่ยน Apps Script deployment กลับ version ก่อนหน้า
- Frontend: redeploy Git commit/release ก่อนหน้า
- Schema: ใช้ forward fix เป็นหลัก; Restore เฉพาะเมื่อผ่าน incident approval
- KMS: ห้ามทำลาย key version ที่ยังใช้ถอดข้อมูลเก่า

