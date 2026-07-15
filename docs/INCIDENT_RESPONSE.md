# Incident Response

## ระดับเหตุการณ์

- SEV-1: ข้อมูลสุขภาพรั่วไหล ระบบถูกยึด หรือข้อมูลสูญหายวงกว้าง
- SEV-2: ผู้ใช้เห็นข้อมูลข้าม scope, KMS/Drive ผิดสิทธิ์, ระบบเขียนข้อมูลผิดจำนวนมาก
- SEV-3: ฟังก์ชันบางส่วนล้มเหลว ไม่มีผลต่อความลับหรือความถูกต้องหลัก

## ขั้นตอนตอบสนอง

1. Contain: ปิด deployment/revoke session/ลด Drive permission ตามความจำเป็น
2. Preserve: เก็บ Cloud logs, Audit Logs, deployment version และเวลา ห้ามแก้ log ต้นฉบับ
3. Assess: ระบุผู้ได้รับผลกระทบ ข้อมูล ประเภทการเข้าถึง และช่วงเวลา
4. Eradicate: หมุน AUTH_PEPPER/token, ปิดบัญชี, แก้ permission/code และทบทวน KMS access
5. Recover: Restore/Deploy ผ่าน staging, readiness, integrity และ role tests
6. Notify: ดำเนินการตามนโยบาย PDPA และคำสั่งผู้ควบคุมข้อมูลของหน่วยงาน
7. Learn: สรุป RCA, corrective actions, owner และ due date

ห้ามใส่ CID, token, password, full clinical narrative หรือไฟล์ผู้ป่วยลง incident chat/email ที่ไม่ใช่ช่องทางอนุมัติ

