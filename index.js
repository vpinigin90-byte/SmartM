const fs = require("fs/promises");
const http = require("http");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const HOST = "0.0.0.0";
const PORT = Number(process.env.PORT) || 3000;
const MAIL_RU_CALDAV_URLS = [
  "https://calendar.mail.ru/",
  "https://calendar.mail.ru/.well-known/caldav",
];
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = process.env.DATA_DIR || "/data";
const CONFIG_PATH = path.join(DATA_DIR, "smartm-config.json");
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? "" : "Zz123456");
const SESSION_COOKIE = "smartm_admin";
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("base64url");
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const CSRF_HEADER = "x-csrf-token";
const MASKED_SECRET = "********";
const MAX_JSON_BODY_BYTES = Number(process.env.MAX_JSON_BODY_BYTES) || 1024 * 1024;
const MAX_PUBLIC_RANGE_DAYS = Number(process.env.MAX_PUBLIC_RANGE_DAYS) || 45;
const MAX_ADMIN_RANGE_DAYS = Number(process.env.MAX_ADMIN_RANGE_DAYS) || 120;
const LOGIN_RATE_LIMIT = { limit: 8, windowMs: 15 * 60 * 1000 };
const PUBLIC_RATE_LIMIT = { limit: 60, windowMs: 10 * 60 * 1000 };
const MTS_LINK_ALLOWED_HOSTS = new Set(
  String(process.env.MTS_LINK_ALLOWED_HOSTS || "userapi.mts-link.ru")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);
const rateLimitBuckets = new Map();
const PUBLIC_DEMO_DURATION_MINUTES = 60;
const PUBLIC_DEMO_GAP_MINUTES = 30;
const DEFAULT_SLOT_RULES = {
  allowedStartTime: "09:00",
  allowedEndTime: "18:00",
  timeZone: "Europe/Moscow",
  excludedDates: [],
};
const DEFAULT_MTS_LINK_SETTINGS = {
  enabled: false,
  accountMode: "shared",
  baseUrl: "https://userapi.mts-link.ru/v3",
  accessToken: "",
  organizerName: "Команда Scrolltool",
  defaultRoomTitleTemplate: "Демо Scrolltool для {{companyName}}",
  defaultRoomDescriptionTemplate:
    "Клиент: {{clientName}}\nE-mail: {{clientEmail}}\nКомпания: {{companyName}}\nДолжность: {{position}}\nСотрудник: {{employeeName}}\nНачало: {{start}}\nОкончание: {{end}}",
  timeZone: "Europe/Moscow",
  defaultDurationMinutes: 60,
  insertLinkIntoLocation: true,
  insertLinkIntoDescription: true,
  appendMeetingMetaToDescription: true,
  fallbackWithoutLink: true,
  failureWarningText: "MTS Link недоступен, бронь создана без ссылки.",
  requestTimeoutMs: 15000,
  lastTestAt: null,
  lastTestStatus: null,
  lastTestMessage: "",
  lastSuccessMeeting: null,
};
const MTS_LINK_TEMPLATE_VARIABLES = new Set([
  "clientName",
  "clientEmail",
  "companyName",
  "position",
  "start",
  "end",
  "employeeName",
  "organizerName",
]);
const ALLOWED_FONT_FAMILIES = new Set([
  'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
  '"Mulish", "Segoe UI", Arial, sans-serif',
  'Arial, "Helvetica Neue", Helvetica, sans-serif',
  'Verdana, Geneva, sans-serif',
  'Tahoma, "Segoe UI", sans-serif',
  '"Trebuchet MS", Arial, sans-serif',
  'Georgia, "Times New Roman", serif',
]);
const DEFAULT_APPEARANCE_SETTINGS = {
  fontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
  pageBackground: '#f7f7f5',
  cardBackground: '#ffffff',
  textColor: '#18181b',
  mutedTextColor: '#71717a',
  heroBackground: '#ffffff',
  heroTitleColor: '#18181b',
  heroLeadColor: '#71717a',
  heroTitleSize: 38,
  bodyTextSize: 13,
  panelRadius: 14,
  dateTextColor: '#18181b',
  weekdayTextColor: '#9ca3af',
  dateMutedColor: '#71717a',
  dateHoverBackground: '#f4f4f2',
  dateActiveBackground: '#efe9ff',
  dateActiveTextColor: '#5b3fd8',
  dateButtonHeight: 54,
  timeBackground: '#ffffff',
  timeTextColor: '#18181b',
  timeBorderColor: '#e4e4e7',
  timeActiveBackground: '#ecf7f0',
  timeActiveTextColor: '#14532d',
  timeActiveBorderColor: '#14532d',
  timeButtonHeight: 56,
  formGradientStart: '#0b314d',
  formGradientMid: '#123f5f',
  formGradientEnd: '#0a2840',
  formTitleColor: '#f7fbff',
  formLabelColor: '#f2f8ff',
  formMutedColor: '#dfeaf7',
  formInputBackground: '#2d5c86',
  formInputTextColor: '#f7fbff',
  formPlaceholderColor: '#bfd0e1',
  formInputBorderColor: '#a0c0db',
  formInputHeight: 34,
  primaryButtonBackground: '#ffffff',
  primaryButtonTextColor: '#0c1c2c',
  primaryButtonBorderColor: '#081d30',
  primaryButtonHeight: 38,
  iconButtonBackground: '#6591b3',
  iconButtonTextColor: '#f2f8ff',
};

function normalizeSizeValue(value, fallback, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function normalizeColorValue(value, fallback) {
  const nextValue = String(value || '').trim();
  return /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(nextValue) ? nextValue : fallback;
}

function normalizeBooleanValue(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
  }
  return Boolean(value);
}

