const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildMtsLinkEventDeliverySettings,
  formatMtsLinkDateTime,
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

test("returns an empty MTS Link timestamp for an invalid date", () => {
  assert.equal(formatMtsLinkDateTime("invalid", "Europe/Moscow"), "");
});
