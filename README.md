# INHOMESSS Home Visit Platform

Production candidate v1.0.0: ระบบเยี่ยมบ้าน INHOMESSS ครบ Phase 1–7 พร้อม security, backup, monitoring และ go-live controls

## โครงสร้าง

```text
inhomesss-home-visit/
├── src/                  React TypeScript frontend
├── apps-script/          Apps Script backend และ Sheet initializer
├── docs/                 deployment, migration และ phase notes
├── .env.example
└── package.json
```

## เริ่ม Frontend

```bash
npm install
cp .env.example .env
npm run dev
```

แก้ `.env` ให้ `VITE_API_BASE_URL` เป็น Apps Script deployment URL จริง ส่วน GitHub Pages ให้กำหนด `VITE_BASE_PATH=/repository-name/` ก่อน build

## ตรวจสอบ

```bash
npm run test
npm run build
```

## Backend

อ่าน [apps-script/README.md](apps-script/README.md) แล้วตั้ง Script Properties, รัน `initializeSystem()` และ deploy Web App

## ขอบเขตเวอร์ชันนี้

- มี Login, Patient Registry, Visit Wizard, Care Continuity, Documents/Consent, Dashboard, Follow-up Queue, Reports และ Export
- มี Schema 29 Sheets พร้อม seed settings/INHOMESSS domains
- มี Session อายุ 8 ชั่วโมง, lockout, RBAC 6 roles และ scope guard ฝั่ง server
- รองรับค้นหา/เพิ่ม/แก้ไข/archive ผู้ป่วย และเพิ่มผู้ดูแล โดย CID ไม่เก็บ plaintext
- รองรับแบบประเมิน INHOMESSS แบบ dynamic/versioned โดยไม่ hard-code คำถามที่ยังไม่ผ่านอนุมัติทางคลินิก

อ่านขั้นตอนติดตั้งเพิ่มเติมที่ [docs/PHASE_2.md](docs/PHASE_2.md)

ตั้งค่า Patient Registry และ Cloud KMS ตาม [docs/PHASE_3.md](docs/PHASE_3.md)

ตั้งค่า Visit และนำเข้าแบบประเมินตาม [docs/PHASE_4.md](docs/PHASE_4.md)

ตั้งค่าการดูแลต่อเนื่องตาม [docs/PHASE_5.md](docs/PHASE_5.md)

ตั้งค่าไฟล์แนบ Dashboard และ Reports ตาม [docs/PHASE_6.md](docs/PHASE_6.md)

เตรียม Production ตาม [docs/PHASE_7.md](docs/PHASE_7.md) และ [Production Runbook](docs/PRODUCTION_RUNBOOK.md)
