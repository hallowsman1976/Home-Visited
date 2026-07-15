# Phase 3 — Patient Registry

## สิ่งที่ส่งมอบ

- ค้นหาผู้ป่วยด้วย HN, ชื่อ–นามสกุล, โทรศัพท์ หรือ CID 13 หลัก
- ตรวจ checksum CID ทั้ง Frontend และ Backend
- CID lookup ด้วย HMAC-SHA-256 และเข้ารหัสด้วย Google Cloud KMS ก่อนบันทึก
- `patients.search`, `patients.get`, `patients.create`, `patients.update`, `patients.archive`
- เพิ่มและแสดงผู้ดูแลผ่าน `caregivers.add`
- ตรวจ permission และ organization/service unit/area/team scope ฝั่ง server
- ป้องกัน HN/CID ซ้ำ, Spreadsheet formula injection และ concurrent update ด้วย `row_version`
- Mask CID ใน API/UI และไม่บันทึก CID ลง Audit Log
- Patient Registry UI, ฟอร์มลงทะเบียน, Patient Summary และ Caregiver panel

## ตั้งค่า Cloud KMS

1. เชื่อม Apps Script กับ Standard Google Cloud Project
2. เปิด Cloud KMS API
3. สร้าง Key Ring และ symmetric key ประเภท `ENCRYPT_DECRYPT`
4. ให้ principal ที่รัน Apps Script มีสิทธิ์ `cloudkms.cryptoKeyVersions.useToEncrypt` และ `useToDecrypt`
5. รัน `generateCidLookupKey()` หนึ่งครั้ง
6. รัน `setKmsCryptoKeyName('projects/PROJECT/locations/LOCATION/keyRings/RING/cryptoKeys/KEY')`
7. Deploy version ใหม่และอนุมัติ OAuth scopes

ระบบใช้ KMS `cryptoKeys.encrypt` โดยผูก Additional Authenticated Data กับ `patientId:organizationId` และเก็บ ciphertext นำหน้าด้วย `gcp-kms-v1:` ส่วนการค้นหาใช้ deterministic HMAC ซึ่งไม่สามารถถอดกลับเป็น CID ได้

## API ตัวอย่าง

```json
{
  "action": "patients.create",
  "requestId": "uuid",
  "sessionToken": "token",
  "payload": {
    "hn": "0012345",
    "cid": "เลข 13 หลัก",
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "birthDate": "1960-01-15",
    "riskLevel": "LOW"
  }
}
```

## Gate ก่อน Phase 4

- [ ] Cloud KMS encrypt test ผ่านใน dev/staging
- [ ] ทดสอบ duplicate HN และ CID
- [ ] ทดสอบ scope ข้ามหน่วยงาน/พื้นที่แล้วต้องถูกปฏิเสธ
- [ ] ตรวจ Audit Log ว่าไม่มี CID หรือข้อมูลคลินิกเต็ม
- [ ] UAT ฟอร์มข้อมูลผู้ป่วยและผู้ดูแล
- [ ] ยืนยันรายการคำถาม INHOMESSS และเวอร์ชันแบบประเมิน

## อ้างอิงทางเทคนิค

- Google Cloud KMS encrypt: https://cloud.google.com/kms/docs/reference/rest/v1/projects.locations.keyRings.cryptoKeys/encrypt
- Google Cloud KMS decrypt: https://cloud.google.com/kms/docs/reference/rest/v1/projects.locations.keyRings.cryptoKeys/decrypt