function normalizeMeetingRules(source = {}) {
  return {
    excludedDates: Array.isArray(source.excludedDates)
      ? source.excludedDates.map((value) => String(value || '').trim()).filter(Boolean)
      : String(source.excludedDates || '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
    allowedStartTime: String(source.allowedStartTime || DEFAULT_SLOT_RULES.allowedStartTime).trim(),
    allowedEndTime: String(source.allowedEndTime || DEFAULT_SLOT_RULES.allowedEndTime).trim(),
    timeZone: String(source.timeZone || DEFAULT_SLOT_RULES.timeZone).trim(),
  };
}

function normalizeAppearance(source = {}) {
  const fontFamily = String(source.fontFamily || DEFAULT_APPEARANCE_SETTINGS.fontFamily).trim();
  return {
    fontFamily: ALLOWED_FONT_FAMILIES.has(fontFamily)
      ? fontFamily
      : DEFAULT_APPEARANCE_SETTINGS.fontFamily,
    pageBackground: normalizeColorValue(source.pageBackground, DEFAULT_APPEARANCE_SETTINGS.pageBackground),
    cardBackground: normalizeColorValue(source.cardBackground, DEFAULT_APPEARANCE_SETTINGS.cardBackground),
    textColor: normalizeColorValue(source.textColor, DEFAULT_APPEARANCE_SETTINGS.textColor),
    mutedTextColor: normalizeColorValue(source.mutedTextColor, DEFAULT_APPEARANCE_SETTINGS.mutedTextColor),
    heroBackground: normalizeColorValue(source.heroBackground, DEFAULT_APPEARANCE_SETTINGS.heroBackground),
    heroTitleColor: normalizeColorValue(source.heroTitleColor, DEFAULT_APPEARANCE_SETTINGS.heroTitleColor),
    heroLeadColor: normalizeColorValue(source.heroLeadColor, DEFAULT_APPEARANCE_SETTINGS.heroLeadColor),
    heroTitleSize: normalizeSizeValue(source.heroTitleSize, DEFAULT_APPEARANCE_SETTINGS.heroTitleSize, 24, 72),
    bodyTextSize: normalizeSizeValue(source.bodyTextSize, DEFAULT_APPEARANCE_SETTINGS.bodyTextSize, 11, 20),
    panelRadius: normalizeSizeValue(source.panelRadius, DEFAULT_APPEARANCE_SETTINGS.panelRadius, 8, 30),
    dateTextColor: normalizeColorValue(source.dateTextColor, DEFAULT_APPEARANCE_SETTINGS.dateTextColor),
    weekdayTextColor: normalizeColorValue(source.weekdayTextColor, DEFAULT_APPEARANCE_SETTINGS.weekdayTextColor),
    dateMutedColor: normalizeColorValue(source.dateMutedColor, DEFAULT_APPEARANCE_SETTINGS.dateMutedColor),
    dateHoverBackground: normalizeColorValue(source.dateHoverBackground, DEFAULT_APPEARANCE_SETTINGS.dateHoverBackground),
    dateActiveBackground: normalizeColorValue(source.dateActiveBackground, DEFAULT_APPEARANCE_SETTINGS.dateActiveBackground),
    dateActiveTextColor: normalizeColorValue(source.dateActiveTextColor, DEFAULT_APPEARANCE_SETTINGS.dateActiveTextColor),
    dateButtonHeight: normalizeSizeValue(source.dateButtonHeight, DEFAULT_APPEARANCE_SETTINGS.dateButtonHeight, 40, 92),
    timeBackground: normalizeColorValue(source.timeBackground, DEFAULT_APPEARANCE_SETTINGS.timeBackground),
    timeTextColor: normalizeColorValue(source.timeTextColor, DEFAULT_APPEARANCE_SETTINGS.timeTextColor),
    timeBorderColor: normalizeColorValue(source.timeBorderColor, DEFAULT_APPEARANCE_SETTINGS.timeBorderColor),
    timeActiveBackground: normalizeColorValue(source.timeActiveBackground, DEFAULT_APPEARANCE_SETTINGS.timeActiveBackground),
    timeActiveTextColor: normalizeColorValue(source.timeActiveTextColor, DEFAULT_APPEARANCE_SETTINGS.timeActiveTextColor),
    timeActiveBorderColor: normalizeColorValue(source.timeActiveBorderColor, DEFAULT_APPEARANCE_SETTINGS.timeActiveBorderColor),
    timeButtonHeight: normalizeSizeValue(source.timeButtonHeight, DEFAULT_APPEARANCE_SETTINGS.timeButtonHeight, 40, 92),
    formGradientStart: normalizeColorValue(source.formGradientStart, DEFAULT_APPEARANCE_SETTINGS.formGradientStart),
    formGradientMid: normalizeColorValue(source.formGradientMid, DEFAULT_APPEARANCE_SETTINGS.formGradientMid),
    formGradientEnd: normalizeColorValue(source.formGradientEnd, DEFAULT_APPEARANCE_SETTINGS.formGradientEnd),
    formTitleColor: normalizeColorValue(source.formTitleColor, DEFAULT_APPEARANCE_SETTINGS.formTitleColor),
    formLabelColor: normalizeColorValue(source.formLabelColor, DEFAULT_APPEARANCE_SETTINGS.formLabelColor),
    formMutedColor: normalizeColorValue(source.formMutedColor, DEFAULT_APPEARANCE_SETTINGS.formMutedColor),
    formInputBackground: normalizeColorValue(source.formInputBackground, DEFAULT_APPEARANCE_SETTINGS.formInputBackground),
    formInputTextColor: normalizeColorValue(source.formInputTextColor, DEFAULT_APPEARANCE_SETTINGS.formInputTextColor),
    formPlaceholderColor: normalizeColorValue(source.formPlaceholderColor, DEFAULT_APPEARANCE_SETTINGS.formPlaceholderColor),
    formInputBorderColor: normalizeColorValue(source.formInputBorderColor, DEFAULT_APPEARANCE_SETTINGS.formInputBorderColor),
    formInputHeight: normalizeSizeValue(source.formInputHeight, DEFAULT_APPEARANCE_SETTINGS.formInputHeight, 30, 72),
    primaryButtonBackground: normalizeColorValue(source.primaryButtonBackground, DEFAULT_APPEARANCE_SETTINGS.primaryButtonBackground),
    primaryButtonTextColor: normalizeColorValue(source.primaryButtonTextColor, DEFAULT_APPEARANCE_SETTINGS.primaryButtonTextColor),
    primaryButtonBorderColor: normalizeColorValue(source.primaryButtonBorderColor, DEFAULT_APPEARANCE_SETTINGS.primaryButtonBorderColor),
    primaryButtonHeight: normalizeSizeValue(source.primaryButtonHeight, DEFAULT_APPEARANCE_SETTINGS.primaryButtonHeight, 34, 72),
    iconButtonBackground: normalizeColorValue(source.iconButtonBackground, DEFAULT_APPEARANCE_SETTINGS.iconButtonBackground),
    iconButtonTextColor: normalizeColorValue(source.iconButtonTextColor, DEFAULT_APPEARANCE_SETTINGS.iconButtonTextColor),
  };
}

function normalizeMtsLinkSettings(source = {}) {
  const lastSuccessMeeting =
    source.lastSuccessMeeting && typeof source.lastSuccessMeeting === "object"
      ? {
          createdAt: String(source.lastSuccessMeeting.createdAt || "").trim() || null,
          eventId:
            source.lastSuccessMeeting.eventId === undefined || source.lastSuccessMeeting.eventId === null
              ? null
              : String(source.lastSuccessMeeting.eventId),
          meetingId:
            source.lastSuccessMeeting.meetingId === undefined || source.lastSuccessMeeting.meetingId === null
              ? null
              : String(source.lastSuccessMeeting.meetingId),
          meetingUrl: String(source.lastSuccessMeeting.meetingUrl || "").trim() || null,
          rawStatus:
            source.lastSuccessMeeting.rawStatus === undefined || source.lastSuccessMeeting.rawStatus === null
              ? null
              : Number(source.lastSuccessMeeting.rawStatus) || null,
        }
      : null;

  return {
    enabled: normalizeBooleanValue(source.enabled, DEFAULT_MTS_LINK_SETTINGS.enabled),
    accountMode: "shared",
    baseUrl: String(source.baseUrl || DEFAULT_MTS_LINK_SETTINGS.baseUrl).trim().replace(/\/+$/, ""),
    accessToken: String(source.accessToken || "").trim(),
    organizerName: String(source.organizerName || DEFAULT_MTS_LINK_SETTINGS.organizerName).trim(),
    defaultRoomTitleTemplate: String(
      source.defaultRoomTitleTemplate || DEFAULT_MTS_LINK_SETTINGS.defaultRoomTitleTemplate,
    ).trim(),
    defaultRoomDescriptionTemplate: String(
      source.defaultRoomDescriptionTemplate || DEFAULT_MTS_LINK_SETTINGS.defaultRoomDescriptionTemplate,
    ).trim(),
    timeZone: String(source.timeZone || DEFAULT_MTS_LINK_SETTINGS.timeZone).trim(),
    defaultDurationMinutes: normalizeSizeValue(
      source.defaultDurationMinutes,
      DEFAULT_MTS_LINK_SETTINGS.defaultDurationMinutes,
      15,
      240,
    ),
    insertLinkIntoLocation: normalizeBooleanValue(
      source.insertLinkIntoLocation,
      DEFAULT_MTS_LINK_SETTINGS.insertLinkIntoLocation,
    ),
    insertLinkIntoDescription: normalizeBooleanValue(
      source.insertLinkIntoDescription,
      DEFAULT_MTS_LINK_SETTINGS.insertLinkIntoDescription,
    ),
    appendMeetingMetaToDescription: normalizeBooleanValue(
      source.appendMeetingMetaToDescription,
      DEFAULT_MTS_LINK_SETTINGS.appendMeetingMetaToDescription,
    ),
    fallbackWithoutLink: normalizeBooleanValue(
      source.fallbackWithoutLink,
      DEFAULT_MTS_LINK_SETTINGS.fallbackWithoutLink,
    ),
    failureWarningText: String(
      source.failureWarningText || DEFAULT_MTS_LINK_SETTINGS.failureWarningText,
    ).trim(),
    requestTimeoutMs: normalizeSizeValue(
      source.requestTimeoutMs,
      DEFAULT_MTS_LINK_SETTINGS.requestTimeoutMs,
      1000,
      60000,
    ),
    lastTestAt: String(source.lastTestAt || "").trim() || null,
    lastTestStatus:
      source.lastTestStatus === "success" || source.lastTestStatus === "error" ? source.lastTestStatus : null,
    lastTestMessage: String(source.lastTestMessage || "").trim(),
    lastSuccessMeeting,
  };
}

function normalizeConfig(config = {}) {
  let employees = [];
  let activeEmployeeId = null;

  if (Array.isArray(config.employees)) {
    employees = config.employees.map((employee) => ({
      id: String(employee.id || crypto.randomUUID()),
      name: String(employee.name || employee.email || 'Сотрудник').trim(),
      email: String(employee.email || '').trim(),
      password: String(employee.password || '').trim(),
      priority: Math.max(1, Number(employee.priority) || 100),
    }));
    activeEmployeeId = config.activeEmployeeId ? String(config.activeEmployeeId) : null;
  } else {
    const email = String(config.email || '').trim();
    const password = String(config.password || '').trim();
    if (email || password) {
      const employeeId = crypto.randomUUID();
      employees = [
        {
          id: employeeId,
          name: email || 'Сотрудник',
          email,
          password,
          priority: 1,
        },
      ];
      activeEmployeeId = employeeId;
    }
  }

  return {
    employees,
    activeEmployeeId,
    meetingRules: normalizeMeetingRules(config.meetingRules || {}),
    appearance: normalizeAppearance(config.appearance || {}),
    mtsLink: normalizeMtsLinkSettings(config.mtsLink || {}),
  };
}

function getActiveEmployee(config) {
  const normalizedConfig = normalizeConfig(config);
  return (
    normalizedConfig.employees.find((employee) => employee.id === normalizedConfig.activeEmployeeId) ||
    normalizedConfig.employees[0] ||
    null
  );
}

function json(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
  });
  response.end(JSON.stringify(payload));
}

function setPublicCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function redirect(response, location) {
  response.writeHead(302, { Location: location });
  response.end();
}

function parseCookies(request) {
  return Object.fromEntries(
    String(request.headers.cookie || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf("=");
        if (separatorIndex === -1) {
          return [part, ""];
        }

        return [
          decodeURIComponent(part.slice(0, separatorIndex)),
          decodeURIComponent(part.slice(separatorIndex + 1)),
        ];
      }),
  );
}

function getClientIp(request) {
  return String(request.headers["x-forwarded-for"] || request.socket.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
}

function checkRateLimit(request, scope, options) {
  const now = Date.now();
  const key = `${scope}:${getClientIp(request)}`;
  const current = rateLimitBuckets.get(key);

  if (!current || current.expiresAt <= now) {
    rateLimitBuckets.set(key, { count: 1, expiresAt: now + options.windowMs });
    return true;
  }

  current.count += 1;
  return current.count <= options.limit;
}

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getSessionToken(request) {
  return parseCookies(request)[SESSION_COOKIE] || "";
}

function signSessionPayload(payload) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

function signCsrfToken(sessionToken) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(`csrf:${sessionToken}`).digest("base64url");
}

function createSessionToken() {
  const payload = Buffer.from(
    JSON.stringify({
      username: ADMIN_USERNAME,
      expiresAt: Date.now() + 12 * 60 * 60 * 1000,
    }),
    "utf8",
  ).toString("base64url");
  const signature = signSessionPayload(payload);
  return `${payload}.${signature}`;
}

function createSessionCookie(sessionToken) {
  const secureFlag = IS_PRODUCTION ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(sessionToken)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200${secureFlag}`;
}

function clearSessionCookie() {
  const secureFlag = IS_PRODUCTION ? "; Secure" : "";
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secureFlag}`;
}

function isAdminRequest(request) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token || !token.includes(".")) {
    return false;
  }

  const [payload, signature] = token.split(".");
  const expectedSignature = signSessionPayload(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return session.username === ADMIN_USERNAME && Number(session.expiresAt) > Date.now();
  } catch {
    return false;
  }
}

function getCsrfTokenForRequest(request) {
  const token = getSessionToken(request);
  return token && isAdminRequest(request) ? signCsrfToken(token) : null;
}

function isSafeMethod(method) {
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

function isAdminMutation(request, requestUrl) {
  return requestUrl.pathname.startsWith("/api/") &&
    !requestUrl.pathname.startsWith("/api/public/") &&
    requestUrl.pathname !== "/api/admin/login" &&
    !isSafeMethod(request.method);
}

function verifyCsrf(request) {
  const expectedToken = getCsrfTokenForRequest(request);
  const providedToken = String(request.headers[CSRF_HEADER] || "").trim();
  if (!expectedToken || !providedToken) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedToken);
  const providedBuffer = Buffer.from(providedToken);
  return expectedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

function basicAuthHeader(email, password) {
  return `Basic ${Buffer.from(`${email}:${password}`, "utf8").toString("base64")}`;
}

function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

function resolveHref(baseUrl, href) {
  return new URL(href, baseUrl).toString();
}

function parseAbsoluteUrl(value, label = "URL") {
  try {
    const parsed = new URL(String(value || "").trim());
    if (parsed.protocol !== "https:") {
      throw createHttpError(`${label} должен использовать HTTPS.`, 400);
    }
    parsed.hash = "";
    return parsed;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    throw createHttpError(`Некорректный ${label}.`, 400);
  }
}

function validateMtsLinkBaseUrl(baseUrl) {
  const parsed = parseAbsoluteUrl(baseUrl, "базовый URL MTS Link");
  if (!MTS_LINK_ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw createHttpError("Базовый URL MTS Link не входит в список разрешённых хостов.", 400);
  }
  return parsed.toString().replace(/\/+$/, "");
}

function assertRangeLimit(rangeStartIso, rangeEndIso, maxDays) {
  const startMs = Date.parse(rangeStartIso);
  const endMs = Date.parse(rangeEndIso);

  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
    throw createHttpError("Некорректный диапазон дат.", 400);
  }

  const maxMs = maxDays * 24 * 60 * 60 * 1000;
  if (endMs - startMs > maxMs) {
    throw createHttpError(`Диапазон дат не должен превышать ${maxDays} дней.`, 400);
  }
}

function sanitizeEmployeeForAdmin(employee) {
  return {
    ...employee,
    password: employee.password ? MASKED_SECRET : "",
  };
}

function sanitizeMtsLinkForAdmin(settings = {}) {
  return {
    ...settings,
    accessToken: settings.accessToken ? MASKED_SECRET : "",
  };
}

function sanitizeConfigForAdmin(config) {
  const normalized = normalizeConfig(config);
  return {
    ...normalized,
    employees: normalized.employees.map(sanitizeEmployeeForAdmin),
    mtsLink: sanitizeMtsLinkForAdmin(normalized.mtsLink),
  };
}

