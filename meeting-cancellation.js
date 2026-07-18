const CANCELLATION_RETRY_DELAYS_MS = [
  2 * 60 * 1000,
  5 * 60 * 1000,
  15 * 60 * 1000,
  30 * 60 * 1000,
  60 * 60 * 1000,
  3 * 60 * 60 * 1000,
];

const BOOKING_URL = "https://scroll-tool.ru/contacts";
const PRODUCT_URL = "https://scroll-tool.ru";
const REGISTER_URL = "https://go.scroll-tool.ru/register?partner=MeetBot";
const ACTION_STATUSES = new Set(["pending", "completed", "failed", "not_required"]);

function normalizeActionStatus(value, fallback = "not_required") {
  return ACTION_STATUSES.has(value) ? value : fallback;
}

function normalizeMeetingCancellationJobs(source = []) {
  if (!Array.isArray(source)) return [];
  return source
    .map((job) => ({
      id: String(job?.id || "").trim(),
      meetingRegistryId: String(job?.meetingRegistryId || "").trim(),
      uid: String(job?.uid || "").trim() || null,
      eventUrl: String(job?.eventUrl || "").trim() || null,
      title: String(job?.title || "").trim().slice(0, 300) || "Встреча Scrolltool",
      start: String(job?.start || "").trim(),
      end: String(job?.end || "").trim(),
      source: job?.source === "admin" ? "admin" : "calendar_sync",
      detectedAt: String(job?.detectedAt || "").trim() || null,
      completedAt: String(job?.completedAt || "").trim() || null,
      eventSessionId: String(job?.eventSessionId || "").trim() || null,
      clientChatId:
        job?.clientChatId === undefined || job?.clientChatId === null
          ? null
          : String(job.clientChatId).trim().slice(0, 80) || null,
      clientName: String(job?.clientName || "").trim().slice(0, 120),
      mtsStatus: normalizeActionStatus(job?.mtsStatus, job?.eventSessionId ? "pending" : "not_required"),
      mtsAttempts: Math.max(0, Number(job?.mtsAttempts) || 0),
      mtsNextAttemptAt: String(job?.mtsNextAttemptAt || "").trim() || null,
      mtsDeletedAt: String(job?.mtsDeletedAt || "").trim() || null,
      mtsLastError: String(job?.mtsLastError || "").trim().slice(0, 500),
      telegramStatus: normalizeActionStatus(job?.telegramStatus, job?.clientChatId ? "pending" : "not_required"),
      telegramAttempts: Math.max(0, Number(job?.telegramAttempts) || 0),
      telegramNextAttemptAt: String(job?.telegramNextAttemptAt || "").trim() || null,
      telegramSentAt: String(job?.telegramSentAt || "").trim() || null,
      telegramLastError: String(job?.telegramLastError || "").trim().slice(0, 500),
    }))
    .filter((job) => /^[A-Za-z0-9_-]{16,80}$/.test(job.id) && job.meetingRegistryId && job.start && job.end)
    .slice(-500);
}

function createMeetingCancellationJob({
  id,
  meeting,
  reminder = null,
  source = "calendar_sync",
  now = new Date().toISOString(),
}) {
  const eventSessionId = String(meeting?.mtsLink?.eventSessionId || "").trim() || null;
  const clientChatId = String(reminder?.clientChatId || "").trim() || null;
  return normalizeMeetingCancellationJobs([{
    id,
    meetingRegistryId: meeting.id,
    uid: meeting.uid,
    eventUrl: meeting.eventUrl,
    title: meeting.title,
    start: meeting.start,
    end: meeting.end,
    source,
    detectedAt: now,
    eventSessionId,
    clientChatId,
    clientName: reminder?.clientName || "",
    mtsStatus: eventSessionId ? "pending" : "not_required",
    mtsNextAttemptAt: eventSessionId ? now : null,
    telegramStatus: clientChatId ? "pending" : "not_required",
    telegramNextAttemptAt: clientChatId ? now : null,
  }])[0] || null;
}

function isCancellationActionDue(status, nextAttemptAt, nowMs = Date.now()) {
  if (status !== "pending") return false;
  const nextAttemptMs = Date.parse(nextAttemptAt || "");
  return !Number.isFinite(nextAttemptMs) || nextAttemptMs <= nowMs;
}

function getCancellationRetryAt(attempts, nowMs = Date.now(), retryAfterMs = 0) {
  const delayIndex = Math.min(
    Math.max(0, Number(attempts) - 1),
    CANCELLATION_RETRY_DELAYS_MS.length - 1,
  );
  const delayMs = Math.max(
    CANCELLATION_RETRY_DELAYS_MS[delayIndex],
    Math.max(0, Number(retryAfterMs) || 0),
  );
  return new Date(nowMs + delayMs).toISOString();
}

function isCancellationJobComplete(job) {
  return ["completed", "failed", "not_required"].includes(job.mtsStatus)
    && ["completed", "failed", "not_required"].includes(job.telegramStatus);
}

function formatMeetingDetails(record) {
  const start = new Date(record.start);
  const end = new Date(record.end);
  const date = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(start).replace(/\s*г\.$/, "");
  const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
  });
  return {
    date,
    startTime: timeFormatter.format(start),
    endTime: timeFormatter.format(end),
  };
}

function buildTelegramCancellationMessage(record) {
  const details = formatMeetingDetails(record);
  return [
    "Встреча отменена",
    "",
    `Встреча ${details.date}, с ${details.startTime} до ${details.endTime} отменена.`,
    "",
    "Мы всегда готовы к демонстрации возможностей Scrolltool.",
    "",
    "Для повторной записи воспользуйтесь сервисом бронирования на странице:",
    BOOKING_URL,
    "",
    "А больше информации и примеров вы найдёте на главной странице нашего сайта:",
    PRODUCT_URL,
  ].join("\n");
}

function buildTelegramCancellationKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "Попробовать Scrolltool", url: REGISTER_URL }],
      [{ text: "Записаться повторно", url: BOOKING_URL }],
    ],
  };
}

module.exports = {
  buildTelegramCancellationKeyboard,
  buildTelegramCancellationMessage,
  createMeetingCancellationJob,
  getCancellationRetryAt,
  isCancellationActionDue,
  isCancellationJobComplete,
  normalizeMeetingCancellationJobs,
};
