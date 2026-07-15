# Phase 2 — Login, Session และ RBAC

## สิ่งที่ส่งมอบ

- Username/password login ผ่าน Apps Script API
- Password hash แบบ salted iterative SHA-256 พร้อม server-side pepper
- Session token เก็บเฉพาะ hash ใน `SESSIONS`, อายุ 8 ชั่วโมง และ revoke เมื่อ logout
- ล็อกบัญชี 15 นาทีเมื่อผิด 5 ครั้ง
- API `auth.login`, `auth.me`, `auth.logout`, `auth.changePassword`, `auth.permissions`
- RBAC 6 roles และ scope ตาม organization/service unit/area/team
- React AuthContext, sessionStorage, ProtectedRoute, Login UI, บังคับเปลี่ยนรหัสผ่านเริ่มต้น และ logout
- Audit events สำหรับ login/logout/bootstrap
- Bootstrap Super Admin และ migration `migrateToV020()`

## ติดตั้งจาก Phase 1 เดิม

1. อัปโหลดไฟล์ `.gs` ใหม่ทั้งหมด
2. รัน `migrateToV020()` หนึ่งครั้ง
3. รัน `generateAuthPepper()` หนึ่งครั้ง
4. รัน `createInitialSuperAdmin('admin', 'รหัสผ่านที่แข็งแรง', 'ผู้ดูแลระบบ', 'ORG_ID', 'email')`
5. Deploy Apps Script เป็น version ใหม่
6. ทดสอบ login และตรวจ `AUDIT_LOGS`

รหัสผ่านขั้นต่ำ 12 ตัว ต้องมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลข ห้ามใส่รหัสผ่านจริงลง source code หรือ log

## Gate ก่อน Phase 3

- [ ] ผู้รับผิดชอบอนุมัติ permission matrix
- [ ] ทดสอบ 6 roles ทั้ง allowed/denied actions
- [ ] ทดสอบ session expiry, logout และ lockout
- [ ] เปลี่ยนรหัสผ่าน bootstrap และกำหนดกระบวนการ reset password
- [ ] ยืนยัน organization/service unit/area/team scope
