# Go-live Checklist

- [ ] Blueprint/แบบประเมิน INHOMESSS ได้รับอนุมัติทางคลินิก
- [ ] PDPA notice, legal basis, consent และ retention ได้รับอนุมัติ
- [ ] Production ใช้ Spreadsheet/Drive/KMS แยกจาก dev/staging
- [ ] Script Properties ครบและไม่มี secret ใน source/Sheet
- [ ] `productionReadinessCheck().ready === true`
- [ ] Schema และ integrity ผ่าน
- [ ] Backup/restore drill ผ่านและระบุผู้อนุมัติ restore
- [ ] Maintenance triggers ติดตั้งครบ
- [ ] RBAC × scope tests ครบทุก role
- [ ] CID/HN duplicate, KMS และ masking tests ผ่าน
- [ ] File type/size/access/consent tests ผ่าน
- [ ] Autosave/idempotency/concurrent edit tests ผ่าน
- [ ] Dashboard/report/export ไม่รั่วข้อมูลข้าม scope
- [ ] Mobile UAT และ accessibility checks ผ่าน
- [ ] มีผู้รับผิดชอบ monitoring, incident และ support
- [ ] มี rollback version ทั้ง Frontend และ Backend
- [ ] ผู้ใช้งานได้รับการอบรมและลงนามรับทราบการรักษาความลับ

