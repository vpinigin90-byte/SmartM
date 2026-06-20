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
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Zz123456";
const SESSION_COOKIE = "smartm_admin";
const SESSION_SECRET = "smartm-temporary-admin-session-secret";
const PUBLIC_DEMO_DURATION_MINUTES = 60;
const PUBLIC_DEMO_GAP_MINUTES = 30;
const DEFAULT_SLOT_RULES = {
  allowedStartTime: "09:00",
  allowedEndTime: "18:00",
  timeZone: "Europe/Moscow",
  excludedDates: [],
};

function normalizeConfig(config = {}) {
  if (Array.isArray(config.employees)) {
    return {
      employees: config.employees.map((employee) => ({
        id: String(employee.id || crypto.randomUUID()),
        name: String(employee.name || employee.email || "Сотрудник").trim(),
        email: String(employee.email || "").trim(),
        password: String(employee.password || "").trim(),
        priority: Math.max(1, Number(employee.priority) || 100),
      })),
      activeEmployeeId: config.activeEmployeeId ? String(config.activeEmployeeId) : null,
    };
  }

  const email = String(config.email || "").trim();
  const password = String(config.password || "").trim();

  if (!email && !password) {
    return { employees: [], activeEmployeeId: null };
  }

  const employeeId = crypto.randomUUID();
  return {
    employees: [
      {
        id: employeeId,
        name: email || "Сотрудник",
        email,
        password,
        priority: 1,
      },
    ],
    activeEmployeeId: employeeId,
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
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
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

function signSessionPayload(payload) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

function createSessionCookie() {
  const payload = Buffer.from(
    JSON.stringify({
      username: ADMIN_USERNAME,
      expiresAt: Date.now() + 12 * 60 * 60 * 1000,
    }),
    "utf8",
  ).toString("base64url");
  const signature = signSessionPayload(payload);

  return `${SESSION_COOKIE}=${encodeURIComponent(`${payload}.${signature}`)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
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

function basicAuthHeader(email, password) {
  return `Basic ${Buffer.from(`${email}:${password}`, "utf8").toString("base64")}`;
}

function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

function resolveHref(baseUrl, href) {
  return new URL(href, baseUrl).toString();
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
      return { employees: [], activeEmployeeId: null };
    }

    throw error;
  }
}

async function saveConfig(config) {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(normalizeConfig(config), null, 2), "utf8");
}

async function readRequestBody(request) {
  const chunks = [];

  for await (const chunk of request) {
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

function normalizeBookingPayload(body) {
  const clientName = String(body.clientName || body.name || "").trim();
  const clientEmail = String(body.clientEmail || body.email || "").trim();
  const clientPhone = String(body.clientPhone || body.phone || "").trim();
  const start = String(body.start || body.startIso || "").trim();
  const end = String(body.end || body.endIso || "").trim();
  const comment = String(body.comment || "").trim();
  const rules = getPublicSlotRules(body);

  if (!clientName || !clientEmail || !clientPhone) {
    const error = new Error("Missing client fields");
    error.statusCode = 400;
    throw error;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
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
  const target = await findEmployeeForBooking(booking.start, booking.end, booking.rules);
  if (!target) {
    const error = new Error("No available employee");
    error.statusCode = 409;
    throw error;
  }

  const uid = crypto.randomUUID();
  const description = [
    "Заявка на демо через SmartM.",
    `Клиент: ${booking.clientName}`,
    `Email: ${booking.clientEmail}`,
    `Телефон: ${booking.clientPhone}`,
    booking.comment ? `Комментарий: ${booking.comment}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const eventUrl = buildEventUrl(target.writableCalendar.url, uid);
  const eventIcs = buildEventIcs({
    uid,
    summary: `Демо SmartM: ${booking.clientName}`,
    description,
    location: "Онлайн",
    start: booking.start,
    end: booking.end,
    attendees: [
      {
        name: booking.clientName,
        email: booking.clientEmail,
      },
    ],
  });

  await putCalendarObject(target.employee.email, target.employee.password, eventUrl, eventIcs, {
    ifNoneMatch: true,
  });

  return {
    ok: true,
    start: booking.start,
    end: booking.end,
  };
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
      response.writeHead(200, { "Content-Type": contentType });
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

  return json(response, statusCode, {
    error: message,
    details: JSON.stringify({
      message: error.responseText ? error.responseText.slice(0, 1200) : error.message,
      eventUrl: error.eventUrl || null,
    }),
  });
}

function handlePublicError(response, error) {
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
  if (request.method === "POST" && requestUrl.pathname === "/api/admin/login") {
    const body = await readRequestBody(request);
    const username = String(body.username || "").trim();
    const password = String(body.password || "").trim();

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return json(response, 401, { error: "Неверный логин или пароль." });
    }

    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": createSessionCookie(),
    });
    response.end(JSON.stringify({ ok: true, username: ADMIN_USERNAME }));
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
    return json(response, 200, {
      authenticated: isAdminRequest(request),
      username: isAdminRequest(request) ? ADMIN_USERNAME : null,
    });
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/public/slots") {
    const defaultRange = getDefaultPublicRange();
    const rangeStartIso = String(requestUrl.searchParams.get("rangeStartIso") || defaultRange.rangeStartIso).trim();
    const rangeEndIso = String(requestUrl.searchParams.get("rangeEndIso") || defaultRange.rangeEndIso).trim();
    const rules = getPublicSlotRules({
      allowedStartTime: requestUrl.searchParams.get("allowedStartTime"),
      allowedEndTime: requestUrl.searchParams.get("allowedEndTime"),
      timeZone: requestUrl.searchParams.get("timeZone"),
      excludedDates: requestUrl.searchParams.get("excludedDates"),
    });

    if (Number.isNaN(Date.parse(rangeStartIso)) || Number.isNaN(Date.parse(rangeEndIso))) {
      return json(response, 400, { error: "Некорректный диапазон поиска слотов." });
    }

    try {
      const slots = await getPublicSlots(rangeStartIso, rangeEndIso, rules);
      return json(response, 200, {
        slots,
        durationMinutes: PUBLIC_DEMO_DURATION_MINUTES,
        gapMinutes: PUBLIC_DEMO_GAP_MINUTES,
        timeZone: rules.timeZone,
      });
    } catch (error) {
      return handlePublicError(response, error);
    }
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/public/bookings") {
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

  if (request.method === "GET" && requestUrl.pathname === "/api/config") {
    const config = await loadConfig();
    return json(response, 200, config);
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

  if (request.method === "GET" && requestUrl.pathname === "/api/employees") {
    const config = await loadConfig();
    return json(response, 200, config);
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/employees") {
    const config = await loadConfig();
    const body = await readRequestBody(request);
    const employeeId = String(body.id || "").trim() || crypto.randomUUID();
    const name = String(body.name || body.email || "Сотрудник").trim();
    const email = String(body.email || "").trim();
    const password = String(body.password || "").trim();

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
      employees,
      activeEmployeeId: employeeId,
    };
    await saveConfig(nextConfig);
    return json(response, 200, nextConfig);
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
    return json(response, 200, nextConfig);
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
      employees,
      activeEmployeeId:
        config.activeEmployeeId === employeeId ? employees[0]?.id || null : config.activeEmployeeId,
    };

    await saveConfig(nextConfig);
    return json(response, 200, nextConfig);
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

    await serveFile(path.join(PUBLIC_DIR, requestUrl.pathname), response);
  } catch (error) {
    json(response, 500, {
      error: "Internal server error",
      details: error.message,
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`SmartM is listening on http://${HOST}:${PORT}`);
});
