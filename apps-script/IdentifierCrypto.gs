function normalizeCid_(cid) { return String(cid || '').replace(/\D/g, ''); }

function validateCid_(cid) {
  const value = normalizeCid_(cid);
  if (!/^\d{13}$/.test(value)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i += 1) sum += Number(value.charAt(i)) * (13 - i);
  return (11 - (sum % 11)) % 10 === Number(value.charAt(12));
}

function hashCidForLookup_(cid) {
  const value = normalizeCid_(cid);
  if (!validateCid_(value)) throw createAppError_('VALIDATION_ERROR', 'เลขประจำตัวประชาชนไม่ถูกต้อง');
  const key = PropertiesService.getScriptProperties().getProperty('CID_LOOKUP_HMAC_KEY');
  if (!key || key.length < 32) throw createAppError_('CRYPTO_NOT_CONFIGURED', 'ยังไม่ได้ตั้งค่า CID lookup key');
  return bytesToHex_(Utilities.computeHmacSha256Signature(value, key, Utilities.Charset.UTF_8));
}

function encryptCid_(cid, patientId, organizationId) {
  const value = normalizeCid_(cid);
  if (!validateCid_(value)) throw createAppError_('VALIDATION_ERROR', 'เลขประจำตัวประชาชนไม่ถูกต้อง');
  const keyName = PropertiesService.getScriptProperties().getProperty('KMS_CRYPTO_KEY_NAME');
  if (!keyName || !/^projects\/.+\/locations\/.+\/keyRings\/.+\/cryptoKeys\/.+$/.test(keyName)) {
    throw createAppError_('CRYPTO_NOT_CONFIGURED', 'ยังไม่ได้ตั้งค่า Google Cloud KMS key');
  }
  const aad = Utilities.base64Encode(patientId + ':' + organizationId);
  const response = UrlFetchApp.fetch('https://cloudkms.googleapis.com/v1/' + keyName + ':encrypt', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({ plaintext: Utilities.base64Encode(value), additionalAuthenticatedData: aad })
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    console.error(JSON.stringify({ event: 'KMS_ENCRYPT_FAILED', status: response.getResponseCode() }));
    throw createAppError_('CRYPTO_ERROR', 'ไม่สามารถปกป้องเลขประจำตัวประชาชนได้');
  }
  const result = JSON.parse(response.getContentText());
  if (!result.ciphertext) throw createAppError_('CRYPTO_ERROR', 'KMS ไม่ส่ง ciphertext กลับมา');
  return 'gcp-kms-v1:' + result.ciphertext;
}

function maskCidLast4_(last4) { return 'x-xxxx-xxxxx-' + String(last4 || 'xxxx').slice(-2) + '-x'; }

function createAppError_(code, message) { const error = new Error(message); error.code = code; return error; }

function generateCidLookupKey() {
  const key = Array.from({ length: 6 }, function () { return Utilities.getUuid(); }).join('');
  PropertiesService.getScriptProperties().setProperty('CID_LOOKUP_HMAC_KEY', key);
  return { configured: true, message: 'สร้าง CID_LOOKUP_HMAC_KEY แล้ว' };
}

function setKmsCryptoKeyName(keyName) {
  if (!/^projects\/.+\/locations\/.+\/keyRings\/.+\/cryptoKeys\/.+$/.test(String(keyName || ''))) throw new Error('INVALID_KMS_KEY_NAME');
  PropertiesService.getScriptProperties().setProperty('KMS_CRYPTO_KEY_NAME', String(keyName));
  return { configured: true };
}

