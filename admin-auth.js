const crypto = require("crypto");

const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_MAX_LENGTH = 128;
const PASSWORD_MIN_LENGTH = 12;

function scrypt(password, salt, keyLength = PASSWORD_KEY_LENGTH) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keyLength, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

async function createPasswordRecord(password) {
  const normalizedPassword = String(password || "");
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = await scrypt(normalizedPassword, salt);
  return {
    algorithm: "scrypt",
    salt,
    hash: hash.toString("base64url"),
    keyLength: PASSWORD_KEY_LENGTH,
  };
}

async function verifyPassword(password, record) {
  if (
    !record ||
    record.algorithm !== "scrypt" ||
    !record.salt ||
    !record.hash ||
    Number(record.keyLength) !== PASSWORD_KEY_LENGTH
  ) {
    return false;
  }

  const actualHash = await scrypt(String(password || ""), record.salt, record.keyLength);
  const expectedHash = Buffer.from(record.hash, "base64url");
  return actualHash.length === expectedHash.length && crypto.timingSafeEqual(actualHash, expectedHash);
}

function getPasswordValidationError(password, { username = "", email = "" } = {}) {
  const value = String(password || "");
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Пароль должен содержать не менее ${PASSWORD_MIN_LENGTH} символов.`;
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return `Пароль должен содержать не более ${PASSWORD_MAX_LENGTH} символов.`;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized && normalized === String(username || "").trim().toLowerCase()) {
    return "Пароль не должен совпадать с логином.";
  }
  if (normalized && normalized === String(email || "").trim().toLowerCase()) {
    return "Пароль не должен совпадать с e-mail.";
  }
  return "";
}

function hashPasswordResetToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("base64url");
}

function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, tokenHash: hashPasswordResetToken(token) };
}

function verifyPasswordResetToken(reset, token, now = Date.now()) {
  if (!reset?.tokenHash || !reset?.expiresAt || Date.parse(reset.expiresAt) <= now) {
    return false;
  }
  return safeEqual(reset.tokenHash, hashPasswordResetToken(token));
}

function normalizeAdminAuthState(source = {}) {
  const password = source.password && source.password.algorithm === "scrypt"
    ? {
        algorithm: "scrypt",
        salt: String(source.password.salt || ""),
        hash: String(source.password.hash || ""),
        keyLength: PASSWORD_KEY_LENGTH,
      }
    : null;
  const reset = source.reset?.tokenHash && source.reset?.expiresAt
    ? {
        tokenHash: String(source.reset.tokenHash),
        requestedAt: String(source.reset.requestedAt || ""),
        expiresAt: String(source.reset.expiresAt),
      }
    : null;

  return {
    version: 1,
    password,
    sessionVersion: Math.max(1, Number(source.sessionVersion) || 1),
    reset,
    createdAt: String(source.createdAt || new Date().toISOString()),
    updatedAt: String(source.updatedAt || new Date().toISOString()),
  };
}

module.exports = {
  createPasswordRecord,
  createPasswordResetToken,
  getPasswordValidationError,
  hashPasswordResetToken,
  normalizeAdminAuthState,
  verifyPassword,
  verifyPasswordResetToken,
};
