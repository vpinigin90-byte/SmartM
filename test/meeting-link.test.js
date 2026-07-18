const assert = require("node:assert/strict");
const test = require("node:test");

const {
  normalizeExternalMeetingUrl,
  shouldCreateMtsLink,
} = require("../meeting-link");

test("normalizes a valid external HTTPS meeting link", () => {
  assert.equal(
    normalizeExternalMeetingUrl("  https://video.example.com/room?id=42#join  "),
    "https://video.example.com/room?id=42#join",
  );
});

test("rejects unsafe or malformed external meeting links", () => {
  assert.throws(
    () => normalizeExternalMeetingUrl("http://video.example.com/room"),
    /HTTPS/,
  );
  assert.throws(
    () => normalizeExternalMeetingUrl("https://user:password@video.example.com/room"),
    /без логина и пароля/,
  );
  assert.throws(
    () => normalizeExternalMeetingUrl("not a link"),
    /корректную ссылку/,
  );
});

test("skips MTS Link creation when an external meeting link is present", () => {
  const settings = { enabled: true };

  assert.equal(
    shouldCreateMtsLink({ externalMeetingUrl: "https://video.example.com/room" }, settings),
    false,
  );
  assert.equal(shouldCreateMtsLink({ externalMeetingUrl: "" }, settings), true);
  assert.equal(shouldCreateMtsLink({ externalMeetingUrl: "" }, { enabled: false }), false);
});
