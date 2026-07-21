function getTimeZoneParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  if (parts.hour === "24") {
    parts.hour = "00";
  }
  return parts;
}

function formatMtsLinkDateTime(iso, timeZone = "Europe/Moscow") {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = getTimeZoneParts(date, timeZone || "Europe/Moscow");
  const localAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  const offsetMinutes = Math.round((localAsUtc - date.getTime()) / 60000);
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0");
  const offsetRemainder = String(absoluteOffset % 60).padStart(2, "0");

  return [
    `${parts.year}-${parts.month}-${parts.day}`,
    `T${parts.hour}:${parts.minute}:${parts.second}`,
    `${sign}${offsetHours}:${offsetRemainder}`,
  ].join("");
}

function buildMtsLinkEventDeliverySettings(iso, timeZone) {
  return {
    startsAtTimestamp: formatMtsLinkDateTime(iso, timeZone),
    startType: "autostart",
    lang: "RU",
    defaultRemindersEnabled: "false",
  };
}

module.exports = {
  buildMtsLinkEventDeliverySettings,
  formatMtsLinkDateTime,
};
