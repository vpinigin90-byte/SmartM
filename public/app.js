const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const employeeIdInput = document.querySelector("#employee-id");
const employeeNameInput = document.querySelector("#employee-name");
const employeePanelTitle = document.querySelector("#employee-panel-title");
const statusNode = document.querySelector("#status");
const summaryNode = document.querySelector("#summary");
const eventsSummaryNode = document.querySelector("#events-summary");
const slotsNode = document.querySelector("#slots");
const eventsNode = document.querySelector("#events");
const employeesListNode = document.querySelector("#employees-list");
const saveButton = document.querySelector("#save-button");
const checkButton = document.querySelector("#check-button");
const reloadCalendarsButton = document.querySelector("#reload-calendars-button");
const loadEventsButton = document.querySelector("#load-events-button");
const addEmployeeButton = document.querySelector("#add-employee-button");
const toggleEventFormButton = document.querySelector("#toggle-event-form-button");
const eventFormPanel = document.querySelector("#event-form-panel");
const togglePasswordButton = document.querySelector("#toggle-password");
const togglePasswordLabel = document.querySelector(".toggle-label");
const credentialsForm = document.querySelector("#credentials-form");
const calendarSelect = document.querySelector("#calendar-select");
const eventForm = document.querySelector("#event-form");
const eventSubmitButton = document.querySelector("#event-submit-button");
const eventResetButton = document.querySelector("#event-reset-button");
const eventUrlInput = document.querySelector("#event-url");
const eventUidInput = document.querySelector("#event-uid");
const eventEtagInput = document.querySelector("#event-etag");
const eventSummaryInput = document.querySelector("#event-summary");
const eventStartInput = document.querySelector("#event-start");
const eventEndInput = document.querySelector("#event-end");
const eventLocationInput = document.querySelector("#event-location");
const eventDescriptionInput = document.querySelector("#event-description");
const tabButtons = [...document.querySelectorAll(".tab-button")];
const tabPanels = [...document.querySelectorAll("[data-tab-panel]")];

const state = {
  employees: [],
  activeEmployeeId: null,
  calendars: [],
  events: [],
  eventsRangeStart: null,
  eventsRangeEnd: null,
  eventFormVisible: false,
};

function setStatus(message, kind = "") {
  statusNode.textContent = message;
  statusNode.className = `status${kind ? ` ${kind}` : ""}`;
}

function getActiveEmployee() {
  return (
    state.employees.find((employee) => employee.id === state.activeEmployeeId) ||
    state.employees[0] ||
    null
  );
}

function switchTab(tabName) {
  tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });
  tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.tabPanel === tabName);
  });
}

function renderEmployees() {
  if (!state.employees.length) {
    employeesListNode.classList.add("empty");
    employeesListNode.innerHTML = "<p>Сотрудников пока нет.</p>";
    return;
  }

  employeesListNode.classList.remove("empty");
  employeesListNode.innerHTML = state.employees
    .map(
      (employee) => `
        <article class="employee-card${employee.id === state.activeEmployeeId ? " active" : ""}">
          <div class="employee-card-head">
            <div>
              <strong>${escapeHtml(employee.name)}</strong>
              <p>${escapeHtml(employee.email)}</p>
            </div>
            ${employee.id === state.activeEmployeeId ? '<span class="employee-badge">Активный</span>' : ""}
          </div>
          <div class="employee-card-actions">
            <button class="ghost-button" type="button" data-action="select-employee" data-id="${escapeHtml(employee.id)}">
              Открыть
            </button>
            <button class="secondary-button danger-button" type="button" data-action="delete-employee" data-id="${escapeHtml(employee.id)}">
              Удалить
            </button>
          </div>
        </article>`,
    )
    .join("");
}

function fillEmployeeForm(employee = null) {
  const activeEmployee = employee || getActiveEmployee();

  if (!activeEmployee) {
    employeeIdInput.value = "";
    employeeNameInput.value = "";
    emailInput.value = "";
    passwordInput.value = "";
    employeePanelTitle.textContent = "Новый сотрудник";
    return;
  }

  employeeIdInput.value = activeEmployee.id;
  employeeNameInput.value = activeEmployee.name;
  emailInput.value = activeEmployee.email;
  passwordInput.value = activeEmployee.password;
  employeePanelTitle.textContent = activeEmployee.name;
}

