function validatePatientPayload_(payload, partial) {
  const errors = {};
  if (!partial || payload.hn !== undefined) {
    const hn = String(payload.hn || '').trim();
    if (!hn || hn.length > 30 || !/^[A-Za-z0-9._/-]+$/.test(hn)) errors.hn = 'HN ไม่ถูกต้อง';
  }
  if (!partial || payload.firstName !== undefined) if (!String(payload.firstName || '').trim()) errors.firstName = 'กรุณากรอกชื่อ';
  if (!partial || payload.lastName !== undefined) if (!String(payload.lastName || '').trim()) errors.lastName = 'กรุณากรอกนามสกุล';
  if (payload.cid && !validateCid_(payload.cid)) errors.cid = 'เลขประจำตัวประชาชนไม่ถูกต้อง';
  if (payload.birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(String(payload.birthDate))) errors.birthDate = 'วันที่เกิดไม่ถูกต้อง';
  if (payload.phone && !/^[0-9+ -]{8,20}$/.test(String(payload.phone))) errors.phone = 'เบอร์โทรศัพท์ไม่ถูกต้อง';
  if (payload.latitude !== undefined && payload.latitude !== '' && (Number(payload.latitude) < -90 || Number(payload.latitude) > 90)) errors.latitude = 'ละติจูดไม่ถูกต้อง';
  if (payload.longitude !== undefined && payload.longitude !== '' && (Number(payload.longitude) < -180 || Number(payload.longitude) > 180)) errors.longitude = 'ลองจิจูดไม่ถูกต้อง';
  return errors;
}

function safeCellText_(value, maxLength) {
  let text = String(value === undefined || value === null ? '' : value).trim().slice(0, maxLength || 5000);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}