function restoreMaskedSecret(nextValue, previousValue) {
  return nextValue === MASKED_SECRET ? String(previousValue || "") : nextValue;
}

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapeIcsText(value) {
  return String(value || "")
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\r\n", "\\n")
    .replaceAll("\n", "\\n");
}

function escapeIcsParam(value) {
  return String(value || "")
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("\r\n", " ")
    .replaceAll("\n", " ");
}

function stripXml(value) {
  return decodeXml(value.replace(/<[^>]+>/g, "").trim());
}

function findAllTagValues(xml, tagName) {
  const pattern = new RegExp(
    `<(?:[A-Za-z0-9_-]+:)?${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[A-Za-z0-9_-]+:)?${tagName}>`,
    "gi",
  );
  const matches = [];
  let match = pattern.exec(xml);

  while (match) {
    matches.push(match[1]);
    match = pattern.exec(xml);
  }

  return matches;
}

function findFirstTagValue(xml, tagName) {
  return findAllTagValues(xml, tagName)[0] || null;
}

function extractResponses(multistatusXml) {
  const pattern =
    /<(?:[A-Za-z0-9_-]+:)?response(?:\s[^>]*)?>([\s\S]*?)<\/(?:[A-Za-z0-9_-]+:)?response>/gi;
  const responses = [];
  let match = pattern.exec(multistatusXml);

  while (match) {
    responses.push(match[1]);
    match = pattern.exec(multistatusXml);
  }

  return responses;
}

function unfoldIcsLines(icsText) {
  return icsText.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

function parseIcsDate(value, tzid) {
  if (!value) {
    return null;
  }

  const dateOnlyMatch = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return {
      iso: new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toISOString(),
      isDateOnly: true,
      tzid: tzid || null,
    };
  }

  const timestampMatch = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(value);
  if (!timestampMatch) {
    return null;
  }

  const [, year, month, day, hour, minute, second, utcMarker] = timestampMatch;
  const dateParts = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
  };
  const iso = utcMarker
    ? new Date(
        Date.UTC(
          dateParts.year,
          dateParts.month - 1,
          dateParts.day,
          dateParts.hour,
          dateParts.minute,
          dateParts.second,
        ),
      ).toISOString()
    : convertZonedDateTimeToUtc(dateParts, tzid).toISOString();

  return {
    iso,
    isDateOnly: false,
    tzid: utcMarker ? "UTC" : tzid || null,
  };
}

function convertZonedDateTimeToUtc(parts, timeZone) {
  const utcGuess = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  if (!timeZone) {
    return new Date(utcGuess);
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const date = new Date(utcGuess);
    const partsMap = Object.fromEntries(
      formatter
        .formatToParts(date)
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );
    const asZonedUtc = Date.UTC(
      Number(partsMap.year),
      Number(partsMap.month) - 1,
      Number(partsMap.day),
      Number(partsMap.hour),
      Number(partsMap.minute),
      Number(partsMap.second),
    );
    const offset = asZonedUtc - utcGuess;

    return new Date(utcGuess - offset);
  } catch {
    return new Date(utcGuess);
  }
}

function parseDurationToMs(value) {
  if (!value) {
    return 0;
  }

  const match = /^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value);
  if (!match) {
    return 0;
  }

  const [, weeks, days, hours, minutes, seconds] = match;
  return (
    (Number(weeks || 0) * 7 * 24 * 60 * 60 +
      Number(days || 0) * 24 * 60 * 60 +
      Number(hours || 0) * 60 * 60 +
      Number(minutes || 0) * 60 +
      Number(seconds || 0)) *
    1000
  );
}

function formatUtcForCaldav(value) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function parsePeriodToInterval(value) {
  const [startRaw, endRaw] = value.split("/");
  const start = parseIcsDate(startRaw, "UTC");

  if (!start) {
    return null;
  }

  let end = parseIcsDate(endRaw, "UTC");

  if (!end && endRaw?.startsWith("P")) {
    const durationMs = parseDurationToMs(endRaw);
    end = {
      iso: new Date(new Date(start.iso).getTime() + durationMs).toISOString(),
    };
  }

  if (!end) {
    return null;
  }

  return {
    start: start.iso,
    end: end.iso,
  };
}

function parseCalendarData(calendarData, calendarName, calendarUrl, metadata = {}) {
  const unfolded = unfoldIcsLines(calendarData);
  const eventMatches = [...unfolded.matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g)];
  const events = [];

  for (const match of eventMatches) {
    const block = match[1];
    const lines = block
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const properties = {};

    for (const line of lines) {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        continue;
      }

      const rawName = line.slice(0, separatorIndex);
      const rawValue = line.slice(separatorIndex + 1);
      const [name, ...paramParts] = rawName.split(";");
      const params = {};

      for (const paramPart of paramParts) {
        const [paramName, paramValue = ""] = paramPart.split("=");
        params[paramName.toUpperCase()] = paramValue;
      }

      const key = name.toUpperCase();
      if (!properties[key]) {
        properties[key] = [];
      }

      properties[key].push({ value: rawValue, params });
    }

    const status = properties.STATUS?.[0]?.value?.toUpperCase() || "";
    const transparency = properties.TRANSP?.[0]?.value?.toUpperCase() || "";
    const startEntry = properties.DTSTART?.[0];
    const endEntry = properties.DTEND?.[0];
    const durationEntry = properties.DURATION?.[0];

    if (!startEntry || status === "CANCELLED") {
      continue;
    }

    const start = parseIcsDate(startEntry.value, startEntry.params.TZID);
    if (!start) {
      continue;
    }

    let end = endEntry ? parseIcsDate(endEntry.value, endEntry.params.TZID) : null;

    if (!end && durationEntry) {
      const durationMs = parseDurationToMs(durationEntry.value);
      if (durationMs > 0) {
        end = {
          iso: new Date(new Date(start.iso).getTime() + durationMs).toISOString(),
          isDateOnly: false,
          tzid: start.tzid,
        };
      }
    }

    if (!end) {
      const defaultDuration = start.isDateOnly ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
      end = {
        iso: new Date(new Date(start.iso).getTime() + defaultDuration).toISOString(),
        isDateOnly: false,
        tzid: start.tzid,
      };
    }

    const uid = properties.UID?.[0]?.value || null;
    const recurrenceIdEntry = properties["RECURRENCE-ID"]?.[0] || null;
    const recurrenceId = recurrenceIdEntry?.value || null;
    const recurrenceIdParsed = recurrenceIdEntry
      ? parseIcsDate(recurrenceIdEntry.value, recurrenceIdEntry.params.TZID)
      : null;
    const recurrenceRule = properties.RRULE?.[0]?.value || null;
    const exdates = (properties.EXDATE || []).flatMap((entry) =>
      String(entry.value || "")
        .split(",")
        .map((value) => parseIcsDate(value.trim(), entry.params.TZID))
        .filter(Boolean)
        .map((parsed) => parsed.iso),
    );

    events.push({
      calendarName,
      calendarUrl,
      eventUrl: metadata.eventUrl || null,
      etag: metadata.etag || null,
      uid,
      summary: properties.SUMMARY?.[0]?.value || "Busy",
      description: properties.DESCRIPTION?.[0]?.value || "",
      location: properties.LOCATION?.[0]?.value || "",
      start: start.iso,
      end: end.iso,
      isAllDay: start.isDateOnly,
      recurrenceId,
      recurrenceIdIso: recurrenceIdParsed?.iso || null,
      recurrenceRule,
      isRecurring: Boolean(recurrenceId || recurrenceRule),
      instanceKey: [metadata.eventUrl || calendarUrl, uid || "no-uid", recurrenceId || start.iso].join("::"),
      exdates,
      timeZone: start.tzid,
      status,
      transparency,
    });
  }

  return events;
}

function parseFreeBusyData(calendarData) {
  const unfolded = unfoldIcsLines(calendarData);
  const freeBusyMatches = [...unfolded.matchAll(/^FREEBUSY(?:;[^:]+)?:([^\r\n]+)$/gim)];
  const intervals = [];

  for (const match of freeBusyMatches) {
    const periods = match[1]
      .split(",")
      .map((period) => period.trim())
      .filter(Boolean);

    for (const period of periods) {
      const interval = parsePeriodToInterval(period);
      if (interval) {
        intervals.push(interval);
      }
    }
  }

  return intervals;
}

function getEventBusyIntervals(events) {
  return events
    .filter((event) => event.transparency !== "TRANSPARENT")
    .map((event) => ({ start: event.start, end: event.end }));
}

function parseRRule(rule) {
  return Object.fromEntries(
    String(rule || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [key, value = ""] = part.split("=");
        return [key.toUpperCase(), value];
      }),
  );
}

function addUtcDays(isoString, days) {
  return new Date(new Date(isoString).getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function addUtcMonths(isoString, months) {
  const date = new Date(isoString);
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + months,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
    ),
  ).toISOString();
}

function addUtcYears(isoString, years) {
  const date = new Date(isoString);
  return new Date(
    Date.UTC(
      date.getUTCFullYear() + years,
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
    ),
  ).toISOString();
}

function overlapsRange(startIso, endIso, rangeStartIso, rangeEndIso) {
  return new Date(startIso) < new Date(rangeEndIso) && new Date(endIso) > new Date(rangeStartIso);
}

function getUtcWeekdayCode(isoString) {
  const weekdayCodes = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  return weekdayCodes[new Date(isoString).getUTCDay()];
}

function buildRecurringInstance(masterEvent, occurrenceStartIso, occurrenceEndIso, overrideEvent = null) {
  const baseEvent = overrideEvent || masterEvent;
  const recurrenceToken = overrideEvent?.recurrenceId || masterEvent.recurrenceId || occurrenceStartIso;

  return {
    ...baseEvent,
    start: overrideEvent ? overrideEvent.start : occurrenceStartIso,
    end: overrideEvent ? overrideEvent.end : occurrenceEndIso,
    recurrenceId: overrideEvent?.recurrenceId || masterEvent.recurrenceId || occurrenceStartIso,
    recurrenceIdIso: overrideEvent?.recurrenceIdIso || occurrenceStartIso,
    recurrenceRule: masterEvent.recurrenceRule,
    isRecurring: true,
    instanceKey: [baseEvent.eventUrl || baseEvent.calendarUrl, baseEvent.uid || "no-uid", recurrenceToken].join("::"),
  };
}

