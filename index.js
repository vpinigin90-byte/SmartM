const fs = require("fs/promises");
const http = require("http");
const path = require("path");
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

function json(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
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

function parseCalendarData(calendarData, calendarName, calendarUrl) {
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

    if (!startEntry || status === "CANCELLED" || transparency === "TRANSPARENT") {
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

    events.push({
      calendarName,
      calendarUrl,
      uid: properties.UID?.[0]?.value || null,
      summary: properties.SUMMARY?.[0]?.value || "Busy",
      start: start.iso,
      end: end.iso,
      isAllDay: start.isDateOnly,
    });
  }

  return events;
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

async function loadConfig() {
  try {
    const fileContents = await fs.readFile(CONFIG_PATH, "utf8");
    return JSON.parse(fileContents);
  } catch (error) {
    if (error.code === "ENOENT") {
      return { email: "", password: "" };
    }

    throw error;
  }
}

async function saveConfig(config) {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
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
  </D:prop>
</D:propfind>`,
  );

  const calendars = [];

  for (const responseXml of extractResponses(response.text)) {
    const href = findFirstTagValue(responseXml, "href");
    const resourceType = findFirstTagValue(responseXml, "resourcetype") || "";
    const supportedComponents = findFirstTagValue(responseXml, "supported-calendar-component-set") || "";

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
    });
  }

  return calendars;
}

async function fetchCalendarEvents(email, password, calendar, rangeStartIso, rangeEndIso) {
  const startUtc = new Date(rangeStartIso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const endUtc = new Date(rangeEndIso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

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
    <C:calendar-data>
      <C:expand start="${startUtc}" end="${endUtc}" />
    </C:calendar-data>
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

    events.push(...parseCalendarData(decodeXml(calendarData), calendar.name, calendar.url));
  }

  return events;
}

async function fetchBusyIntervals(email, password, rangeStartIso, rangeEndIso) {
  const homeUrl = await discoverCalendarHome(email, password);
  const calendars = await fetchCalendars(email, password, homeUrl);

  if (calendars.length === 0) {
    return {
      calendars: [],
      events: [],
      busy: [],
    };
  }

  const allEvents = [];

  for (const calendar of calendars) {
    const calendarEvents = await fetchCalendarEvents(email, password, calendar, rangeStartIso, rangeEndIso);
    allEvents.push(...calendarEvents);
  }

  return {
    calendars,
    events: allEvents.sort((left, right) => new Date(left.start) - new Date(right.start)),
    busy: mergeBusyIntervals(allEvents, rangeStartIso, rangeEndIso),
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

async function handleApi(request, response) {
  if (request.method === "GET" && request.url === "/api/config") {
    const config = await loadConfig();
    return json(response, 200, config);
  }

  if (request.method === "POST" && request.url === "/api/config") {
    const body = await readRequestBody(request);
    const email = String(body.email || "").trim();
    const password = String(body.password || "").trim();

    if (!email || !password) {
      return json(response, 400, { error: "Укажите e-mail и пароль для внешнего приложения." });
    }

    await saveConfig({ email, password });
    return json(response, 200, { ok: true });
  }

  if (request.method === "POST" && request.url === "/api/slots") {
    const body = await readRequestBody(request);
    const storedConfig = await loadConfig();
    const email = String(body.email || storedConfig.email || "").trim();
    const password = String(body.password || storedConfig.password || "").trim();
    const rangeStartIso = String(body.rangeStartIso || "").trim();
    const rangeEndIso = String(body.rangeEndIso || "").trim();

    if (!email || !password) {
      return json(response, 400, { error: "Сначала сохраните e-mail и пароль для внешнего приложения." });
    }

    if (!rangeStartIso || !rangeEndIso) {
      return json(response, 400, { error: "Не передан диапазон поиска слотов." });
    }

    try {
      const result = await fetchBusyIntervals(email, password, rangeStartIso, rangeEndIso);
      return json(response, 200, result);
    } catch (error) {
      const statusCode = error.statusCode === 401 || error.statusCode === 403 ? 401 : 500;
      const message =
        statusCode === 401
          ? "Mail.ru отклонил авторизацию. Проверьте e-mail и специальный пароль для внешнего приложения."
          : "Не удалось получить данные календаря по CalDAV.";

      return json(response, statusCode, {
        error: message,
        details: error.responseText ? error.responseText.slice(0, 1000) : error.message,
      });
    }
  }

  response.writeHead(404);
  response.end("Not found");
}

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);

    if (requestUrl.pathname.startsWith("/api/")) {
      await handleApi(request, response);
      return;
    }

    if (requestUrl.pathname === "/") {
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
