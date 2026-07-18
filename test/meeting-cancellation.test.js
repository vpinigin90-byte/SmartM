const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildTelegramCancellationKeyboard,
  buildTelegramCancellationMessage,
  createMeetingCancellationJob,
  getCancellationRetryAt,
  isCancellationActionDue,
  isCancellationJobComplete,
  normalizeMeetingCancellationJobs,
} = require("../meeting-cancellation");

const meeting = {
  id: "meeting-registry-entry",
  uid: "calendar-uid",
  eventUrl: "https://calendar.example/events/calendar-uid.ics",
  title: "Демо Scrolltool",
  start: "2026-07-20T09:00:00.000Z",
  end: "2026-07-20T10:00:00.000Z",
  mtsLink: {
    eventSessionId: "21825537754",
  },
};

test("creates independent MTS Link and Telegram cancellation actions", () => {
  const job = createMeetingCancellationJob({
    id: "12345678-1234-4234-8234-123456789012",
    meeting,
    reminder: {
      clientChatId: "8950699427",
      clientName: "Анна",
    },
    now: "2026-07-18T12:00:00.000Z",
  });

  assert.equal(job.mtsStatus, "pending");
  assert.equal(job.telegramStatus, "pending");
  assert.equal(job.eventSessionId, "21825537754");
  assert.equal(job.clientChatId, "8950699427");
  assert.equal(isCancellationJobComplete(job), false);
});

test("marks missing integrations as not required", () => {
  const job = createMeetingCancellationJob({
    id: "12345678-1234-4234-8234-123456789013",
    meeting: { ...meeting, mtsLink: null },
    now: "2026-07-18T12:00:00.000Z",
  });

  assert.equal(job.mtsStatus, "not_required");
  assert.equal(job.telegramStatus, "not_required");
  assert.equal(isCancellationJobComplete(job), true);
});

test("uses increasing retry delays and honors Retry-After", () => {
  const now = Date.parse("2026-07-18T12:00:00.000Z");

  assert.equal(
    getCancellationRetryAt(1, now),
    "2026-07-18T12:02:00.000Z",
  );
  assert.equal(
    getCancellationRetryAt(2, now),
    "2026-07-18T12:05:00.000Z",
  );
  assert.equal(
    getCancellationRetryAt(1, now, 10 * 60 * 1000),
    "2026-07-18T12:10:00.000Z",
  );
});

test("runs only pending actions whose retry time has arrived", () => {
  const now = Date.parse("2026-07-18T12:00:00.000Z");

  assert.equal(isCancellationActionDue("pending", "2026-07-18T11:59:59.000Z", now), true);
  assert.equal(isCancellationActionDue("pending", "2026-07-18T12:00:01.000Z", now), false);
  assert.equal(isCancellationActionDue("completed", "2026-07-18T11:00:00.000Z", now), false);
});

test("builds the approved Telegram cancellation message and links", () => {
  const text = buildTelegramCancellationMessage(meeting);
  const keyboard = buildTelegramCancellationKeyboard();

  assert.match(text, /^Встреча отменена/);
  assert.match(text, /20 июля 2026/);
  assert.match(text, /с 12:00 до 13:00 отменена/);
  assert.match(text, /https:\/\/scroll-tool\.ru\/contacts/);
  assert.match(text, /https:\/\/scroll-tool\.ru$/);
  assert.deepEqual(keyboard.inline_keyboard, [
    [{
      text: "Попробовать Scrolltool",
      url: "https://go.scroll-tool.ru/register?partner=MeetBot",
    }],
    [{
      text: "Записаться повторно",
      url: "https://scroll-tool.ru/contacts",
    }],
  ]);
});

test("drops malformed persisted cancellation jobs", () => {
  const jobs = normalizeMeetingCancellationJobs([
    {
      id: "short",
      meetingRegistryId: "meeting",
      start: meeting.start,
      end: meeting.end,
    },
  ]);

  assert.deepEqual(jobs, []);
});