function expandRecurringMaster(masterEvent, overrides, rangeStartIso, rangeEndIso) {
  const rule = parseRRule(masterEvent.recurrenceRule);
  const freq = rule.FREQ;
  const interval = Number(rule.INTERVAL || 1);
  const count = Number(rule.COUNT || 0);
  const until = rule.UNTIL ? parseIcsDate(rule.UNTIL, "UTC")?.iso || null : null;
  const byDay = rule.BYDAY ? rule.BYDAY.split(",").map((value) => value.trim().toUpperCase()) : null;
  const byMonthDay = rule.BYMONTHDAY
    ? rule.BYMONTHDAY.split(",").map((value) => Number(value.trim())).filter(Boolean)
    : null;
  const excluded = new Set(masterEvent.exdates || []);
  const durationMs = new Date(masterEvent.end).getTime() - new Date(masterEvent.start).getTime();
  const instances = [];
  let occurrenceStartIso = masterEvent.start;
  let emittedCount = 0;
  let iterations = 0;

  while (iterations < 1200) {
    iterations += 1;

    if (until && new Date(occurrenceStartIso) > new Date(until)) {
      break;
    }

    const occurrenceEndIso = new Date(new Date(occurrenceStartIso).getTime() + durationMs).toISOString();
    const weekdayMatches = !byDay || byDay.some((code) => code.endsWith(getUtcWeekdayCode(occurrenceStartIso)));
    const monthDayMatches = !byMonthDay || byMonthDay.includes(new Date(occurrenceStartIso).getUTCDate());
    const notExcluded = !excluded.has(occurrenceStartIso);

    if (weekdayMatches && monthDayMatches) {
      emittedCount += 1;
      if (notExcluded && overlapsRange(occurrenceStartIso, occurrenceEndIso, rangeStartIso, rangeEndIso)) {
        const overrideEvent = overrides.get(occurrenceStartIso) || null;
        instances.push(
          buildRecurringInstance(masterEvent, occurrenceStartIso, occurrenceEndIso, overrideEvent),
        );
      }

      if (count && emittedCount >= count) {
        break;
      }
    }

    if (freq === "DAILY") {
      occurrenceStartIso = addUtcDays(occurrenceStartIso, interval);
      continue;
    }

    if (freq === "WEEKLY") {
      occurrenceStartIso = addUtcDays(occurrenceStartIso, 7 * interval);
      continue;
    }

    if (freq === "MONTHLY") {
      occurrenceStartIso = addUtcMonths(occurrenceStartIso, interval);
      continue;
    }

    if (freq === "YEARLY") {
      occurrenceStartIso = addUtcYears(occurrenceStartIso, interval);
      continue;
    }

    break;
  }

  return instances;
}

function normalizeEventsToInstances(events, rangeStartIso, rangeEndIso) {
  const groupedBySeries = new Map();

  for (const event of events) {
    const seriesKey = [event.calendarUrl, event.uid || event.eventUrl || event.start].join("::");
    if (!groupedBySeries.has(seriesKey)) {
      groupedBySeries.set(seriesKey, []);
    }

    groupedBySeries.get(seriesKey).push(event);
  }

  const normalized = [];

  for (const seriesEvents of groupedBySeries.values()) {
    const masterRecurring = seriesEvents.find((event) => event.recurrenceRule && !event.recurrenceIdIso);

    if (!masterRecurring) {
      normalized.push(
        ...seriesEvents.filter((event) => overlapsRange(event.start, event.end, rangeStartIso, rangeEndIso)),
      );
      continue;
    }

    const overrides = new Map(
      seriesEvents
        .filter((event) => event.recurrenceIdIso)
        .map((event) => [event.recurrenceIdIso, event]),
    );
    const expandedInstances = expandRecurringMaster(
      masterRecurring,
      overrides,
      rangeStartIso,
      rangeEndIso,
    );

    normalized.push(...expandedInstances);

    for (const overrideEvent of overrides.values()) {
      if (
        !expandedInstances.some((instance) => instance.instanceKey === overrideEvent.instanceKey) &&
        overlapsRange(overrideEvent.start, overrideEvent.end, rangeStartIso, rangeEndIso)
      ) {
        normalized.push(
          buildRecurringInstance(
            masterRecurring,
            overrideEvent.recurrenceIdIso || overrideEvent.start,
            overrideEvent.end,
            overrideEvent,
          ),
        );
      }
    }
  }

  return [...new Map(normalized.map((event) => [event.instanceKey, event])).values()].sort(
    (left, right) => new Date(left.start) - new Date(right.start),
  );
}

function formatIcsDateTime(isoString) {
  return new Date(isoString).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function buildEventIcs(eventData) {
  const uid = eventData.uid || crypto.randomUUID();
  const dtStamp = formatIcsDateTime(new Date().toISOString());
  const dtStart = formatIcsDateTime(eventData.start);
  const dtEnd = formatIcsDateTime(eventData.end);
  const summary = escapeIcsText(eventData.summary || "New event");
  const description = escapeIcsText(eventData.description || "");
  const location = escapeIcsText(eventData.location || "");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SmartM//CalDAV Client//RU",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
  ];

  if (description) {
    lines.push(`DESCRIPTION:${description}`);
  }

  if (location) {
    lines.push(`LOCATION:${location}`);
  }

  if (Array.isArray(eventData.attendees)) {
    for (const attendee of eventData.attendees) {
      const email = String(attendee.email || "").trim();
      if (!email) {
        continue;
      }

      const name = escapeIcsParam(attendee.name || email);
      lines.push(`ATTENDEE;CN="${name}";ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${email}`);
    }
  }

  lines.push("END:VEVENT", "END:VCALENDAR", "");
  return lines.join("\r\n");
}

function mergeBusyIntervals(events, rangeStartIso, rangeEndIso) {
  const rangeStart = new Date(rangeStartIso).getTime();
  const rangeEnd = new Date(rangeEndIso).getTime();
  const intervals = events
    .map((event) => ({
      start: Math.max(new Date(event.start).getTime(), rangeStart),
      end: Math.min(new Date(event.end).getTime(), rangeEnd),
    }))
    .filter((interval) => interval.end > interval.start)
    .sort((left, right) => left.start - right.start);

  if (intervals.length === 0) {
    return [];
  }

  const merged = [intervals[0]];

  for (const interval of intervals.slice(1)) {
    const previous = merged[merged.length - 1];
    if (interval.start <= previous.end) {
      previous.end = Math.max(previous.end, interval.end);
      continue;
    }

    merged.push(interval);
  }

  return merged.map((interval) => ({
    start: new Date(interval.start).toISOString(),
    end: new Date(interval.end).toISOString(),
  }));
}

function alignIsoUpToHalfHour(isoString) {
  const date = new Date(isoString);
  date.setUTCSeconds(0, 0);
  const minutes = date.getUTCMinutes();
  const remainder = minutes % 30;

  if (remainder !== 0) {
    date.setUTCMinutes(minutes + (30 - remainder));
  }

  return date.toISOString();
}

function buildMeetingSlotsFromBusy(busyIntervals, rangeStartIso, rangeEndIso, durationMinutes, gapMinutes) {
  const mergedBusy = mergeBusyIntervals(busyIntervals, rangeStartIso, rangeEndIso);
  const rangeStart = new Date(rangeStartIso).getTime();
  const rangeEnd = new Date(rangeEndIso).getTime();
  const durationMs = durationMinutes * 60 * 1000;
  const stepMs = (durationMinutes + gapMinutes) * 60 * 1000;
  const slots = [];
  let cursor = rangeStart;

  for (const busy of mergedBusy) {
    const busyStart = new Date(busy.start).getTime();
    const busyEnd = new Date(busy.end).getTime();

    if (busyStart > cursor) {
      let slotStartIso = alignIsoUpToHalfHour(new Date(cursor).toISOString());
      let slotStart = new Date(slotStartIso).getTime();

      while (slotStart + durationMs <= busyStart) {
        slots.push({
          start: new Date(slotStart).toISOString(),
          end: new Date(slotStart + durationMs).toISOString(),
        });
        slotStart += stepMs;
      }
    }

    cursor = Math.max(cursor, busyEnd);
  }

  if (cursor < rangeEnd) {
    let slotStartIso = alignIsoUpToHalfHour(new Date(cursor).toISOString());
    let slotStart = new Date(slotStartIso).getTime();

    while (slotStart + durationMs <= rangeEnd) {
      slots.push({
        start: new Date(slotStart).toISOString(),
        end: new Date(slotStart + durationMs).toISOString(),
      });
      slotStart += stepMs;
    }
  }

  return slots;
}

function getDateTimePartsInTimeZone(isoString, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone || "UTC",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return Object.fromEntries(
    formatter
      .formatToParts(new Date(isoString))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
}

function parseTimeToMinutes(value, fallback) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value || "").trim());
  if (!match) {
    return fallback;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function filterMeetingSlotsByRules(slots, rules = {}) {
  const excludedDates = new Set((rules.excludedDates || []).map((value) => String(value).trim()).filter(Boolean));
  const timeZone = String(rules.timeZone || "Europe/Moscow").trim() || "Europe/Moscow";
  const allowedStartMinutes = parseTimeToMinutes(rules.allowedStartTime, 0);
  const allowedEndMinutes = parseTimeToMinutes(rules.allowedEndTime, 24 * 60);

  return slots.filter((slot) => {
    const startParts = getDateTimePartsInTimeZone(slot.start, timeZone);
    const endParts = getDateTimePartsInTimeZone(slot.end, timeZone);
    const localDate = `${startParts.year}-${startParts.month}-${startParts.day}`;
    const startMinutes = Number(startParts.hour) * 60 + Number(startParts.minute);
    const endMinutes = Number(endParts.hour) * 60 + Number(endParts.minute);

    if (excludedDates.has(localDate)) {
      return false;
    }

    if (startMinutes < allowedStartMinutes) {
      return false;
    }

    if (endMinutes > allowedEndMinutes) {
      return false;
    }

    return true;
  });
}

async function loadConfig() {
  try {
    const fileContents = await fs.readFile(CONFIG_PATH, "utf8");
    return normalizeConfig(JSON.parse(fileContents));
  } catch (error) {
    if (error.code === "ENOENT") {
      return normalizeConfig();
    }

    throw error;
  }
}

async function saveConfig(config) {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(normalizeConfig(config), null, 2), "utf8");
}

async function updateConfig(mutator) {
  const currentConfig = await loadConfig();
  const nextConfig = await mutator(currentConfig);
  await saveConfig(nextConfig);
  return nextConfig;
}

async function readRequestBody(request) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_JSON_BODY_BYTES) {
      throw createHttpError("Размер запроса слишком большой.", 413);
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function getCredentials(overrides = {}) {
  const storedConfig = await loadConfig();
  const activeEmployee = getActiveEmployee(storedConfig);
  const email = String(overrides.email || activeEmployee?.email || "").trim();
  const password = String(overrides.password || activeEmployee?.password || "").trim();

  if (!email || !password) {
    const error = new Error("Missing credentials");
    error.statusCode = 400;
    throw error;
  }

  return { email, password };
}

function collectUnknownTemplateVariables(template) {
  const unknown = new Set();
  String(template || "").replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, variableName) => {
    if (!MTS_LINK_TEMPLATE_VARIABLES.has(variableName)) {
      unknown.add(variableName);
    }
    return _;
  });
  return [...unknown];
}

function validateMtsLinkSettings(settings, { requireTokenWhenEnabled = true } = {}) {
  if (settings.accountMode !== "shared") {
    const error = new Error('Поддерживается только общий аккаунт MTS Link.');
    error.statusCode = 400;
    throw error;
  }

  if (!settings.enabled) {
    return true;
  }

  if (!settings.baseUrl) {
    const error = new Error("Укажите базовый URL API MTS Link.");
    error.statusCode = 400;
    throw error;
  }

  validateMtsLinkBaseUrl(settings.baseUrl);

  if (requireTokenWhenEnabled && !settings.accessToken) {
    const error = new Error("Укажите токен доступа MTS Link.");
    error.statusCode = 400;
    throw error;
  }

  if (!settings.defaultRoomTitleTemplate) {
    const error = new Error("Укажите шаблон названия встречи MTS Link.");
    error.statusCode = 400;
    throw error;
  }

  const unknownTitleVariables = collectUnknownTemplateVariables(settings.defaultRoomTitleTemplate);
  if (unknownTitleVariables.length) {
    const error = new Error(
      `В шаблоне названия MTS Link есть неизвестные переменные: ${unknownTitleVariables.join(", ")}.`,
    );
    error.statusCode = 400;
    throw error;
  }

  const unknownDescriptionVariables = collectUnknownTemplateVariables(settings.defaultRoomDescriptionTemplate);
  if (unknownDescriptionVariables.length) {
    const error = new Error(
      `В шаблоне описания MTS Link есть неизвестные переменные: ${unknownDescriptionVariables.join(", ")}.`,
    );
    error.statusCode = 400;
    throw error;
  }

  return true;
}

