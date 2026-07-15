# Phase 1 — Foundation

## สิ่งที่ส่งมอบ

- React 18 + TypeScript + Vite + Tailwind design system แบบ mobile-first
- Responsive sidebar/bottom navigation และ Dashboard health status
- API client พร้อม standard envelope/error handling
- Apps Script GET/POST router และ health action
- Script Properties configuration
- Schema initializer 29 Sheets, conflict guard, formatting และ seed data
- Environment example, deployment guide, test และ production build

## Gate ก่อน Phase 2

- [ ] Apps Script health URL ใช้งานจาก Frontend origin จริง
- [ ] `initializeSystem()` สร้าง Sheets ครบ 29 รายการ
- [ ] `validateSystemSchema()` ผ่านทั้งหมด
- [ ] แยก Spreadsheet สำหรับ dev/staging/prod
- [ ] ตัดสินวิธี Login/Identity Provider
- [ ] อนุมัติ permission matrix และ session lifetime
