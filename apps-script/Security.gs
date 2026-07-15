const SECURITY_CONFIG = Object.freeze({
  PASSWORD_ROUNDS: 4000,
  SESSION_TTL_SECONDS: 8 * 60 * 60,
  MAX_FAILED_LOGINS: 5,
  LOCK_MINUTES: 15,
  TOKEN_BYTES: 32,
});

function normalizeUsername_(username) {
  return String(username || '').trim().toLowerCase();
}

function requireAuthSecrets_() {
  const properties = PropertiesService.getScriptProperties();
  const pepper = properties.getProperty('AUTH_PEPPER');
  if (!pepper || pepper.length < 32) throw new Error('AUTH_PEPPER_NOT_CONFIGURED');
  return pepper;
}

function createPasswordHash_(password) {
  validatePasswordPolicy_(password);
  const salt = createSecureToken_().slice(0, 32);
  return 'v1$' + SECURITY_CONFIG.PASSWORD_ROUNDS + '$' + salt + '$' + derivePasswordHash_(password, salt, SECURITY_CONFIG.PASSWORD_ROUNDS);
}

function verifyPassword_(password, encodedHash) {
  const parts = String(encodedHash || '').split('$');
  if (parts.length !== 4 || parts[0] !== 'v1') return false;
  const rounds = Number(parts[1]);
  if (!Number.isInteger(rounds) || rounds < 1000 || rounds > 20000) return false;
  const candidate = derivePasswordHash_(password, parts[2], rounds);
  return constantTimeEquals_(candidate, parts[3]);
}

function derivePasswordHash_(password, salt, rounds) {
  const pepper = requireAuthSecrets_();
  let value = salt + ':' + String(password) + ':' + pepper;
  for (let i = 0; i < rounds; i += 1) {
    value = bytesToHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8));
  }
  return value;
}

function validatePasswordPolicy_(password) {
  const value = String(password || '');
  if (value.length < 12 || !/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9]/.test(value)) {
    throw new Error('PASSWORD_POLICY');
  }
}

function createSecureToken_() {
  const source = Array.from({ length: 4 }, function () { return Utilities.getUuid(); }).join(':') + ':' + new Date().getTime();
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, source)).replace(/=+$/g, '');
}

function hashToken_(token) {
  return bytesToHex_(Utilities.computeHmacSha256Signature(String(token), requireAuthSecrets_(), Utilities.Charset.UTF_8));
}

function bytesToHex_(bytes) {
  return bytes.map(function (byte) { const value = byte < 0 ? byte + 256 : byte; return ('0' + value.toString(16)).slice(-2); }).join('');
}

function constantTimeEquals_(left, right) {
  const a = String(left || '');
  const b = String(right || '');
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function addSeconds_(date, seconds) { return new Date(date.getTime() + seconds * 1000); }

