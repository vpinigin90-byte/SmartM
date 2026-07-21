const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildMtsLinkEventAccessSettings,
  buildMtsLinkEventDeliverySettings,
  formatMtsLinkDateTime,
  getMtsLinkMeetingUrl,
} = require("../mts-link");

test("formats MTS Link timestamps with the configured time-zone offset", () => {
  assert.equal(
    formatMtsLinkDateTime("2026-07-21T12:00:00.000Z", "Europe/Moscow"),
    "2026-07-21T15:00:00+03:00",
  );
  assert.equal(
    formatMtsLinkDateTime("2026-07-21T12:00:00.000Z", "America/New_York"),
    "2026-07-21T08:00:00-04:00",
  );
});

test("disables MTS Link standard reminders for calendar-managed bookings", () => {
  assert.deepEqual(
    buildMtsLinkEventDeliverySettings("2026-07-21T12:00:00.000Z", "Europe/Moscow"),
    {
      startsAtTimestamp: "2026-07-21T15:00:00+03:00",
      startType: "autostart",
      lang: "RU",
      defaultRemindersEnabled: "false",
    },
  );
});

test("creates MTS Link meetings with free access", () => {
  assert.deepEqual(buildMtsLinkEventAccessSettings(), {
    "accessSettings[isPasswordRequired]": "0",
    "accessSettings[isModerationRequired]": "0",
    "accessSettings[isRegistrationRequired]": "0",
  });
});

test("uses the common EventSession link without participant registration", () => {
  assert.equal(
    getMtsLinkMeetingUrl(
      { link: "https://my.mts-link.ru/common-session" },
      { link: "https://my.mts-link.ru/event-landing" },
    ),
    "https://my.mts-link.ru/common-session",
  );
});

test("returns an empty MTS Link timestamp for an invalid date", () => {
  assert.equal(formatMtsLinkDateTime("invalid", "Europe/Moscow"), "");
});