function formatTemplateDateTime(iso, timeZone) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: timeZone || "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function renderMtsLinkTemplate(template, context) {
  return String(template || "").replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, variableName) => {
    return context[variableName] === undefined || context[variableName] === null
      ? ""
      : String(context[variableName]);
  });
}

function getMtsLinkTemplateContext(booking, employee, settings) {
  const timeZone = settings.timeZone || booking.rules?.timeZone || "Europe/Moscow";
  return {
    clientName: booking.clientName,
    clientEmail: booking.clientEmail,
    companyName: booking.companyName,
    position: booking.position,
    start: formatTemplateDateTime(booking.start, timeZone),
    end: formatTemplateDateTime(booking.end, timeZone),
    employeeName: employee?.name || "",
    organizerName: settings.organizerName || "",
  };
}

function buildMtsLinkFormPayload(data) {
  const params = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    params.append(key, String(value));
  });
  return params;
}

function createMtsLinkError(message, responseText = "", statusCode = 502) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.responseText = responseText;
  return error;
}

async function mtsLinkRequest(settings, endpointPath, options = {}) {
  const baseUrl = validateMtsLinkBaseUrl(settings.baseUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), settings.requestTimeoutMs);
  const headers = {
    Accept: "application/json, text/plain, */*",
    "x-auth-token": settings.accessToken,
  };

  let body;
  if (options.form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = buildMtsLinkFormPayload(options.form).toString();
  }

  try {
    const response = await fetch(`${baseUrl}${endpointPath}`, {
      method: options.method || "GET",
      headers,
      body,
      signal: controller.signal,
    });
    const responseText = await response.text();
    let payload = null;

    try {
      payload = responseText ? JSON.parse(responseText) : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      throw createMtsLinkError(
        `MTS Link ответил со статусом ${response.status}.`,
        responseText,
        response.status === 400 || response.status === 401 || response.status === 403 ? 400 : 502,
      );
    }

    return { status: response.status, payload, responseText };
  } catch (error) {
    if (error.name === "AbortError") {
      throw createMtsLinkError("MTS Link не ответил вовремя.", "", 502);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function testMtsLinkConnection(settings) {
  validateMtsLinkSettings(settings);
  const result = await mtsLinkRequest(settings, "/organization/events/schedule", { method: "GET" });
  return {
    ok: true,
    status: result.status,
    message: "Подключение к MTS Link успешно.",
  };
}

async function createMtsLinkMeeting(booking, employee, settings) {
  validateMtsLinkSettings(settings);
  const templateContext = getMtsLinkTemplateContext(booking, employee, settings);
  const name = renderMtsLinkTemplate(settings.defaultRoomTitleTemplate, templateContext);
  const description = renderMtsLinkTemplate(settings.defaultRoomDescriptionTemplate, templateContext);

  const eventResponse = await mtsLinkRequest(settings, "/events", {
    method: "POST",
    form: {
      name,
      description,
      startsAtTimestamp: booking.start,
      endsAtTimestamp: booking.end,
      "accessSettings[isPasswordRequired]": "0",
      "accessSettings[isModerationRequired]": "0",
      "accessSettings[isRegistrationRequired]": "0",
    },
  });

  const eventId = eventResponse.payload?.eventId || eventResponse.payload?.id || null;
  if (!eventId) {
    throw createMtsLinkError("MTS Link не вернул eventId.", eventResponse.responseText, 502);
  }

  const sessionResponse = await mtsLinkRequest(settings, `/events/${eventId}/sessions`, {
    method: "POST",
    form: {},
  });

  return {
    provider: "mts-link",
    eventId: String(eventId),
    meetingId: String(
      sessionResponse.payload?.eventSessionId || sessionResponse.payload?.meetingId || eventId,
    ),
    meetingUrl: String(
      sessionResponse.payload?.link || eventResponse.payload?.link || sessionResponse.payload?.url || "",
    ).trim() || null,
    roomTitle: name,
    roomDescription: description,
    rawStatus: sessionResponse.status,
  };
}

async function getEmployeeCredentials(employeeId) {
  const config = await loadConfig();
  const employee = config.employees.find((item) => item.id === employeeId);

  if (!employee?.email || !employee?.password) {
    const error = new Error("Missing employee credentials");
    error.statusCode = 400;
    throw error;
  }

  return {
    employee,
    email: employee.email,
    password: employee.password,
  };
}

async function fetchDav(url, email, password, method, headers = {}, body = undefined) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: basicAuthHeader(email, password),
      "Content-Type": "application/xml; charset=utf-8",
      "User-Agent": "SmartM CalDAV Client/1.0",
      Accept: "application/xml, text/xml;q=0.9, */*;q=0.8",
      ...headers,
    },
    body,
    redirect: "follow",
  });

  const text = await response.text();

  if (!response.ok && response.status !== 207) {
    const error = new Error(`CalDAV request failed with status ${response.status}`);
    error.statusCode = response.status;
    error.responseText = text;
    throw error;
  }

  return {
    url: response.url,
    status: response.status,
    text,
  };
}

