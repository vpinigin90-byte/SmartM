const { URL } = require("url");

const MAX_EXTERNAL_MEETING_URL_LENGTH = 2048;

function createValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function normalizeExternalMeetingUrl(value) {
  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return "";
  }
  if (rawValue.length > MAX_EXTERNAL_MEETING_URL_LENGTH) {
    throw createValidationError("Ссылка на встречу слишком длинная.");
  }

  let parsed;
  try {
    parsed = new URL(rawValue);
  } catch {
    throw createValidationError("Укажите корректную ссылку на встречу.");
  }

  if (parsed.protocol !== "https:") {
    throw createValidationError("Ссылка на встречу должна использовать HTTPS.");
  }
  if (!parsed.hostname || parsed.username || parsed.password) {
    throw createValidationError("Укажите безопасную ссылку на встречу без логина и пароля.");
  }

  return parsed.toString();
}

function shouldCreateMtsLink(booking, settings) {
  return Boolean(settings?.enabled && !booking?.externalMeetingUrl);
}

module.exports = {
  MAX_EXTERNAL_MEETING_URL_LENGTH,
  normalizeExternalMeetingUrl,
  shouldCreateMtsLink,
};
