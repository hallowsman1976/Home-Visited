# Apps Script Backend

## ติดตั้ง

1. สร้าง Google Spreadsheet เปล่าสำหรับ environment นี้
2. สร้าง Standalone Apps Script project และเพิ่มไฟล์ `.gs` กับ `appsscript.json` ในโฟลเดอร์นี้
3. Project Settings → Script Properties เพิ่ม `SPREADSHEET_ID`, `APP_ENV` และ `DRIVE_FOLDER_ID` (ถ้ามี)
4. ใน Editor รัน `initializeSystem()` หนึ่งครั้งและอนุญาตสิทธิ์
5. รัน `validateSystemSchema()` และตรวจว่าทุก Sheet มี `ok: true`
6. Deploy → New deployment → Web app → Execute as me และกำหนด access ตามสถาปัตยกรรมขององค์กร
7. เปิด URL ด้วย `?action=health` ต้องได้ JSON ที่ `ok: true`

> ค่า `access: ANYONE` ใน manifest ใช้เพื่อรองรับ Frontend ภายนอกใน Phase 1 เท่านั้น ก่อน production ต้องใช้ session/RBAC ใน Phase 2 และทบทวน deployment policy ของหน่วยงาน

## การใช้ clasp (ทางเลือก)

สร้าง `.clasp.json` ในโฟลเดอร์ `apps-script` โดยไม่ commit:

```json
{ "scriptId": "YOUR_SCRIPT_ID", "rootDir": "." }
```

จากนั้นใช้ `clasp push` และ deploy/version ตามขั้นตอนของทีม