async function discoverCalendarHome(email, password) {
  const body = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:current-user-principal />
    <C:calendar-home-set />
  </D:prop>
</D:propfind>`;

  let lastError = null;

  for (const initialUrl of MAIL_RU_CALDAV_URLS) {
    try {
      const rootResponse = await fetchDav(
        initialUrl,
        email,
        password,
        "PROPFIND",
        { Depth: "0" },
        body,
      );

      const rootCalendarHome = findFirstTagValue(rootResponse.text, "calendar-home-set");
      const rootCalendarHomeHref = rootCalendarHome ? findFirstTagValue(rootCalendarHome, "href") : null;
      if (rootCalendarHomeHref) {
        return resolveHref(rootResponse.url, stripXml(rootCalendarHomeHref));
      }

      const principalTag = findFirstTagValue(rootResponse.text, "current-user-principal");
      const principalHref = principalTag ? findFirstTagValue(principalTag, "href") : null;

      if (!principalHref) {
        continue;
      }

      const principalUrl = resolveHref(rootResponse.url, stripXml(principalHref));
      const principalResponse = await fetchDav(
        principalUrl,
        email,
        password,
        "PROPFIND",
        { Depth: "0" },
        `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <C:calendar-home-set />
  </D:prop>
</D:propfind>`,
      );

      const principalCalendarHome = findFirstTagValue(principalResponse.text, "calendar-home-set");
      const principalCalendarHomeHref = principalCalendarHome
        ? findFirstTagValue(principalCalendarHome, "href")
        : null;

      if (principalCalendarHomeHref) {
        return resolveHref(principalResponse.url, stripXml(principalCalendarHomeHref));
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to discover calendar home");
}

async function fetchCalendars(email, password, homeUrl) {
  const response = await fetchDav(
    homeUrl,
    email,
    password,
    "PROPFIND",
    { Depth: "1" },
    `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:displayname />
    <D:resourcetype />
    <C:supported-calendar-component-set />
    <D:current-user-privilege-set />
  </D:prop>
</D:propfind>`,
  );

  const calendars = [];

  for (const responseXml of extractResponses(response.text)) {
    const href = findFirstTagValue(responseXml, "href");
    const resourceType = findFirstTagValue(responseXml, "resourcetype") || "";
    const supportedComponents = findFirstTagValue(responseXml, "supported-calendar-component-set") || "";
    const privileges = findFirstTagValue(responseXml, "current-user-privilege-set") || "";
    const canWrite =
      /(?:^|:)(write)(?:$|<)/i.test(privileges) ||
      /write-content/i.test(privileges) ||
      /bind/i.test(privileges);

    if (
      !href ||
      !/calendar/i.test(resourceType) ||
      (supportedComponents && !/VEVENT/i.test(supportedComponents))
    ) {
      continue;
    }

    calendars.push({
      url: resolveHref(response.url, stripXml(href)),
      name: stripXml(findFirstTagValue(responseXml, "displayname") || "") || "Calendar",
      canWrite,
    });
  }

  return calendars;
}

async function getCalendarsForUser(email, password) {
  const homeUrl = await discoverCalendarHome(email, password);
  return fetchCalendars(email, password, homeUrl);
}

async function fetchCalendarEvents(email, password, calendar, rangeStartIso, rangeEndIso) {
  const startUtc = formatUtcForCaldav(rangeStartIso);
  const endUtc = formatUtcForCaldav(rangeEndIso);

  const response = await fetchDav(
    calendar.url,
    email,
    password,
    "REPORT",
    { Depth: "1" },
    `<?xml version="1.0" encoding="utf-8"?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag />
    <C:calendar-data />
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${startUtc}" end="${endUtc}" />
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`,
  );

  const events = [];

  for (const responseXml of extractResponses(response.text)) {
    const calendarData = findFirstTagValue(responseXml, "calendar-data");
    if (!calendarData) {
      continue;
    }

    const href = findFirstTagValue(responseXml, "href");
    const etag = stripXml(findFirstTagValue(responseXml, "getetag") || "");
    const eventUrl = href ? resolveHref(response.url, stripXml(href)) : calendar.url;

    events.push(
      ...parseCalendarData(decodeXml(calendarData), calendar.name, calendar.url, {
        eventUrl,
        etag: etag || null,
      }),
    );
  }

  return events;
}

async function fetchEventsAcrossCalendars(email, password, rangeStartIso, rangeEndIso) {
  const calendars = await getCalendarsForUser(email, password);
  const perCalendarEvents = await Promise.all(
    calendars.map((calendar) =>
      fetchCalendarEvents(email, password, calendar, rangeStartIso, rangeEndIso).catch(() => []),
    ),
  );

  return {
    calendars,
    events: normalizeEventsToInstances(perCalendarEvents.flat(), rangeStartIso, rangeEndIso),
  };
}

async function putCalendarObject(email, password, eventUrl, eventIcs, options = {}) {
  parseAbsoluteUrl(eventUrl, "URL события");
  const headers = {
    Authorization: basicAuthHeader(email, password),
    "Content-Type": "text/calendar; charset=utf-8",
    "User-Agent": "SmartM CalDAV Client/1.0",
  };

  if (options.ifNoneMatch) {
    headers["If-None-Match"] = "*";
  } else if (options.etag) {
    headers["If-Match"] = options.etag;
  }

  const response = await fetch(eventUrl, {
    method: "PUT",
    headers,
    body: eventIcs,
  });

  const text = await response.text();
  if (!response.ok && response.status !== 201 && response.status !== 204) {
    const error = new Error(`PUT failed with status ${response.status}`);
    error.statusCode = response.status;
    error.responseText = text;
    error.eventUrl = eventUrl;
    throw error;
  }

  return {
    ok: true,
    eventUrl,
    etag: response.headers.get("etag"),
  };
}

async function deleteCalendarObject(email, password, eventUrl, etag = null) {
  parseAbsoluteUrl(eventUrl, "URL события");
  const response = await fetch(eventUrl, {
    method: "DELETE",
    headers: {
      Authorization: basicAuthHeader(email, password),
      "If-Match": etag || "*",
      "User-Agent": "SmartM CalDAV Client/1.0",
    },
  });

  const text = await response.text();
  if (!response.ok && response.status !== 204) {
    const error = new Error(`DELETE failed with status ${response.status}`);
    error.statusCode = response.status;
    error.responseText = text;
    error.eventUrl = eventUrl;
    throw error;
  }

  return { ok: true };
}

function buildEventUrl(calendarUrl, uid) {
  return `${ensureTrailingSlash(calendarUrl)}${uid}.ics`;
}

function normalizeEventPayload(body) {
  const calendarUrl = String(body.calendarUrl || "").trim();
  const summary = String(body.summary || "").trim();
  const description = String(body.description || "").trim();
  const location = String(body.location || "").trim();
  const start = String(body.start || body.startIso || "").trim();
  const end = String(body.end || body.endIso || "").trim();
  const uid = String(body.uid || "").trim() || null;
  const eventUrl = String(body.eventUrl || "").trim() || null;
  const etag = String(body.etag || "").trim() || null;

  if (!summary || !start || !end) {
    const error = new Error("Missing event fields");
    error.statusCode = 400;
    throw error;
  }

  if (Number.isNaN(Date.parse(start)) || Number.isNaN(Date.parse(end))) {
    const error = new Error("Invalid event dates");
    error.statusCode = 400;
    throw error;
  }

  if (new Date(end) <= new Date(start)) {
    const error = new Error("Invalid event interval");
    error.statusCode = 400;
    throw error;
  }

  return {
    calendarUrl,
    summary,
    description,
    location,
    start,
    end,
    uid,
    eventUrl,
    etag,
  };
}

function findWritableCalendar(calendars, requestedUrl) {
  if (requestedUrl) {
    return calendars.find((calendar) => calendar.url === requestedUrl) || null;
  }

  return calendars.find((calendar) => calendar.canWrite) || calendars[0] || null;
}

function assertEventUrlBelongsToCalendars(eventUrl, calendars, { requireWritable = false } = {}) {
  const parsedEventUrl = parseAbsoluteUrl(eventUrl, "URL события");
  const matchingCalendar = calendars.find((calendar) => {
    const calendarPrefix = ensureTrailingSlash(calendar.url);
    return parsedEventUrl.toString().startsWith(calendarPrefix);
  });

  if (!matchingCalendar) {
    throw createHttpError("URL события не относится к календарям текущего сотрудника.", 400);
  }

  if (requireWritable && matchingCalendar.canWrite === false) {
    throw createHttpError(`Календарь "${matchingCalendar.name}" недоступен для записи.`, 400);
  }

  return matchingCalendar;
}

async function fetchCalendarBusyIntervals(email, password, calendar, rangeStartIso, rangeEndIso) {
  const startUtc = formatUtcForCaldav(rangeStartIso);
  const endUtc = formatUtcForCaldav(rangeEndIso);

  const response = await fetchDav(
    calendar.url,
    email,
    password,
    "REPORT",
    {
      Depth: "1",
      Accept: "text/calendar, application/xml, text/xml;q=0.9, */*;q=0.8",
    },
    `<?xml version="1.0" encoding="utf-8"?>
<C:free-busy-query xmlns:C="urn:ietf:params:xml:ns:caldav">
  <C:time-range start="${startUtc}" end="${endUtc}" />
</C:free-busy-query>`,
  );

  return parseFreeBusyData(response.text);
}

async function fetchBusyIntervals(email, password, rangeStartIso, rangeEndIso) {
  const calendars = await getCalendarsForUser(email, password);

  if (calendars.length === 0) {
    return {
      calendars: [],
      events: [],
      busy: [],
    };
  }

  const allEvents = [];
  const allBusyIntervals = [];

  for (const calendar of calendars) {
    const [calendarBusyIntervals, calendarEvents] = await Promise.all([
      fetchCalendarBusyIntervals(email, password, calendar, rangeStartIso, rangeEndIso).catch(() => []),
      fetchCalendarEvents(email, password, calendar, rangeStartIso, rangeEndIso).catch(() => []),
    ]);

    allBusyIntervals.push(...calendarBusyIntervals);
    allEvents.push(...calendarEvents);
  }

  const normalizedEvents = normalizeEventsToInstances(allEvents, rangeStartIso, rangeEndIso);

  return {
    calendars,
    events: normalizedEvents,
    busy: mergeBusyIntervals(
      [...allBusyIntervals, ...getEventBusyIntervals(normalizedEvents)],
      rangeStartIso,
      rangeEndIso,
    ),
  };
}

async function fetchSharedMeetingSlots(employeeIds, rangeStartIso, rangeEndIso, rules = {}) {
  const uniqueEmployeeIds = [...new Set(employeeIds.filter(Boolean))];

  if (uniqueEmployeeIds.length !== 2) {
    const error = new Error("Exactly two employees are required");
    error.statusCode = 400;
    throw error;
  }

  const employeeResults = await Promise.all(
    uniqueEmployeeIds.map(async (employeeId) => {
      const { employee, email, password } = await getEmployeeCredentials(employeeId);
      const result = await fetchBusyIntervals(email, password, rangeStartIso, rangeEndIso);
      return {
        employee,
        ...result,
      };
    }),
  );

  const combinedBusy = employeeResults.flatMap((item) => item.busy);
  const slots = filterMeetingSlotsByRules(
    buildMeetingSlotsFromBusy(combinedBusy, rangeStartIso, rangeEndIso, 60, 30),
    rules,
  );

  return {
    employees: employeeResults.map((item) => ({
      id: item.employee.id,
      name: item.employee.name,
      email: item.employee.email,
    })),
    slots,
    busy: mergeBusyIntervals(combinedBusy, rangeStartIso, rangeEndIso),
  };
}

function getPublicSlotRules(source = {}) {
  return {
    excludedDates: Array.isArray(source.excludedDates)
      ? source.excludedDates
      : String(source.excludedDates || "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
    allowedStartTime: String(source.allowedStartTime || DEFAULT_SLOT_RULES.allowedStartTime).trim(),
    allowedEndTime: String(source.allowedEndTime || DEFAULT_SLOT_RULES.allowedEndTime).trim(),
    timeZone: String(source.timeZone || DEFAULT_SLOT_RULES.timeZone).trim(),
  };
}

function getDefaultPublicRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return {
    rangeStartIso: start.toISOString(),
    rangeEndIso: end.toISOString(),
  };
}

function sortEmployeesForBooking(employees) {
  return employees
    .map((employee, index) => ({ employee, index }))
    .sort((left, right) => {
      const priorityDiff = Number(left.employee.priority || 100) - Number(right.employee.priority || 100);
      return priorityDiff || left.index - right.index;
    })
    .map((item) => item.employee);
}

function slotKey(slot) {
  return `${slot.start}|${slot.end}`;
}

function intervalsOverlap(leftStartIso, leftEndIso, rightStartIso, rightEndIso) {
  return new Date(leftStartIso) < new Date(rightEndIso) && new Date(leftEndIso) > new Date(rightStartIso);
}

function isSlotAllowedByRules(startIso, endIso, rules) {
  return filterMeetingSlotsByRules([{ start: startIso, end: endIso }], rules).length === 1;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeAdditionalAttendees(value, clientEmail) {
  const rawItems = Array.isArray(value)
    ? value.flatMap((item) => String(item || "").split(/[\s,;]+/))
    : String(value || "")
        .split(/[\s,;]+/)
  const items = rawItems.map((item) => item.trim()).filter(Boolean);
  const clientEmailLower = String(clientEmail || "").trim().toLowerCase();
  const seen = new Set();
  const attendees = [];

  for (const item of items) {
    const email = String(item || "").trim();
    const emailLower = email.toLowerCase();

    if (!email) {
      continue;
    }

    if (!isEmail(email)) {
      const error = new Error("Invalid attendee email");
      error.statusCode = 400;
      throw error;
    }

    if (emailLower === clientEmailLower || seen.has(emailLower)) {
      continue;
    }

    seen.add(emailLower);
    attendees.push(email);
  }

  return attendees;
}

function normalizeBookingPayload(body) {
  const clientName = String(body.clientName || body.name || "").trim();
  const clientEmail = String(body.clientEmail || body.email || "").trim();
  const clientPhone = String(body.clientPhone || body.phone || "").trim();
  const companyName = String(body.companyName || body.company || "").trim();
  const position = String(body.position || body.clientPosition || "").trim();
  const additionalAttendees = normalizeAdditionalAttendees(body.additionalAttendees, clientEmail);
  const start = String(body.start || body.startIso || "").trim();
  const end = String(body.end || body.endIso || "").trim();
  const comment = String(body.comment || "").trim();
  const rules = getPublicSlotRules(body);

  if (!clientName || !clientEmail || !clientPhone || !companyName || !position) {
    const error = new Error("Missing client fields");
    error.statusCode = 400;
    throw error;
  }

  if (!isEmail(clientEmail)) {
    const error = new Error("Invalid client email");
    error.statusCode = 400;
    throw error;
  }

  if (!start || !end || Number.isNaN(Date.parse(start)) || Number.isNaN(Date.parse(end))) {
    const error = new Error("Invalid booking interval");
    error.statusCode = 400;
    throw error;
  }

  const durationMinutes = (new Date(end).getTime() - new Date(start).getTime()) / 60000;
  if (durationMinutes !== PUBLIC_DEMO_DURATION_MINUTES) {
    const error = new Error("Invalid booking duration");
    error.statusCode = 400;
    throw error;
  }

  if (!isSlotAllowedByRules(start, end, rules)) {
    const error = new Error("Slot is outside booking rules");
    error.statusCode = 400;
    throw error;
  }

  return {
    clientName,
    clientEmail,
    clientPhone,
    companyName,
    position,
    additionalAttendees,
    start,
    end,
    comment,
    rules,
  };
}

async function getPublicSlots(rangeStartIso, rangeEndIso, rules = {}) {
  const config = await loadConfig();
  const employees = sortEmployeesForBooking(config.employees).filter(
    (employee) => employee.email && employee.password,
  );
  const slotsByKey = new Map();

  for (const employee of employees) {
    try {
      const result = await fetchBusyIntervals(employee.email, employee.password, rangeStartIso, rangeEndIso);
      const employeeSlots = filterMeetingSlotsByRules(
        buildMeetingSlotsFromBusy(
          result.busy,
          rangeStartIso,
          rangeEndIso,
          PUBLIC_DEMO_DURATION_MINUTES,
          PUBLIC_DEMO_GAP_MINUTES,
        ),
        rules,
      );

      for (const slot of employeeSlots) {
        if (!slotsByKey.has(slotKey(slot))) {
          slotsByKey.set(slotKey(slot), slot);
        }
      }
    } catch {
      // Public availability should degrade quietly when one employee calendar is unavailable.
    }
  }

  return [...slotsByKey.values()].sort((left, right) => new Date(left.start) - new Date(right.start));
}

async function findEmployeeForBooking(startIso, endIso, rules = {}) {
  const config = await loadConfig();
  const employees = sortEmployeesForBooking(config.employees).filter(
    (employee) => employee.email && employee.password,
  );

  for (const employee of employees) {
    try {
      const result = await fetchBusyIntervals(employee.email, employee.password, startIso, endIso);
      const hasOverlap = result.busy.some((interval) =>
        intervalsOverlap(interval.start, interval.end, startIso, endIso),
      );
      if (hasOverlap || !isSlotAllowedByRules(startIso, endIso, rules)) {
        continue;
      }

      const calendars = result.calendars.length
        ? result.calendars
        : await getCalendarsForUser(employee.email, employee.password);
      const writableCalendar = findWritableCalendar(calendars, null);
      if (!writableCalendar || writableCalendar.canWrite === false) {
        continue;
      }

      return { employee, writableCalendar };
    } catch {
      // Try the next employee by priority.
    }
  }

  return null;
}

async function createPublicBooking(booking) {
  const config = await loadConfig();
  const target = await findEmployeeForBooking(booking.start, booking.end, booking.rules);
  if (!target) {
    const error = new Error("No available employee");
    error.statusCode = 409;
    throw error;
  }

  const mtsLinkSettings = config.mtsLink || normalizeMtsLinkSettings();
  let mtsLinkMeeting = null;

  if (mtsLinkSettings.enabled) {
    try {
      mtsLinkMeeting = await createMtsLinkMeeting(booking, target.employee, mtsLinkSettings);
      await updateConfig((currentConfig) => ({
        ...currentConfig,
        mtsLink: {
          ...currentConfig.mtsLink,
          lastSuccessMeeting: {
            createdAt: new Date().toISOString(),
            eventId: mtsLinkMeeting.eventId,
            meetingId: mtsLinkMeeting.meetingId,
            meetingUrl: mtsLinkMeeting.meetingUrl,
            rawStatus: mtsLinkMeeting.rawStatus,
          },
        },
      }));
    } catch (error) {
      console.warn(
        `[MTS Link] ${mtsLinkSettings.failureWarningText || "Бронь создана без ссылки MTS Link."}`,
        error.message,
      );
      if (!mtsLinkSettings.fallbackWithoutLink) {
        const mtsError = new Error("MTS Link is unavailable");
        mtsError.statusCode = 502;
        throw mtsError;
      }
    }
  }

  const locationParts = ["Онлайн"];
  if (mtsLinkMeeting?.meetingUrl && mtsLinkSettings.insertLinkIntoLocation) {
    locationParts.push(mtsLinkMeeting.meetingUrl);
  }

  const descriptionSections = [
    "Заявка на демо через SmartM.",
    `Клиент: ${booking.clientName}`,
    `Email: ${booking.clientEmail}`,
    `Телефон: ${booking.clientPhone}`,
    `Компания: ${booking.companyName}`,
    `Должность: ${booking.position}`,
    booking.additionalAttendees.length
      ? `Дополнительные участники: ${booking.additionalAttendees.join(", ")}`
      : "",
    booking.comment ? `Комментарий: ${booking.comment}` : "",
  ];

  if (mtsLinkMeeting?.meetingUrl && mtsLinkSettings.insertLinkIntoDescription) {
    descriptionSections.push(`Ссылка на встречу: ${mtsLinkMeeting.meetingUrl}`);
  }
  if (mtsLinkMeeting && mtsLinkSettings.appendMeetingMetaToDescription) {
    descriptionSections.push(`Создано через MTS Link.`);
    descriptionSections.push(`MTS Link Event ID: ${mtsLinkMeeting.eventId}`);
    descriptionSections.push(`MTS Link Session ID: ${mtsLinkMeeting.meetingId}`);
  }

  const uid = crypto.randomUUID();
  const description = descriptionSections.filter(Boolean).join("\n");
  const eventUrl = buildEventUrl(target.writableCalendar.url, uid);
  const eventIcs = buildEventIcs({
    uid,
    summary: `Демо Scrolltool для ${booking.companyName}`,
    description,
    location: locationParts.filter(Boolean).join(" · "),
    start: booking.start,
    end: booking.end,
    attendees: [
      {
        name: booking.clientName,
        email: booking.clientEmail,
      },
      ...booking.additionalAttendees.map((email) => ({
        name: email,
        email,
      })),
    ],
  });

  await putCalendarObject(target.employee.email, target.employee.password, eventUrl, eventIcs, {
    ifNoneMatch: true,
  });

  return {
    ok: true,
    start: booking.start,
    end: booking.end,
    mtsLinkCreated: Boolean(mtsLinkMeeting?.meetingUrl),
    meetingUrl: mtsLinkMeeting?.meetingUrl || null,
    meetingId: mtsLinkMeeting?.meetingId || null,
    provider: mtsLinkMeeting ? "mts-link" : null,
  };
}

function resolvePublicFilePath(requestPathname) {
  const decodedPath = decodeURIComponent(requestPathname);
  if (decodedPath.includes("\0")) {
    return null;
  }

  const relativePath = decodedPath.replace(/^\/+/, "");
  const resolvedPath = path.resolve(PUBLIC_DIR, relativePath);
  const publicRoot = path.resolve(PUBLIC_DIR);

  if (resolvedPath !== publicRoot && !resolvedPath.startsWith(`${publicRoot}${path.sep}`)) {
    return null;
  }

  return resolvedPath;
}

function serveFile(filePath, response) {
  const contentType =
    filePath.endsWith(".css")
      ? "text/css; charset=utf-8"
      : filePath.endsWith(".js")
        ? "application/javascript; charset=utf-8"
        : "text/html; charset=utf-8";

  return fs
    .readFile(filePath)
    .then((contents) => {
      response.writeHead(200, {
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "same-origin",
      });
      response.end(contents);
    })
    .catch(() => {
      response.writeHead(404);
      response.end("Not found");
    });
}

function handleCalDavError(response, error, fallbackMessage) {
  const statusCode =
    error.statusCode === 400
      ? 400
      : error.statusCode === 401 || error.statusCode === 403
        ? 401
        : 500;
  const message =
    statusCode === 400
      ? fallbackMessage
      : statusCode === 401
        ? "Mail.ru отклонил авторизацию. Проверьте e-mail и специальный пароль для внешнего приложения."
        : "Не удалось выполнить CalDAV-операцию.";

  if (!IS_PRODUCTION) {
    console.warn("[CalDAV]", error.message);
  }

  return json(response, statusCode, { error: message });
}

function handlePublicError(response, error) {
  setPublicCorsHeaders(response);
  const statusCode = error.statusCode === 400 || error.statusCode === 409 ? error.statusCode : 500;
  const message =
    statusCode === 400
      ? "Проверьте данные бронирования."
      : statusCode === 409
        ? "Этот слот уже недоступен. Выберите другое время."
        : "Не удалось выполнить бронирование. Попробуйте позже.";

  return json(response, statusCode, { error: message });
}

async function handleApi(request, requestUrl, response) {
  if (requestUrl.pathname.startsWith("/api/public/")) {
    setPublicCorsHeaders(response);
    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/admin/login") {
    if (!ADMIN_PASSWORD) {
      return json(response, 503, { error: "Админ-пароль не настроен на сервере." });
    }
    if (!checkRateLimit(request, "admin-login", LOGIN_RATE_LIMIT)) {
      return json(response, 429, { error: "Слишком много попыток входа. Попробуйте позже." });
    }

    const body = await readRequestBody(request);
    const username = String(body.username || "").trim();
    const password = String(body.password || "").trim();

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return json(response, 401, { error: "Неверный логин или пароль." });
    }

    const sessionToken = createSessionToken();
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": createSessionCookie(sessionToken),
    });
    response.end(JSON.stringify({ ok: true, username: ADMIN_USERNAME, csrfToken: signCsrfToken(sessionToken) }));
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/admin/logout") {
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": clearSessionCookie(),
    });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/admin/session") {
    const csrfToken = getCsrfTokenForRequest(request);
    return json(response, 200, {
      authenticated: Boolean(csrfToken),
      username: csrfToken ? ADMIN_USERNAME : null,
      csrfToken,
    });
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/public/slots") {
    if (!checkRateLimit(request, "public-slots", PUBLIC_RATE_LIMIT)) {
      return json(response, 429, { error: "Слишком много запросов. Попробуйте позже." });
    }
    const defaultRange = getDefaultPublicRange();
    const rangeStartIso = String(requestUrl.searchParams.get("rangeStartIso") || defaultRange.rangeStartIso).trim();
    const rangeEndIso = String(requestUrl.searchParams.get("rangeEndIso") || defaultRange.rangeEndIso).trim();
    const config = await loadConfig();
    const rules = getPublicSlotRules({
      ...config.meetingRules,
      allowedStartTime: requestUrl.searchParams.get("allowedStartTime") || config.meetingRules.allowedStartTime,
      allowedEndTime: requestUrl.searchParams.get("allowedEndTime") || config.meetingRules.allowedEndTime,
      timeZone: requestUrl.searchParams.get("timeZone") || config.meetingRules.timeZone,
      excludedDates: requestUrl.searchParams.get("excludedDates") || config.meetingRules.excludedDates,
    });

    try {
      assertRangeLimit(rangeStartIso, rangeEndIso, MAX_PUBLIC_RANGE_DAYS);
    } catch {
      return json(response, 400, { error: "Некорректный диапазон поиска слотов." });
    }

    try {
      const slots = await getPublicSlots(rangeStartIso, rangeEndIso, rules);
      return json(response, 200, {
        slots,
        durationMinutes: PUBLIC_DEMO_DURATION_MINUTES,
        gapMinutes: PUBLIC_DEMO_GAP_MINUTES,
        timeZone: rules.timeZone,
        meetingRules: config.meetingRules,
        appearance: config.appearance,
      });
    } catch (error) {
      return handlePublicError(response, error);
    }
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/public/appearance") {
    const config = await loadConfig();
    return json(response, 200, { appearance: config.appearance });
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/public/bookings") {
    if (!checkRateLimit(request, "public-bookings", PUBLIC_RATE_LIMIT)) {
      return json(response, 429, { error: "Слишком много запросов. Попробуйте позже." });
    }
    try {
      const booking = normalizeBookingPayload(await readRequestBody(request));
      const result = await createPublicBooking(booking);
      return json(response, 201, result);
    } catch (error) {
      return handlePublicError(response, error);
    }
  }

  if (!isAdminRequest(request)) {
    return json(response, 401, { error: "Требуется вход администратора." });
  }

  if (isAdminMutation(request, requestUrl) && !verifyCsrf(request)) {
    return json(response, 403, { error: "Некорректный CSRF-токен." });
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/config") {
    const config = await loadConfig();
    return json(response, 200, sanitizeConfigForAdmin(config));
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/config") {
    const body = await readRequestBody(request);
    const email = String(body.email || "").trim();
    const password = String(body.password || "").trim();

    if (!email || !password) {
      return json(response, 400, { error: "Укажите e-mail и пароль для внешнего приложения." });
    }

    await saveConfig({ email, password });
    return json(response, 200, { ok: true });
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/appearance") {
    const config = await loadConfig();
    return json(response, 200, { appearance: config.appearance });
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/appearance") {
    const config = await loadConfig();
    const body = await readRequestBody(request);
    const nextConfig = {
      ...config,
      appearance: body && body.reset ? DEFAULT_APPEARANCE_SETTINGS : body,
    };
    await saveConfig(nextConfig);
    return json(response, 200, { appearance: normalizeConfig(nextConfig).appearance });
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/integrations/mts-link") {
    const config = await loadConfig();
    return json(response, 200, { mtsLink: sanitizeMtsLinkForAdmin(config.mtsLink) });
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/integrations/mts-link") {
    const config = await loadConfig();
    const body = await readRequestBody(request);
    const nextSettings = normalizeMtsLinkSettings({
      ...config.mtsLink,
      ...body,
      accessToken: restoreMaskedSecret(String(body.accessToken || "").trim(), config.mtsLink?.accessToken),
      lastSuccessMeeting: config.mtsLink?.lastSuccessMeeting || null,
      lastTestAt: config.mtsLink?.lastTestAt || null,
      lastTestStatus: config.mtsLink?.lastTestStatus || null,
      lastTestMessage: config.mtsLink?.lastTestMessage || "",
    });
    validateMtsLinkSettings(nextSettings);

    const nextConfig = {
      ...config,
      mtsLink: nextSettings,
    };
    await saveConfig(nextConfig);
    return json(response, 200, { mtsLink: sanitizeMtsLinkForAdmin(nextConfig.mtsLink) });
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/integrations/mts-link/test") {
    const config = await loadConfig();
    const body = await readRequestBody(request);
    const nextSettings = normalizeMtsLinkSettings({
      ...config.mtsLink,
      ...body,
      accessToken: restoreMaskedSecret(String(body.accessToken || "").trim(), config.mtsLink?.accessToken),
    });

    try {
      const testResult = await testMtsLinkConnection(nextSettings);
      const nextConfig = {
        ...config,
        mtsLink: {
          ...config.mtsLink,
          ...nextSettings,
          lastTestAt: new Date().toISOString(),
          lastTestStatus: "success",
          lastTestMessage: testResult.message,
        },
      };
      await saveConfig(nextConfig);
      return json(response, 200, {
        ok: true,
        mtsLink: sanitizeMtsLinkForAdmin(nextConfig.mtsLink),
        status: testResult.status,
        message: testResult.message,
      });
    } catch (error) {
      const nextConfig = {
        ...config,
        mtsLink: {
          ...config.mtsLink,
          ...nextSettings,
          lastTestAt: new Date().toISOString(),
          lastTestStatus: "error",
          lastTestMessage: error.message,
        },
      };
      await saveConfig(nextConfig);
      return json(response, error.statusCode === 400 ? 400 : 502, {
        error: error.message || "Не удалось проверить подключение к MTS Link.",
        mtsLink: sanitizeMtsLinkForAdmin(nextConfig.mtsLink),
      });
    }
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/employees") {
    const config = await loadConfig();
    return json(response, 200, sanitizeConfigForAdmin(config));
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/employees") {
    const config = await loadConfig();
    const body = await readRequestBody(request);
    const employeeId = String(body.id || "").trim() || crypto.randomUUID();
    const name = String(body.name || body.email || "Сотрудник").trim();
    const email = String(body.email || "").trim();
    const existingEmployee = config.employees.find((employee) => employee.id === employeeId);
    const password = restoreMaskedSecret(String(body.password || "").trim(), existingEmployee?.password);

    if (!email || !password) {
      return json(response, 400, { error: "Укажите e-mail и пароль сотрудника." });
    }

    const employees = config.employees.filter((employee) => employee.id !== employeeId);
    employees.push({
      id: employeeId,
      name,
      email,
      password,
      priority: Math.max(1, Number(body.priority) || 100),
    });

    const nextConfig = {
      ...config,
      employees,
      activeEmployeeId: employeeId,
    };
    await saveConfig(nextConfig);
    return json(response, 200, sanitizeConfigForAdmin(nextConfig));
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/employees/active") {
    const config = await loadConfig();
    const body = await readRequestBody(request);
    const employeeId = String(body.id || "").trim();

    if (!employeeId || !config.employees.some((employee) => employee.id === employeeId)) {
      return json(response, 400, { error: "Не удалось выбрать сотрудника." });
    }

    const nextConfig = {
      ...config,
      activeEmployeeId: employeeId,
    };
    await saveConfig(nextConfig);
    return json(response, 200, sanitizeConfigForAdmin(nextConfig));
  }

  if (request.method === "DELETE" && requestUrl.pathname === "/api/employees") {
    const config = await loadConfig();
    const body = await readRequestBody(request);
    const employeeId = String(body.id || "").trim();

    if (!employeeId) {
      return json(response, 400, { error: "Не передан сотрудник для удаления." });
    }

    const employees = config.employees.filter((employee) => employee.id !== employeeId);
    const nextConfig = {
      ...config,
      employees,
      activeEmployeeId:
        config.activeEmployeeId === employeeId ? employees[0]?.id || null : config.activeEmployeeId,
    };

    await saveConfig(nextConfig);
    return json(response, 200, sanitizeConfigForAdmin(nextConfig));
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/calendars") {
    try {
      const { email, password } = await getCredentials();
      const calendars = await getCalendarsForUser(email, password);
      return json(response, 200, { calendars });
    } catch (error) {
      return handleCalDavError(response, error, "Не удалось получить список календарей.");
    }
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/events") {
    const rangeStartIso = String(requestUrl.searchParams.get("rangeStartIso") || "").trim();
    const rangeEndIso = String(requestUrl.searchParams.get("rangeEndIso") || "").trim();

    if (!rangeStartIso || !rangeEndIso) {
      return json(response, 400, { error: "Передайте rangeStartIso и rangeEndIso." });
    }

    try {
      assertRangeLimit(rangeStartIso, rangeEndIso, MAX_ADMIN_RANGE_DAYS);
    } catch (error) {
      return json(response, 400, { error: error.message });
    }

    try {
      const { email, password } = await getCredentials();
      const result = await fetchEventsAcrossCalendars(email, password, rangeStartIso, rangeEndIso);
      return json(response, 200, result);
    } catch (error) {
      return handleCalDavError(response, error, "Не удалось получить события.");
    }
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/events") {
    try {
      const body = readRequestBody(request);
      const [{ email, password }, eventData] = await Promise.all([getCredentials(), body.then(normalizeEventPayload)]);
      const calendars = await getCalendarsForUser(email, password);
      const writableCalendar = findWritableCalendar(calendars, eventData.calendarUrl);

      if (!writableCalendar) {
        return json(response, 400, { error: "Не найден календарь, доступный для записи." });
      }

      if (writableCalendar.canWrite === false) {
        return json(response, 400, {
          error: `Выбранный календарь "${writableCalendar.name}" недоступен для записи.`,
        });
      }

      const eventUrl = buildEventUrl(writableCalendar.url, eventData.uid || crypto.randomUUID());
      const eventIcs = buildEventIcs({ ...eventData, uid: eventData.uid || path.basename(eventUrl, ".ics") });
      const result = await putCalendarObject(email, password, eventUrl, eventIcs, { ifNoneMatch: true });
      return json(response, 201, { ok: true, ...result });
    } catch (error) {
      return handleCalDavError(response, error, "Не удалось создать событие.");
    }
  }

  if (request.method === "PUT" && requestUrl.pathname === "/api/events") {
    try {
      const body = await readRequestBody(request);
      const { email, password } = await getCredentials();
      const eventData = normalizeEventPayload(body);

      if (!eventData.eventUrl) {
        return json(response, 400, { error: "Для обновления нужен eventUrl." });
      }

      const calendars = await getCalendarsForUser(email, password);
      assertEventUrlBelongsToCalendars(eventData.eventUrl, calendars, { requireWritable: true });

      const eventIcs = buildEventIcs({
        ...eventData,
        uid: eventData.uid || path.basename(eventData.eventUrl, ".ics"),
      });
      const result = await putCalendarObject(
        email,
        password,
        eventData.eventUrl,
        eventIcs,
        { etag: eventData.etag },
      );
      return json(response, 200, { ok: true, ...result });
    } catch (error) {
      return handleCalDavError(response, error, "Не удалось обновить событие.");
    }
  }

  if (request.method === "DELETE" && requestUrl.pathname === "/api/events") {
    try {
      const body = await readRequestBody(request);
      const { email, password } = await getCredentials();
      const eventUrl = String(body.eventUrl || "").trim();
      const etag = String(body.etag || "").trim() || null;

      if (!eventUrl) {
        return json(response, 400, { error: "Для удаления нужен eventUrl." });
      }

      const calendars = await getCalendarsForUser(email, password);
      assertEventUrlBelongsToCalendars(eventUrl, calendars, { requireWritable: true });

      const result = await deleteCalendarObject(email, password, eventUrl, etag);
      return json(response, 200, result);
    } catch (error) {
      return handleCalDavError(response, error, "Не удалось удалить событие.");
    }
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/slots") {
    const body = await readRequestBody(request);
    const rangeStartIso = String(body.rangeStartIso || "").trim();
    const rangeEndIso = String(body.rangeEndIso || "").trim();

    if (!rangeStartIso || !rangeEndIso) {
      return json(response, 400, { error: "Не передан диапазон поиска слотов." });
    }

    try {
      assertRangeLimit(rangeStartIso, rangeEndIso, MAX_ADMIN_RANGE_DAYS);
    } catch (error) {
      return json(response, 400, { error: error.message });
    }

    try {
      const { email, password } = await getCredentials(body);
      const result = await fetchBusyIntervals(email, password, rangeStartIso, rangeEndIso);
      return json(response, 200, result);
    } catch (error) {
      return handleCalDavError(response, error, "Не удалось получить данные календаря по CalDAV.");
    }
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/meeting-slots") {
    const body = await readRequestBody(request);
    const employeeIds = Array.isArray(body.employeeIds) ? body.employeeIds.map((value) => String(value || "").trim()) : [];
    const rangeStartIso = String(body.rangeStartIso || "").trim();
    const rangeEndIso = String(body.rangeEndIso || "").trim();
    const rules = {
      excludedDates: Array.isArray(body.excludedDates) ? body.excludedDates : [],
      allowedStartTime: String(body.allowedStartTime || "").trim(),
      allowedEndTime: String(body.allowedEndTime || "").trim(),
      timeZone: String(body.timeZone || "").trim(),
    };

    if (!rangeStartIso || !rangeEndIso) {
      return json(response, 400, { error: "Не передан диапазон поиска слотов." });
    }

    try {
      assertRangeLimit(rangeStartIso, rangeEndIso, MAX_ADMIN_RANGE_DAYS);
    } catch (error) {
      return json(response, 400, { error: error.message });
    }

    try {
      const result = await fetchSharedMeetingSlots(employeeIds, rangeStartIso, rangeEndIso, rules);
      return json(response, 200, result);
    } catch (error) {
      return handleCalDavError(response, error, "Не удалось получить общие слоты встречи.");
    }
  }

  response.writeHead(404);
  response.end("Not found");
}

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);

    if (requestUrl.pathname.startsWith("/api/")) {
      await handleApi(request, requestUrl, response);
      return;
    }

    if (requestUrl.pathname === "/") {
      redirect(response, "/booking");
      return;
    }

    if (requestUrl.pathname === "/booking") {
      await serveFile(path.join(PUBLIC_DIR, "booking.html"), response);
      return;
    }

    if (requestUrl.pathname === "/admin") {
      await serveFile(path.join(PUBLIC_DIR, "index.html"), response);
      return;
    }

    const publicFilePath = resolvePublicFilePath(requestUrl.pathname);
    if (!publicFilePath) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    await serveFile(publicFilePath, response);
  } catch (error) {
    json(response, error.statusCode || 500, {
      error: error.statusCode ? error.message : "Internal server error",
    });
  }
});

if (!process.env.ADMIN_PASSWORD) {
  console.warn("[Security] ADMIN_PASSWORD is not set. Development fallback is active outside production.");
}

if (!process.env.SESSION_SECRET) {
  console.warn("[Security] SESSION_SECRET is not set. Sessions will reset on server restart.");
}

server.listen(PORT, HOST, () => {
  console.log(`SmartM is listening on http://${HOST}:${PORT}`);
});
