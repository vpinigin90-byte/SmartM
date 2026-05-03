const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const statusNode = document.querySelector("#status");
const summaryNode = document.querySelector("#summary");
const slotsNode = document.querySelector("#slots");
const saveButton = document.querySelector("#save-button");
const checkButton = document.querySelector("#check-button");
const togglePasswordButton = document.querySelector("#toggle-password");
const togglePasswordLabel = document.querySelector(".toggle-label");
const credentialsForm = document.querySelector("#credentials-form");

function setStatus(message, kind = "") {
  statusNode.textContent = message;
  statusNode.className = `status${kind ? ` ${kind}` : ""}`;
}

function toLocalDayStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toLocalDayEnd(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatTimeLabel(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatInterval(start, end) {
  const isMidnightEnd =
    end.getHours() === 0 &&
    end.getMinutes() === 0 &&
    end.getSeconds() === 0 &&
    end.getTime() > start.getTime();

  return `${formatTimeLabel(start)} - ${isMidnightEnd ? "24:00" : formatTimeLabel(end)}`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildFreeSlots(busyIntervals, rangeStart, rangeEnd) {
  const busy = busyIntervals
    .map((interval) => ({
      start: new Date(interval.start),
      end: new Date(interval.end),
    }))
    .sort((left, right) => left.start - right.start);

  const days = [];

  for (
    let cursor = toLocalDayStart(rangeStart);
    cursor < rangeEnd;
    cursor = toLocalDayEnd(cursor)
  ) {
    const dayStart = new Date(cursor);
    const dayEnd = toLocalDayEnd(dayStart);
    const dayBusy = busy
      .map((interval) => ({
        start: new Date(Math.max(interval.start.getTime(), dayStart.getTime())),
        end: new Date(Math.min(interval.end.getTime(), dayEnd.getTime())),
      }))
      .filter((interval) => interval.end > interval.start);

    const free = [];
    let freeStart = new Date(dayStart);

    for (const interval of dayBusy) {
      if (interval.start > freeStart) {
        free.push({ start: new Date(freeStart), end: new Date(interval.start) });
      }

      if (interval.end > freeStart) {
        freeStart = new Date(interval.end);
      }
    }

    if (freeStart < dayEnd) {
      free.push({ start: freeStart, end: dayEnd });
    }

    days.push({
      date: new Date(dayStart),
      free,
    });
  }

  return days;
}

function groupEventsByDay(events, rangeStart, rangeEnd) {
  const buckets = new Map();

  for (
    let cursor = toLocalDayStart(rangeStart);
    cursor < rangeEnd;
    cursor = toLocalDayEnd(cursor)
  ) {
    buckets.set(toLocalDayStart(cursor).toISOString(), []);
  }

  for (const event of events) {
    const eventStart = new Date(event.start);
    const dayKey = toLocalDayStart(eventStart).toISOString();

    if (!buckets.has(dayKey)) {
      buckets.set(dayKey, []);
    }

    buckets.get(dayKey).push(event);
  }

  return buckets;
}

function renderSlots(result, rangeStart, rangeEnd) {
  const days = buildFreeSlots(result.busy, rangeStart, rangeEnd);
  const eventsByDay = groupEventsByDay(result.events, rangeStart, rangeEnd);
  const calendarsCount = result.calendars.length;
  const eventsCount = result.events.length;

  summaryNode.textContent = `Проверено календарей: ${calendarsCount}. Найдено занятых событий: ${eventsCount}. Свободные окна считаются как интервалы без занятых событий в выбранном диапазоне.`;

  const html = days
    .map((day) => {
      const dayKey = toLocalDayStart(day.date).toISOString();
      const dayEvents = eventsByDay.get(dayKey) || [];
      const freeList = day.free.length
        ? `<ul class="slot-list">${day.free
            .map(
              (slot) => `
                <li class="slot-item">
                  <strong>${formatInterval(slot.start, slot.end)}</strong>
                  <span>свободно</span>
                </li>`,
            )
            .join("")}</ul>`
        : `<p>Свободных окон нет.</p>`;

      const eventList = dayEvents.length
        ? `<div class="day-grid">
            <h4>Занятые события</h4>
            <ul class="event-list">${dayEvents
              .map(
                (event) => `
                  <li class="event-item">
                    <strong>${escapeHtml(event.summary)}</strong>
                    <span class="event-meta">${event.isAllDay ? "весь день" : formatInterval(new Date(event.start), new Date(event.end))} · ${escapeHtml(event.calendarName)}</span>
                  </li>`,
              )
              .join("")}</ul>
          </div>`
        : "";

      return `
        <article class="day-card">
          <h3>${formatDateLabel(day.date)}</h3>
          ${freeList}
          ${eventList}
        </article>`;
    })
    .join("");

  slotsNode.classList.remove("empty");
  slotsNode.innerHTML = html;
}

async function loadSavedConfig() {
  const response = await fetch("/api/config");
  const config = await response.json();
  emailInput.value = config.email || "";
  passwordInput.value = config.password || "";
}

async function saveCredentials() {
  setStatus("Сохраняю данные...", "");
  saveButton.disabled = true;

  try {
    const response = await fetch("/api/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value.trim(),
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Не удалось сохранить данные.");
    }

    setStatus("Данные сохранены.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    saveButton.disabled = false;
  }
}

async function checkSlots() {
  const rangeStart = toLocalDayStart(new Date());
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 14);

  setStatus("Проверяю календари Mail.ru по CalDAV...", "");
  checkButton.disabled = true;

  try {
    const response = await fetch("/api/slots", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value.trim(),
        rangeStartIso: rangeStart.toISOString(),
        rangeEndIso: rangeEnd.toISOString(),
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Не удалось получить слоты.");
    }

    renderSlots(payload, rangeStart, rangeEnd);
    setStatus("Слоты обновлены.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    checkButton.disabled = false;
  }
}

credentialsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveCredentials();
});

checkButton.addEventListener("click", async () => {
  await checkSlots();
});

togglePasswordButton.addEventListener("click", () => {
  const shouldShowPassword = passwordInput.type === "password";
  passwordInput.type = shouldShowPassword ? "text" : "password";
  togglePasswordLabel.textContent = shouldShowPassword ? "Скрыть" : "Показать";
  togglePasswordButton.setAttribute(
    "aria-label",
    shouldShowPassword ? "Скрыть пароль" : "Показать пароль",
  );
});

loadSavedConfig().catch(() => {
  setStatus("Не удалось загрузить сохранённые данные.", "error");
});
