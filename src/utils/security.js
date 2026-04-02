export const STORAGE_KEYS = {
  pinHash: 'spent_pin_hash',
  legacyTfa: 'spent_2fa',
  lastActive: 'spent_last_active',
  failedAttempts: 'spent_failed_attempts',
  lockoutUntil: 'spent_lockout_until',
  transactions: 'spent_transactions',
};

export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
export const MAX_PIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 5 * 60 * 1000;

const textEncoder = new TextEncoder();

const safeParseJson = (value) => {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const sanitizePin = (value) => {
  return String(value ?? '').replace(/\D/g, '').slice(0, 6);
};

const getLegacyPin = () => {
  const parsed = safeParseJson(localStorage.getItem(STORAGE_KEYS.legacyTfa));

  if (parsed && typeof parsed.pin === 'string') {
    return sanitizePin(parsed.pin);
  }

  return null;
};

export const hasConfiguredPin = () => {
  const storedHash = localStorage.getItem(STORAGE_KEYS.pinHash);
  return Boolean(storedHash || getLegacyPin());
};

const toHex = (buffer) => {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const hashPin = async (pin) => {
  const normalizedPin = sanitizePin(pin);
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    textEncoder.encode(normalizedPin),
  );

  return toHex(digest);
};

export const savePinHash = async (pin) => {
  const pinHash = await hashPin(pin);
  localStorage.setItem(STORAGE_KEYS.pinHash, pinHash);
  localStorage.removeItem(STORAGE_KEYS.legacyTfa);
};

export const verifyPin = async (pin) => {
  const normalizedPin = sanitizePin(pin);
  const storedHash = localStorage.getItem(STORAGE_KEYS.pinHash);

  if (storedHash) {
    const candidateHash = await hashPin(normalizedPin);
    return candidateHash === storedHash;
  }

  const legacyPin = getLegacyPin();
  if (!legacyPin) return false;

  const isMatch = normalizedPin === legacyPin;
  if (isMatch) {
    await savePinHash(normalizedPin);
  }

  return isMatch;
};

export const getFailedAttempts = () => {
  const parsed = Number(localStorage.getItem(STORAGE_KEYS.failedAttempts));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const setFailedAttempts = (attempts) => {
  localStorage.setItem(
    STORAGE_KEYS.failedAttempts,
    String(Math.max(0, attempts)),
  );
};

export const resetFailedAttempts = () => {
  localStorage.removeItem(STORAGE_KEYS.failedAttempts);
};

export const getLockoutUntil = () => {
  const parsed = Number(localStorage.getItem(STORAGE_KEYS.lockoutUntil));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const setLockoutUntil = (timestampMs) => {
  localStorage.setItem(STORAGE_KEYS.lockoutUntil, String(timestampMs));
};

export const clearLockout = () => {
  localStorage.removeItem(STORAGE_KEYS.lockoutUntil);
};
