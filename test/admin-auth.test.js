const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createPasswordRecord,
  createPasswordResetToken,
  getPasswordValidationError,
  normalizeAdminAuthState,
  verifyPassword,
  verifyPasswordResetToken,
} = require("../admin-auth");

test("stores an admin password as a scrypt hash and verifies it", async () => {
  const password = "A-long-admin-password-2026";
  const record = await createPasswordRecord(password);

  assert.equal(record.algorithm, "scrypt");
  assert.notEqual(record.hash, password);
  assert.equal(JSON.stringify(record).includes(password), false);
  assert.equal(await verifyPassword(password, record), true);
  assert.equal(await verifyPassword("wrong-password", record), false);
});

test("accepts only the current unexpired reset token", () => {
  const { token, tokenHash } = createPasswordResetToken();
  const now = Date.now();
  const reset = {
    tokenHash,
    requestedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 60_000).toISOString(),
  };

  assert.equal(verifyPasswordResetToken(reset, token, now), true);
  assert.equal(verifyPasswordResetToken(reset, `${token}changed`, now), false);
  assert.equal(verifyPasswordResetToken(reset, token, now + 60_001), false);
  assert.equal(verifyPasswordResetToken(null, token, now), false);
});

test("requires a strong new password that differs from admin identifiers", () => {
  const context = { username: "admin", email: "admin@example.com" };

  assert.match(getPasswordValidationError("short", context), /не менее 12/);
  assert.match(getPasswordValidationError("admin", context), /не менее 12/);
  assert.match(getPasswordValidationError("admin@example.com", context), /не должен совпадать с e-mail/);
  assert.equal(getPasswordValidationError("Reliable-password-2026", context), "");
});

test("normalizes persisted auth state and keeps session version", () => {
  const state = normalizeAdminAuthState({ sessionVersion: 7, reset: null });

  assert.equal(state.version, 1);
  assert.equal(state.sessionVersion, 7);
  assert.equal(state.password, null);
  assert.equal(state.reset, null);
});