function startNewEmployee() {
  employeeIdInput.value = "";
  employeeNameInput.value = "";
  emailInput.value = "";
  passwordInput.value = "";
  employeePanelTitle.textContent = "Новый сотрудник";
}

function applyEmployeesConfig(config) {
  state.employees = config.employees || [];
  state.activeEmployeeId =
    config.activeEmployeeId || state.employees[0]?.id || null;
  renderEmployees();
  fillEmployeeForm();
}

function setEventFormVisibility(visible) {
  state.eventFormVisible = visible;
  eventFormPanel.classList.toggle("hidden-panel", !visible);
  toggleEventFormButton.textContent = visible ? "Скрыть форму встреч" : "Показать форму встреч";
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

function formatDateTimeLabel(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toDateTimeLocalValue(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDateTimeLocalValue(value) {
  return new Date(value).toISOString();
}

function getDefaultEventsRange() {
  const start = toLocalDayStart(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  return { start, end };
}

function buildFreeSlots(busyIntervals, rangeStart, rangeEnd) {
  const busy = busyIntervals
    .map((interval) => ({
      start: new Date(interval.start),
      end: new Date(interval.end),
    }))
    .sort((left, right) => left.start - right.start);

  const days = [];

  for (let cursor = toLocalDayStart(rangeStart); cursor < rangeEnd; cursor = toLocalDayEnd(cursor)) {
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

    days.push({ date: new Date(dayStart), free });
  }

  return days;
}

function groupEventsByDay(events, rangeStart, rangeEnd) {
  const buckets = new Map();

  for (let cursor = toLocalDayStart(rangeStart); cursor < rangeEnd; cursor = toLocalDayEnd(cursor)) {
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

  summaryNode.textContent = `Проверено календарей: ${result.calendars.length}. Найдено событий: ${result.events.length}. Свободные окна считаются как интервалы без busy-слотов.`;

  const html = days
    .map((day) => {
      const dayKey = toLocalDayStart(day.date).toISOString();
      const dayEvents = eventsByDay.get(dayKey) || [];
      const freeList = day.free.length
        ? `<ul class="slot-list">${day.free
            .map((slot) => `<li class="slot-item"><strong>${formatInterval(slot.start, slot.end)}</strong><span>свободно</span></li>`)
            .join("")}</ul>`
        : "<p>Свободных окон нет.</p>";

      const eventList = dayEvents.length
        ? `<div class="day-grid"><h4>Занятые события</h4><ul class="event-list">${dayEvents
            .map((event) => `<li class="event-item"><strong>${escapeHtml(event.summary)}</strong><span class="event-meta">${event.isAllDay ? "весь день" : formatInterval(new Date(event.start), new Date(event.end))} · ${escapeHtml(event.calendarName)}</span></li>`)
            .join("")}</ul></div>`
        : "";

      return `<article class="day-card"><h3>${formatDateLabel(day.date)}</h3>${freeList}${eventList}</article>`;
    })
    .join("");

  slotsNode.classList.remove("empty");
  slotsNode.innerHTML = html;
}

function renderCalendars() {
  if (!state.calendars.length) {
    calendarSelect.innerHTML = '<option value="">Календари не найдены</option>';
    return;
  }

  const previousValue = calendarSelect.value;
  calendarSelect.innerHTML = state.calendars
    .map((calendar) => `<option value="${escapeHtml(calendar.url)}">${escapeHtml(calendar.name)}</option>`)
    .join("");

  if (state.calendars.some((calendar) => calendar.url === previousValue)) {
    calendarSelect.value = previousValue;
  }
}

function renderEvents() {
  if (!state.events.length) {
    eventsNode.classList.add("empty");
    eventsNode.innerHTML = "<p>В выбранном диапазоне событий нет.</p>";
    eventsSummaryNode.textContent = "Диапазон событий загружен, но список пуст.";
    return;
  }

  const recurringCount = state.events.filter((event) => event.isRecurring).length;
  eventsNode.classList.remove("empty");
  eventsSummaryNode.textContent = `Загружено событий: ${state.events.length}. Повторяющихся инстансов: ${recurringCount}. Показан диапазон на 30 дней вперёд.`;
  eventsNode.innerHTML = `<ul class="event-list full">${state.events
    .map(
      (event, index) => `
        <li class="event-row">
          <div class="event-content">
            <div class="event-title-row">
              <strong>${escapeHtml(event.summary)}</strong>
              ${event.isRecurring ? '<span class="event-badge">Экземпляр серии</span>' : ""}
            </div>
            <span class="event-meta">${formatDateTimeLabel(new Date(event.start))} - ${formatDateTimeLabel(new Date(event.end))}</span>
            <span class="event-meta">${escapeHtml(event.calendarName)}${event.location ? ` · ${escapeHtml(event.location)}` : ""}</span>
            ${event.recurrenceId ? `<span class="event-meta">RECURRENCE-ID: ${escapeHtml(event.recurrenceId)}</span>` : ""}
            ${event.description ? `<p class="event-description">${escapeHtml(event.description)}</p>` : ""}
          </div>
          <div class="event-actions">
            <button class="ghost-button" type="button" data-action="edit-event" data-index="${index}">Редактировать</button>
            <button class="secondary-button danger-button" type="button" data-action="delete-event" data-index="${index}">Удалить</button>
          </div>
        </li>`,
    )
    .join("")}</ul>`;
}

function resetEventForm() {
  eventUrlInput.value = "";
  eventUidInput.value = "";
  eventEtagInput.value = "";
  eventSummaryInput.value = "";
  eventLocationInput.value = "";
  eventDescriptionInput.value = "";

  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  eventStartInput.value = toDateTimeLocalValue(start);
  eventEndInput.value = toDateTimeLocalValue(end);
  eventSubmitButton.textContent = "Создать событие";
}

function fillEventForm(event) {
  eventUrlInput.value = event.eventUrl || "";
  eventUidInput.value = event.uid || "";
  eventEtagInput.value = event.etag || "";
  eventSummaryInput.value = event.summary || "";
  eventLocationInput.value = event.location || "";
  eventDescriptionInput.value = event.description || "";
  eventStartInput.value = toDateTimeLocalValue(new Date(event.start));
  eventEndInput.value = toDateTimeLocalValue(new Date(event.end));
  if (event.calendarUrl) {
    calendarSelect.value = event.calendarUrl;
  }
  eventSubmitButton.textContent = "Сохранить изменения";
  setEventFormVisibility(true);
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Ошибка запроса.");
  }
  return payload;
}

async function loadEmployees() {
  const config = await apiRequest("/api/employees");
  applyEmployeesConfig(config);
}

async function saveEmployee() {
  setStatus("Сохраняю сотрудника...", "");
  saveButton.disabled = true;

  try {
    const config = await apiRequest("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: employeeIdInput.value.trim(),
        name: employeeNameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value.trim(),
      }),
    });

    applyEmployeesConfig(config);
    setStatus("Сотрудник сохранён.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    saveButton.disabled = false;
  }
}

async function activateEmployee(employeeId) {
  try {
    const config = await apiRequest("/api/employees/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: employeeId }),
    });
    applyEmployeesConfig(config);
    state.calendars = [];
    state.events = [];
    renderCalendars();
    renderEvents();
    setStatus("Активный сотрудник переключен.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function deleteEmployee(employeeId) {
  try {
    const config = await apiRequest("/api/employees", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: employeeId }),
    });
    applyEmployeesConfig(config);
    state.calendars = [];
    state.events = [];
    renderCalendars();
    renderEvents();
    setStatus("Сотрудник удалён.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function loadCalendars() {
  reloadCalendarsButton.disabled = true;
  try {
    const payload = await apiRequest("/api/calendars");
    state.calendars = payload.calendars || [];
    renderCalendars();
    setStatus(`Календари обновлены: ${state.calendars.length}.`, "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    reloadCalendarsButton.disabled = false;
  }
}

async function loadEvents() {
  const { start, end } = getDefaultEventsRange();
  state.eventsRangeStart = start;
  state.eventsRangeEnd = end;
  loadEventsButton.disabled = true;
  setStatus("Загружаю события...", "");

  try {
    const payload = await apiRequest(
      `/api/events?rangeStartIso=${encodeURIComponent(start.toISOString())}&rangeEndIso=${encodeURIComponent(end.toISOString())}`,
    );
    state.events = payload.events || [];
    if (!state.calendars.length) {
      state.calendars = payload.calendars || [];
      renderCalendars();
    }
    renderEvents();
    setStatus("События загружены.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    loadEventsButton.disabled = false;
  }
}

async function checkSlots() {
  const rangeStart = toLocalDayStart(new Date());
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 14);

  setStatus("Проверяю календари Mail.ru по CalDAV...", "");
  checkButton.disabled = true;

  try {
    const payload = await apiRequest("/api/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value.trim(),
        rangeStartIso: rangeStart.toISOString(),
        rangeEndIso: rangeEnd.toISOString(),
      }),
    });

    renderSlots(payload, rangeStart, rangeEnd);
    switchTab("calendar");
    setStatus("Слоты обновлены.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    checkButton.disabled = false;
  }
}

function getEventPayloadFromForm() {
  return {
    calendarUrl: calendarSelect.value,
    eventUrl: eventUrlInput.value,
    uid: eventUidInput.value,
    etag: eventEtagInput.value,
    summary: eventSummaryInput.value.trim(),
    location: eventLocationInput.value.trim(),
    description: eventDescriptionInput.value.trim(),
    start: fromDateTimeLocalValue(eventStartInput.value),
    end: fromDateTimeLocalValue(eventEndInput.value),
  };
}

async function submitEventForm(event) {
  event.preventDefault();
  eventSubmitButton.disabled = true;
  const payload = getEventPayloadFromForm();
  const isEditing = Boolean(payload.eventUrl);
  setStatus(isEditing ? "Обновляю событие..." : "Создаю событие...", "");

  try {
    await apiRequest("/api/events", {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    resetEventForm();
    await loadEvents();
    setStatus(isEditing ? "Событие обновлено." : "Событие создано.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    eventSubmitButton.disabled = false;
  }
}

async function deleteEventByIndex(index) {
  const event = state.events[index];
  if (!event || !event.eventUrl) {
    setStatus("Удаление недоступно для этого события.", "error");
    return;
  }

  setStatus("Удаляю событие...", "");

  try {
    await apiRequest("/api/events", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventUrl: event.eventUrl,
        etag: event.etag,
      }),
    });
    await loadEvents();
    setStatus("Событие удалено.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

credentialsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveEmployee();
});

checkButton.addEventListener("click", checkSlots);
reloadCalendarsButton.addEventListener("click", loadCalendars);
loadEventsButton.addEventListener("click", loadEvents);
addEmployeeButton.addEventListener("click", startNewEmployee);
toggleEventFormButton.addEventListener("click", () => {
  setEventFormVisibility(!state.eventFormVisible);
});

eventForm.addEventListener("submit", submitEventForm);
eventResetButton.addEventListener("click", resetEventForm);

eventsNode.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const index = Number(button.dataset.index);
  if (button.dataset.action === "edit-event") {
    fillEventForm(state.events[index]);
    return;
  }

  if (button.dataset.action === "delete-event") {
    await deleteEventByIndex(index);
  }
});

employeesListNode.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  if (button.dataset.action === "select-employee") {
    await activateEmployee(button.dataset.id);
    return;
  }

  if (button.dataset.action === "delete-employee") {
    await deleteEmployee(button.dataset.id);
  }
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});

togglePasswordButton.addEventListener("click", () => {
  const shouldShowPassword = passwordInput.type === "password";
  passwordInput.type = shouldShowPassword ? "text" : "password";
  togglePasswordLabel.textContent = shouldShowPassword ? "Скрыть" : "Показать";
  togglePasswordButton.setAttribute("aria-label", shouldShowPassword ? "Скрыть пароль" : "Показать пароль");
});

resetEventForm();
setEventFormVisibility(false);

loadEmployees()
  .then(() => {
    renderCalendars();
    renderEvents();
  })
  .catch(() => {
    setStatus("Не удалось загрузить сотрудников.", "error");
  });
